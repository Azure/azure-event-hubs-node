"use strict";
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
Object.defineProperty(exports, "__esModule", { value: true });
const eventHubClient_1 = require("../eventHubClient");
const events_1 = require("events");
const debugModule = require("debug");
const errors_1 = require("../errors");
const partitionContext_1 = require("./partitionContext");
const leaseManager_1 = require("./leaseManager");
const lease_1 = require("./lease");
const debug = debugModule("azure:event-hubs:processor:host");
class EventProcessorHost extends events_1.EventEmitter {
    constructor(name, consumerGroup, storageConnectionString, eventHubClient) {
        super();
        function ensure(paramName, param) {
            if (!param)
                throw new errors_1.ArgumentError(paramName + " cannot be null or missing");
        }
        ensure("name", name);
        ensure("consumerGroup", consumerGroup);
        ensure("storageConnectionString", storageConnectionString);
        ensure("eventHubClient", eventHubClient);
        this._hostName = name;
        this._consumerGroup = consumerGroup;
        this._eventHubClient = eventHubClient;
        this._storageConnectionString = storageConnectionString;
    }
    /**
     * Starts the event processor host, fetching the list of partitions, (optionally) filtering them, and attempting
     * to grab leases on the (filtered) set. For each successful lease, will get the details from the blob and start
     * a receiver at the point where it left off previously.
     *
     * @method start
     * @param {function} [partitionFilter]  Predicate that takes a partition ID and return true/false for whether we should
     *  attempt to grab the lease and watch it. If not provided, all partitions will be tried.
     *
     * @return {Promise}
     */
    async start(partitionFilter) {
        try {
            this._contextByPartition = {};
            this._receiverByPartition = {};
            this._leaseManager = new leaseManager_1.default();
            this._leaseManager.on(leaseManager_1.default.acquired, (lease) => {
                debug("Acquired lease on " + lease.partitionId);
                this._attachReceiver(lease.partitionId);
            });
            this._leaseManager.on(leaseManager_1.default.lost, (lease) => {
                debug("Lost lease on " + lease.partitionId);
                this._detachReceiver(lease.partitionId, "Lease lost");
            });
            this._leaseManager.on(leaseManager_1.default.released, (lease) => {
                debug("Released lease on " + lease.partitionId);
                this._detachReceiver(lease.partitionId, "Lease released");
            });
            const ids = await this._eventHubClient.getPartitionIds();
            for (let i = 0; i < ids.length; i++) {
                let id = ids[i];
                if (partitionFilter && !partitionFilter(id)) {
                    debug("Skipping partition " + id);
                    continue;
                }
                debug("Managing lease for partition " + id);
                const blobPath = this._consumerGroup + "/" + id;
                const lease = new lease_1.default(this._storageConnectionString, this._hostName, blobPath);
                lease.partitionId = id;
                this._contextByPartition[id] = new partitionContext_1.default(id, this._hostName, lease);
                this._leaseManager.manageLease(lease);
            }
        }
        catch (err) {
            return Promise.reject(err);
        }
        return this;
    }
    async stop() {
        const unmanage = (l) => { return this._leaseManager.unmanageLease(l); };
        let releases = [];
        for (const partitionId in this._contextByPartition) {
            if (!this._contextByPartition.hasOwnProperty(partitionId))
                continue;
            const id = partitionId;
            const context = this._contextByPartition[id];
            await this._detachReceiver(id);
            unmanage.bind(undefined, context.lease);
            releases.push();
        }
        return Promise.all(releases).then(() => {
            this._leaseManager = undefined;
            this._contextByPartition = {};
        });
    }
    async _attachReceiver(partitionId) {
        const context = this._contextByPartition[partitionId];
        if (!context)
            return Promise.reject(new Error("Invalid state - missing context for partition " + partitionId));
        const checkpoint = await context.updateCheckpointDataFromLease();
        let filterOptions;
        if (checkpoint && checkpoint.offset) {
            filterOptions = { startAfterOffset: checkpoint.offset };
        }
        const receiver = await this._eventHubClient.createReceiver(partitionId, { consumerGroup: this._consumerGroup, filter: filterOptions });
        debug(`[${this._eventHubClient.connection.options.id}] Attaching receiver "${receiver.name}" for partition "${partitionId}" with offset: ${(checkpoint ? checkpoint.offset : "None")}`);
        this.emit(EventProcessorHost.opened, context);
        this._receiverByPartition[partitionId] = receiver;
        receiver.on("message", (message) => {
            context.updateCheckpointDataFromMessage(message);
            this.emit(EventProcessorHost.message, context, message);
        });
        return receiver;
    }
    async _detachReceiver(partitionId, reason) {
        const context = this._contextByPartition[partitionId];
        const receiver = this._receiverByPartition[partitionId];
        if (receiver) {
            delete this._receiverByPartition[partitionId];
            await receiver.close();
            debug(`[${this._eventHubClient.connection.options.id}] Closed the receiver "${receiver.name}".`);
            this.emit(EventProcessorHost.closed, context, reason);
        }
    }
    static createFromConnectionString(name, consumerGroup, storageConnectionString, eventHubConnectionString, eventHubPath) {
        return new EventProcessorHost(name, consumerGroup, storageConnectionString, eventHubClient_1.EventHubClient.createFromConnectionString(eventHubConnectionString, eventHubPath));
    }
}
/**
 * Opened: Triggered whenever a partition obtains its lease. Passed the PartitionContext.
 */
EventProcessorHost.opened = "ephost:opened";
/**
 * Triggered whenever a partition loses its lease and has to stop receiving,
 * or when the host is shut down. Passed the PartitionContext and the closing reason.
 */
EventProcessorHost.closed = "ephost:closed";
/**
 * Message: Triggered whenever a message comes in on a given partition.
 * Passed the PartitionContext and a message.
 */
EventProcessorHost.message = "ephost:message";
exports.default = EventProcessorHost;
//# sourceMappingURL=eventProcessorHost.js.map