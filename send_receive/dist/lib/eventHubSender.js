"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const Constants = require("./util/constants");
const _1 = require(".");
const cbs = require("./cbs");
const rheaPromise = require("./rhea-promise");
const rhea = require("rhea");
/**
 * Instantiates a new sender from the AMQP `Sender`. Used by `EventHubClient`.
 *
 * @param {any} session - The amqp session on which the amqp sender link was created.
 * @param {any} sender - The amqp sender link.
 * @constructor
 */
class EventHubSender extends events_1.EventEmitter {
    constructor(client, partitionId) {
        super();
        this.client = client;
        this.address = this.client.config.entityPath;
        this.partitionId = partitionId;
        if (this.partitionId !== null && this.partitionId !== undefined) {
            this.address += `/Partitions/${this.partitionId}`;
        }
    }
    /**
     * Negotiates the cbs claim and initializes the sender session on the connection.
     * @returns {Promoise<void>}
     */
    async init() {
        try {
            await this.client.open();
            let audience = `${this.client.config.endpoint}${this.address}`;
            const tokenObject = await this.client.tokenProvider.getToken(audience);
            await cbs.negotiateClaim(audience, this.client.connection, tokenObject);
            if (!this._session && !this._sender) {
                this._session = await rheaPromise.createSession(this.client.connection);
                let options = {
                    target: {
                        address: this.address
                    }
                };
                this._sender = await rheaPromise.createSender(this._session, options);
                this.name = this._sender.name;
            }
            this._ensureTokenRenewal();
        }
        catch (err) {
            return Promise.reject(err);
        }
    }
    /**
     * Sends the given message, with the given options on this link
     *
     * @method send
     * @param {any} data                    Message to send.  Will be sent as UTF8-encoded JSON string.
     * @param {string} [partitionKey]       Partition key - sent as x-opt-partition-key, and will hash to a partition ID.
     * @returns {any}
     */
    send(data, partitionKey) {
        if (!data || (data && typeof data !== 'object')) {
            throw new Error('data is required and it must be of type object.');
        }
        if (partitionKey && typeof partitionKey !== 'string') {
            throw new Error('partitionKey must be of type string');
        }
        if (!this._session && !this._sender) {
            throw new Error("amqp sender is not present. Hence cannot send the message.");
        }
        let message = _1.EventData.toAmqpMessage(data);
        if (partitionKey) {
            if (!message.message_annotations)
                message.message_annotations = {};
            message.message_annotations[Constants.partitionKey] = partitionKey;
        }
        return this._sender.send(message);
    }
    /**
     * Send a batch of EventData to the EventHub.
     * @param {Array<EventData>} datas  An array of EventData objects to be sent in a Batch message.
     * @param {string} [partitionKey]   Partition key - sent as x-opt-partition-key, and will hash to a partition ID.
     * @returns {any}
     */
    sendBatch(datas, partitionKey) {
        if (!datas || (datas && !Array.isArray(datas))) {
            throw new Error('data is required and it must be an Array.');
        }
        if (partitionKey && typeof partitionKey !== 'string') {
            throw new Error('partitionKey must be of type string');
        }
        if (!this._session && !this._sender) {
            throw new Error("amqp sender is not present. Hence cannot send the message.");
        }
        let messages = [];
        // Convert EventData to AmqpMessage.
        for (let i = 0; i < datas.length; i++) {
            let message = _1.EventData.toAmqpMessage(datas[i]);
            if (partitionKey) {
                if (!message.message_annotations)
                    message.message_annotations = {};
                message.message_annotations[Constants.partitionKey] = partitionKey;
            }
            messages[i] = message;
        }
        // Encode every amqp message and then convert every encoded message to amqp data section
        let batchMessage = {
            body: rhea.message.data_sections(messages.map(rhea.message.encode))
        };
        // Set message_annotations, application_properties and properties of the first message as
        // that of the envelope (batch message).
        if (messages[0].message_annotations) {
            batchMessage.message_annotations = messages[0].message_annotations;
        }
        if (messages[0].application_properties) {
            batchMessage.application_properties = messages[0].application_properties;
        }
        if (messages[0].properties) {
            batchMessage.properties = messages[0].properties;
        }
        // Finally encode the envelope (batch message).
        return this._sender.send(rhea.message.encode(batchMessage), undefined, 0x80013700);
    }
    /**
     * "Unlink" this sender, closing the link and resolving when that operation is complete. Leaves the underlying connection/session open.
     * @method close
     * @return {Promise<void>}
     */
    async close() {
        try {
            await this._sender.detach();
            this.removeAllListeners();
            this._sender = undefined;
            this._session = undefined;
        }
        catch (err) {
            return Promise.reject(err);
        }
    }
    /**
     * Ensures that the token is renewed within the predfiend renewal margin.
     * @returns {void}
     */
    _ensureTokenRenewal() {
        const tokenValidTimeInSeconds = this.client.tokenProvider.tokenValidTimeInSeconds;
        const tokenRenewalMarginInSeconds = this.client.tokenProvider.tokenRenewalMarginInSeconds;
        const nextRenewalTimeout = (tokenValidTimeInSeconds - tokenRenewalMarginInSeconds) * 1000;
        setTimeout(async () => await this.init(), nextRenewalTimeout);
    }
}
exports.EventHubSender = EventHubSender;
//# sourceMappingURL=eventHubSender.js.map