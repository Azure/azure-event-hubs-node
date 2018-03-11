"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.
Object.defineProperty(exports, "__esModule", { value: true });
const rheaPromise = require("./rhea-promise");
const uuid = require("uuid/v4");
const Constants = require("./util/constants");
const ms_rest_azure_1 = require("ms-rest-azure");
const _1 = require(".");
const sas_1 = require("./auth/sas");
const aad_1 = require("./auth/aad");
const os = require("os");
const process = require("process");
const Buffer = require("buffer/").Buffer;
class EventHubClient {
    /**
     * Instantiate a client pointing to the Event Hub given by this configuration.
     *
     * @constructor
     * @param {ConnectionConfig} config - The connection configuration to create the EventHub Client.
     * @param {TokenProvider} [tokenProvider] - The token provider that provides the token for authentication.
     */
    constructor(config, tokenProvider) {
        this.userAgent = "/js-event-hubs";
        this.config = config;
        if (!tokenProvider) {
            tokenProvider = new sas_1.SasTokenProvider(config.endpoint, config.sharedAccessKeyName, config.sharedAccessKey);
        }
        this.tokenProvider = tokenProvider;
        this.userAgent = "/js-event-hubs";
    }
    /**
     * Opens the AMQP connection to the Event Hub for this client, returning a promise
     * that will be resolved when the connection is completed.
     * @method open
     *
     * @param {boolean} [useSaslPlain] - True for using sasl plain mode for authentication, false otherwise.
     * @returns {Promise<void>}
     */
    async open(useSaslPlain) {
        if (useSaslPlain && typeof useSaslPlain !== "boolean") {
            throw new Error("'useSaslPlain' must be of type 'boolean'.");
        }
        if (!this.connection) {
            const connectOptions = {
                transport: Constants.TLS,
                host: this.config.host,
                hostname: this.config.host,
                username: this.config.sharedAccessKeyName,
                port: 5671,
                reconnect_limit: 100,
                properties: {
                    product: "MSJSClient",
                    version: Constants.packageJsonInfo.version || "0.1.0",
                    platform: `(${os.arch()}-${os.type()}-${os.release()})`,
                    framework: `Node/${process.version}`,
                    "user-agent": this.userAgent
                }
            };
            if (useSaslPlain) {
                connectOptions.password = this.config.sharedAccessKey;
            }
            this.connection = await rheaPromise.connect(connectOptions);
        }
    }
    /**
     * Closes the AMQP connection to the Event Hub for this client,
     * returning a promise that will be resolved when disconnection is completed.
     * @method close
     * @returns {Promise}
     */
    async close() {
        if (this.connection) {
            await this.connection.close();
        }
    }
    /**
     * Provides the eventhub runtime information.
     * @method getHubRuntimeInformation
     * @returns {Promise<EventHubRuntimeInformation>}
     */
    async getHubRuntimeInformation() {
        const info = await this._makeManagementRequest(Constants.eventHub);
        const runtimeInfo = {
            path: info.name,
            createdAt: new Date(info.created_at),
            partitionCount: info.partition_count,
            partitionIds: info.partition_ids,
            type: info.type
        };
        return Promise.resolve(runtimeInfo);
    }
    /**
     * Provides an array of partitionIds.
     * @method getPartitionIds
     * @returns {Promise<Array<string>>}
     */
    async getPartitionIds() {
        let runtimeInfo = await this.getHubRuntimeInformation();
        return runtimeInfo.partitionIds;
    }
    /**
     * Provides information about the specified partition.
     * @method getPartitionInformation
     * @param {(string|number)} partitionId Partition ID for which partition information is required.
     */
    async getPartitionInformation(partitionId) {
        if (!partitionId || (partitionId && typeof partitionId !== "string" && typeof partitionId !== "number")) {
            throw new Error("'partitionId' is a required parameter and must be of type: 'string' | 'number'.");
        }
        const info = await this._makeManagementRequest(Constants.partition, partitionId);
        const partitionInfo = {
            beginningSequenceNumber: info.begin_sequence_number,
            hubPath: info.name,
            lastEnqueuedOffset: info.last_enqueued_offset,
            lastEnqueuedTimeUtc: info.last_enqueued_time_utc,
            lastSequenceNumber: info.last_enqueued_sequence_number,
            partitionId: info.partition,
            type: info.type
        };
        return partitionInfo;
    }
    /**
     * Creates a sender to the given event hub, and optionally to a given partition.
     * @method createSender
     * @param {(string|number)} [partitionId] Partition ID to which it will send messages.
     * @returns {Promise<EventHubSender>}
     */
    async createSender(partitionId) {
        if (partitionId && typeof partitionId !== "string" && typeof partitionId !== "number") {
            throw new Error("'partitionId' is a required parameter and must be of type: 'string' | 'number'.");
        }
        try {
            let ehSender = new _1.EventHubSender(this, partitionId);
            await ehSender.init();
            return ehSender;
        }
        catch (err) {
            return Promise.reject(err);
        }
    }
    /**
     * Creates a receiver for the given event hub, consumer group, and partition.
     * Receivers are event emitters, watch for 'message' event.
     * @method createReceiver
     * @param {(string | number)} partitionId             Partition ID from which to receive.
     * @param {ReceiveOptions} [options]                  Options for how you'd like to connect. Only one can be specified.
     * @param {(Date|Number)} options.startAfterTime      Only receive messages enqueued after the given time.
     * @param {string} options.startAfterOffset           Only receive messages after the given offset.
     * @param {string} options.customFilter               If you want more fine-grained control of the filtering.
     * @param {string} options.consumerGroup              Consumer group from which to receive.
     *      See https://github.com/Azure/amqpnetlite/wiki/Azure%20Service%20Bus%20Event%20Hubs for details.
     *
     * @return {Promise<EventHubReceiver>}
     */
    async createReceiver(partitionId, options) {
        if (!partitionId || (partitionId && typeof partitionId !== "string" && typeof partitionId !== "number")) {
            throw new Error("'partitionId' is a required parameter and must be of type: 'string' | 'number'.");
        }
        try {
            let ehReceiver = new _1.EventHubReceiver(this, partitionId, options);
            await ehReceiver.init();
            return ehReceiver;
        }
        catch (err) {
            return Promise.reject(err);
        }
    }
    /**
     * @private
     * Helper method to make the management request
     * @param {string} type - The type of entity requested for. Valid values are "eventhub", "partition"
     * @param {string | number} [partitionId] - The partitionId. Required only when type is "partition".
     */
    async _makeManagementRequest(type, partitionId) {
        if (partitionId && typeof partitionId !== "string" && typeof partitionId !== "number") {
            throw new Error("'partitionId' is a required parameter and must be of type: 'string' | 'number'.");
        }
        return new Promise(async (resolve, reject) => {
            try {
                const endpoint = Constants.management;
                const replyTo = uuid();
                const request = {
                    body: Buffer.from(JSON.stringify([])),
                    properties: {
                        message_id: uuid(),
                        reply_to: replyTo
                    },
                    application_properties: {
                        operation: Constants.readOperation,
                        name: this.config.entityPath,
                        type: `${Constants.vendorString}:${type}`
                    }
                };
                if (partitionId && type === Constants.partition) {
                    request.application_properties.partition = partitionId;
                }
                const rxopt = { source: { address: endpoint }, name: replyTo, target: { address: replyTo } };
                await this.open();
                const session = await rheaPromise.createSession(this.connection);
                const [sender, receiver] = await Promise.all([
                    rheaPromise.createSender(session, { target: { address: endpoint } }),
                    rheaPromise.createReceiver(session, rxopt)
                ]);
                // TODO: Handle timeout incase SB/EH does not send a response.
                receiver.on(Constants.message, ({ message, delivery }) => {
                    const code = message.application_properties[Constants.statusCode];
                    const desc = message.application_properties[Constants.statusDescription];
                    if (code === 200) {
                        return resolve(message.body);
                    }
                    else if (code === 404) {
                        return reject(desc);
                    }
                });
                sender.send(request);
            }
            catch (err) {
                reject(err);
            }
        });
    }
    /**
     * Creates an EventHub Client from connection string.
     * @method createFromConnectionString
     * @param {string} connectionString - Connection string of the form 'Endpoint=sb://my-servicebus-namespace.servicebus.windows.net/;SharedAccessKeyName=my-SA-name;SharedAccessKey=my-SA-key'
     * @param {string} [path] - EventHub path of the form 'my-event-hub-name'
     * @param {TokenProvider} [tokenProvider] - An instance of the token provider that provides the token for authentication.
     * @returns {EventHubClient} - An instance of the eventhub client.
     */
    static createFromConnectionString(connectionString, path, tokenProvider) {
        if (!connectionString || (connectionString && typeof connectionString !== "string")) {
            throw new Error("'connectionString' is a required parameter and must be of type: 'string'.");
        }
        const config = _1.ConnectionConfig.create(connectionString, path);
        if (!config.entityPath) {
            throw new Error(`Either the connectionString must have "EntityPath=<path-to-entity>" or you must provide "path", while creating the client`);
        }
        return new EventHubClient(config, tokenProvider);
    }
    /**
     * Creates an EventHub Client from AADTokenCredentials.
     * @method
     * @param {string} host - Fully qualified domain name for Event Hubs. Most likely, {yournamespace}.servicebus.windows.net
     * @param {string} entityPath - EventHub path of the form 'my-event-hub-name'
     */
    static createFromAadTokenCredentials(host, entityPath, credentials) {
        if (!host || (host && typeof host !== "string")) {
            throw new Error("'host' is a required parameter and must be of type: 'string'.");
        }
        if (!entityPath || (entityPath && typeof entityPath !== "string")) {
            throw new Error("'entityPath' is a required parameter and must be of type: 'string'.");
        }
        if (!credentials ||
            (credentials &&
                !(credentials instanceof ms_rest_azure_1.ApplicationTokenCredentials ||
                    credentials instanceof ms_rest_azure_1.UserTokenCredentials ||
                    credentials instanceof ms_rest_azure_1.DeviceTokenCredentials ||
                    credentials instanceof ms_rest_azure_1.MSITokenCredentials))) {
            throw new Error("'credentials' is a required parameter and must be an instance of ApplicationTokenCredentials | UserTokenCredentials | DeviceTokenCredentials | MSITokenCredentials.");
        }
        if (!host.endsWith("/"))
            host += "/";
        const connectionString = `Endpoint=sb://${host};SharedAccessKeyName=defaultKeyName;SharedAccessKey=defaultKeyValue`;
        const tokenProvider = new aad_1.AadTokenProvider(credentials);
        return EventHubClient.createFromConnectionString(connectionString, entityPath, tokenProvider);
    }
}
exports.EventHubClient = EventHubClient;
//# sourceMappingURL=eventHubClient.js.map