"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.
Object.defineProperty(exports, "__esModule", { value: true });
const rhea = require("rhea");
const debugModule = require("debug");
const rheaPromise = require("./rhea-promise");
const errors = require("./errors");
const Constants = require("./util/constants");
const events_1 = require("events");
const eventData_1 = require("./eventData");
const debug = debugModule("azure:event-hubs:receiver");
/**
 * Describes the EventHubReceiver that will receive event data from EventHub.
 * @class EventHubReceiver
 */
class EventHubReceiver extends events_1.EventEmitter {
    /**
     * Instantiate a new receiver from the AMQP `Receiver`. Used by `EventHubClient`.
     *
     * @constructor
     * @param {EventHubClient} client                            The EventHub client.
     * @param {string} partitionId                               Partition ID from which to receive.
     * @param {ReceiveOptions} [options]                         Options for how you'd like to connect.
     * @param {string} [options.consumerGroup]                   Consumer group from which to receive.
     * @param {number} [options.prefetchcount]                   The upper limit of events this receiver will
     * actively receive regardless of whether a receive operation is pending.
     * @param {boolean} [options.enableReceiverRuntimeMetric]    Provides the approximate receiver runtime information
     * for a logical partition of an Event Hub if the value is true. Default false.
     * @param {number} [options.epoch]                           The epoch value that this receiver is currently
     * using for partition ownership. A value of undefined means this receiver is not an epoch-based receiver.
     * @param {EventPosition} [options.eventPosition]            The position of EventData in the EventHub parition from
     * where the receiver should start receiving. Only one of offset, sequenceNumber, enqueuedTime, customFilter can be specified.
     * `EventPosition.withCustomFilter()` should be used if you want more fine-grained control of the filtering.
     * See https://github.com/Azure/amqpnetlite/wiki/Azure%20Service%20Bus%20Event%20Hubs for details.
     */
    constructor(client, partitionId, options) {
        super();
        /**
         * @property {number} [prefetchCount] The number of messages that the receiver can fetch/receive initially. Defaults to 500.
         */
        this.prefetchCount = 500;
        /**
         * @property {boolean} receiverRuntimeMetricEnabled Indicates whether receiver runtime metric is enabled. Default: false.
         */
        this.receiverRuntimeMetricEnabled = false;
        if (!options)
            options = {};
        this.client = client;
        this.partitionId = partitionId;
        this.consumerGroup = options.consumerGroup ? options.consumerGroup : Constants.defaultConsumerGroup;
        this.address = `${this.client.config.entityPath}/ConsumerGroups/${this.consumerGroup}/Partitions/${this.partitionId}`;
        this.audience = `${this.client.config.endpoint}${this.address}`;
        this.prefetchCount = options.prefetchCount !== undefined && options.prefetchCount !== null ? options.prefetchCount : 500;
        this.epoch = options.epoch;
        this.options = options;
        this.receiverRuntimeMetricEnabled = options.enableReceiverRuntimeMetric || false;
        this.runtimeInfo = {
            paritionId: `${partitionId}`
        };
        const onMessage = (context) => {
            const evData = eventData_1.EventData.fromAmqpMessage(context.message);
            this.emit(Constants.message, evData);
        };
        const onError = (context) => {
            this.emit(Constants.error, errors.translate(context.receiver.error));
        };
        this.on("newListener", (event) => {
            if (event === Constants.message) {
                if (this._session && this._receiver) {
                    this._receiver.on(Constants.message, onMessage);
                }
            }
            if (event === Constants.receiverError) {
                if (this._session && this._receiver) {
                    this._receiver.on(Constants.receiverError, onError);
                }
            }
        });
        this.on("removeListener", (event) => {
            if (event === Constants.message) {
                if (this._session && this._receiver) {
                    this._receiver.on(Constants.message, onMessage);
                }
            }
            if (event === Constants.receiverError) {
                if (this._session && this._receiver) {
                    this._receiver.on(Constants.receiverError, onError);
                }
            }
        });
    }
    /**
     * Creates a new AMQP receiver under a new AMQP session.
     * @returns {Promoise<void>}
     */
    async init() {
        try {
            if (!this._session && !this._receiver) {
                let rcvrOptions = {
                    autoaccept: false,
                    source: {
                        address: this.address
                    },
                    prefetch: this.prefetchCount,
                };
                if (this.epoch !== undefined && this.epoch !== null) {
                    if (!rcvrOptions.properties)
                        rcvrOptions.properties = {};
                    rcvrOptions.properties[Constants.attachEpoch] = rhea.types.wrap_long(this.epoch);
                }
                if (this.receiverRuntimeMetricEnabled) {
                    rcvrOptions.desired_capabilities = Constants.enableReceiverRuntimeMetricName;
                }
                if (this.options && this.options.eventPosition) {
                    // Set filter on the receiver if event position is specified.
                    let filterClause = this.options.eventPosition.getExpression();
                    if (filterClause) {
                        rcvrOptions.source.filter = {
                            "apache.org:selector-filter:string": rhea.types.wrap_described(filterClause, 0x468C00000004)
                        };
                    }
                }
                this._session = await rheaPromise.createSession(this.client.connection);
                this._receiver = await rheaPromise.createReceiver(this._session, rcvrOptions);
                this.name = this._receiver.name;
                debug(`[${this.client.connection.options.id}] Receiver "${this.name}" created with receiver options.`, rcvrOptions);
                debug(`[${this.client.connection.options.id}] Negotatited claim for receiver "${this.name}" with with partition "${this.partitionId}"`);
            }
            this._ensureTokenRenewal();
        }
        catch (err) {
            return Promise.reject(err);
        }
    }
    /**
     * Receive a batch of EventDatas from an EventHub partition for a given count and a given max wait time in seconds, whichever
     * happens first.
     *
     * @param {number} maxMessageCount                         The maximum message count. Must be a value greater than 0.
     * @param {number} [maxWaitTimeInSeconds]          The maximum wait time in seconds for which the Receiver should wait
     * to receiver the said amount of messages. If not provided, it defaults to 60 seconds.
     * @returns {Promise<EventData[]>} A promise that resolves with an array of EventData objects.
     */
    async receive(maxMessageCount, maxWaitTimeInSeconds) {
        if (!maxMessageCount || (maxMessageCount && typeof maxMessageCount !== 'number')) {
            throw new Error("'maxMessageCount' is a required parameter of type number with a value greater than 0.");
        }
        if (maxWaitTimeInSeconds === null || maxWaitTimeInSeconds === undefined) {
            maxWaitTimeInSeconds = Constants.defaultOperationTimeoutInSeconds;
        }
        try {
            let eventDatas = [];
            let count = 0;
            let timeOver = false;
            return new Promise((resolve, reject) => {
                const actionAfterWaitTimeout = () => {
                    timeOver = true;
                    let data = eventDatas.length ? eventDatas[eventDatas.length - 1] : undefined;
                    if (this.receiverRuntimeMetricEnabled && data) {
                        this.runtimeInfo.lastSequenceNumber = data.lastSequenceNumber;
                        this.runtimeInfo.lastEnqueuedTimeUtc = data.lastEnqueuedTime;
                        this.runtimeInfo.lastEnqueuedOffset = data.lastEnqueuedOffset;
                        this.runtimeInfo.retrievalTime = data.retrievalTime;
                    }
                    resolve(eventDatas);
                };
                let waitTimer = setTimeout(actionAfterWaitTimeout, maxWaitTimeInSeconds * 1000);
                // Action to be performed on the "message" event.
                const onReceiveMessage = (data) => {
                    if (!timeOver && count <= maxMessageCount) {
                        count++;
                        eventDatas.push(data);
                    }
                    if (count === maxMessageCount) {
                        this.removeListener(Constants.message, onReceiveMessage);
                        clearTimeout(waitTimer);
                        if (this.receiverRuntimeMetricEnabled) {
                            this.runtimeInfo.lastSequenceNumber = data.lastSequenceNumber;
                            this.runtimeInfo.lastEnqueuedTimeUtc = data.lastEnqueuedTime;
                            this.runtimeInfo.lastEnqueuedOffset = data.lastEnqueuedOffset;
                            this.runtimeInfo.retrievalTime = data.retrievalTime;
                        }
                        resolve(eventDatas);
                    }
                };
                this.on(Constants.message, onReceiveMessage);
            });
        }
        catch (err) {
            return Promise.reject(err);
        }
    }
    /**
     * Closes the underlying AMQP receiver.
     */
    async close() {
        try {
            // TODO: should I call _receiver.detach() or _receiver.close()?
            // should I also call this._session.close() after closing the reciver
            // or can I directly close the session which will take care of closing the receiver as well.
            await this._receiver.detach();
            this.removeAllListeners();
            delete this.client.receivers[this.name];
            debug(`Deleted the receiver "${this.name}" from the client cache.`);
            this._receiver = undefined;
            this._session = undefined;
            clearTimeout(this._tokenRenewalTimer);
            debug(`[${this.client.connection.options.id}] Receiver "${this.name}" has been closed.`);
        }
        catch (err) {
            return Promise.reject(err);
        }
    }
    /**
     * Ensures that the token is renewed within the predfiend renewal margin.
     */
    _ensureTokenRenewal() {
        const tokenValidTimeInSeconds = this.client.tokenProvider.tokenValidTimeInSeconds;
        const tokenRenewalMarginInSeconds = this.client.tokenProvider.tokenRenewalMarginInSeconds;
        const nextRenewalTimeout = (tokenValidTimeInSeconds - tokenRenewalMarginInSeconds) * 1000;
        this._tokenRenewalTimer = setTimeout(async () => await this.init(), nextRenewalTimeout);
        debug(`[${this.client.connection.options.id}] Receiver "${this.name}", has next token renewal in ${nextRenewalTimeout / 1000} seconds ` +
            `@(${new Date(Date.now() + nextRenewalTimeout).toString()}).`);
    }
}
exports.EventHubReceiver = EventHubReceiver;
//# sourceMappingURL=eventHubReceiver.js.map