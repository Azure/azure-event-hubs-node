/// <reference types="node" />
import { EventEmitter } from "events";
import { EventHubClient, ReceiveOptions } from ".";
export declare class EventHubReceiver extends EventEmitter {
    client: EventHubClient;
    name?: string;
    partitionId: string | number;
    consumerGroup: string;
    address: string;
    options?: ReceiveOptions;
    prefetchCount?: number;
    private _receiver;
    private _session;
    /**
     * Instantiate a new receiver from the AMQP `Receiver`. Used by `EventHubClient`.
     *
     * @constructor
     * @param {EventHubClient} client                            The EventHub client.
     * @param {(string | number)} partitionId                    Partition ID from which to receive.
     * @param {ReceiveOptions} [options]                         Options for how you'd like to connect.
     * @param {string} options.consumerGroup                     Consumer group from which to receive.
     * @param {ReceiveOptions.filter} [options.filter]           Filter settings on the receiver. Only one of
     * startAfterTime, startAfterOffset, customFilter can be specified
     * @param {(Date|Number)} options.filter.startAfterTime      Only receive messages enqueued after the given time.
     * @param {string} options.filter.startAfterOffset           Only receive messages after the given offset.
     * @param {string} options.filter.customFilter               If you want more fine-grained control of the filtering.
     *      See https://github.com/Azure/amqpnetlite/wiki/Azure%20Service%20Bus%20Event%20Hubs for details.
     */
    constructor(client: EventHubClient, partitionId: string | number, options?: ReceiveOptions);
    /**
     * Negotiates the CBS claim and creates a new AMQP receiver under a new AMQP session.
     */
    init(): Promise<void>;
    /**
     * Closes the underlying AMQP receiver.
     */
    close(): Promise<void>;
    /**
     * Ensures that the token is renewed within the predfiend renewal margin.
     */
    private _ensureTokenRenewal();
}
