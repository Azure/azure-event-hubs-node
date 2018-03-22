/// <reference types="node" />
import { EventHubClient } from "../eventHubClient";
import { EventEmitter } from "events";
export default class EventProcessorHost extends EventEmitter {
    /**
     * Opened: Triggered whenever a partition obtains its lease. Passed the PartitionContext.
     */
    static opened: string;
    /**
     * Triggered whenever a partition loses its lease and has to stop receiving,
     * or when the host is shut down. Passed the PartitionContext and the closing reason.
     */
    static closed: string;
    /**
     * Message: Triggered whenever a message comes in on a given partition.
     * Passed the PartitionContext and a message.
     */
    static message: string;
    private _hostName;
    private _consumerGroup;
    private _storageConnectionString;
    private _eventHubClient;
    private _leaseManager?;
    private _contextByPartition?;
    private _receiverByPartition?;
    constructor(name: string, consumerGroup: string, storageConnectionString: string, eventHubClient: EventHubClient);
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
    start(partitionFilter?: Function): Promise<EventProcessorHost>;
    stop(): Promise<void>;
    private _attachReceiver(partitionId);
    private _detachReceiver(partitionId, reason?);
    static createFromConnectionString(name: string, consumerGroup: string, storageConnectionString: string, eventHubConnectionString: string, eventHubPath: string): EventProcessorHost;
}
