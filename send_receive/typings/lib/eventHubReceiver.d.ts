/// <reference types="node" />
import { EventEmitter } from "events";
import { EventData } from "./eventData";
import { EventHubClient, ReceiveOptions } from ".";
/**
 * Represents the approximate receiver runtime information for a logical partition of an Event Hub.
 * @interface ReceiverRuntimeInfo
 */
export interface ReceiverRuntimeInfo {
    /**
     * @property {string} partitionId The parition identifier.
     */
    paritionId: string;
    /**
     * @property {number} lastSequenceNumber The logical sequence number of the event.
     */
    lastSequenceNumber?: number;
    /**
     * @property {Date} lastEnqueuedTimeUtc The enqueued time of the last event.
     */
    lastEnqueuedTimeUtc?: Date;
    /**
     * @property {string} lastEnqueuedOffset The offset of the last enqueued event.
     */
    lastEnqueuedOffset?: string;
    /**
     * @property {Date} retrievalTime The enqueued time of the last event.
     */
    retrievalTime?: Date;
}
export declare class EventHubReceiver extends EventEmitter {
    address: string;
    client: EventHubClient;
    consumerGroup: string;
    partitionId: string;
    runtimeInfo: ReceiverRuntimeInfo;
    epoch?: number;
    name?: string;
    options?: ReceiveOptions;
    prefetchCount?: number;
    receiverRuntimeMetricEnabled: boolean;
    private _receiver;
    private _session;
    private _tokenRenewalTimer?;
    /**
     * Instantiate a new receiver from the AMQP `Receiver`. Used by `EventHubClient`.
     *
     * @constructor
     * @param {EventHubClient} client                            The EventHub client.
     * @param {string} partitionId                    Partition ID from which to receive.
     * @param {ReceiveOptions} [options]                         Options for how you'd like to connect.
     * @param {string} [options.consumerGroup]                   Consumer group from which to receive.
     * @param {number} [options.prefetchcount]                   The upper limit of events this receiver will
     * actively receive regardless of whether a receive operation is pending.
     * @param {boolean} [options.enableReceiverRuntimeMetric]    Provides the approximate receiver runtime information
     * for a logical partition of an Event Hub if the value is true. Default false.
     * @param {number} [options.epoch]                           The epoch value that this receiver is currently
     * using for partition ownership. A value of undefined means this receiver is not an epoch-based receiver.
     * @param {ReceiveOptions.filter} [options.filter]           Filter settings on the receiver. Only one of
     * startAfterTime, startAfterOffset, customFilter can be specified
     * @param {(Date|Number)} options.filter.startAfterTime      Only receive messages enqueued after the given time.
     * @param {string} options.filter.startAfterOffset           Only receive messages after the given offset.
     * @param {string} options.filter.customFilter               If you want more fine-grained control of the filtering.
     *      See https://github.com/Azure/amqpnetlite/wiki/Azure%20Service%20Bus%20Event%20Hubs for details.
     */
    constructor(client: EventHubClient, partitionId: string, options?: ReceiveOptions);
    /**
     * Negotiates the CBS claim and creates a new AMQP receiver under a new AMQP session.
     */
    init(): Promise<void>;
    /**
     * Receive a batch of EventDatas from an EventHub partition for a given count and a given max wait time in seconds, whichever
     * happens first.
     *
     * @param {number} maxMessageCount                         The maximum message count. Must be a value greater than 0.
     * @param {number} [maxWaitTimeInSeconds]          The maximum wait time in seconds for which the Receiver should wait
     * to receiver the said amount of messages. If not provided, it defaults to 60 seconds.
     * @returns {Promise<EventData[]>} A promise that resolves with an array of EventData objects.
     */
    receive(maxMessageCount: number, maxWaitTimeInSeconds?: number): Promise<EventData[]>;
    /**
     * Closes the underlying AMQP receiver.
     */
    close(): Promise<void>;
    /**
     * Ensures that the token is renewed within the predfiend renewal margin.
     */
    private _ensureTokenRenewal();
}
