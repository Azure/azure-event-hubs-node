/// <reference types="node" />
import { EventEmitter } from "events";
import { EventHubClient, EventData } from ".";
/**
 * Instantiates a new sender from the AMQP `Sender`. Used by `EventHubClient`.
 *
 * @param {any} session - The amqp session on which the amqp sender link was created.
 * @param {any} sender - The amqp sender link.
 * @constructor
 */
export declare class EventHubSender extends EventEmitter {
    name?: string;
    client: EventHubClient;
    partitionId?: string | number;
    address: string;
    private _sender;
    private _session;
    private _tokenRenewalTimer?;
    constructor(client: EventHubClient, partitionId?: string | number);
    /**
     * Negotiates the cbs claim and initializes the sender session on the connection.
     * @returns {Promoise<void>}
     */
    init(): Promise<void>;
    /**
     * Sends the given message, with the given options on this link
     *
     * @method send
     * @param {any} data                    Message to send.  Will be sent as UTF8-encoded JSON string.
     * @param {string} [partitionKey]       Partition key - sent as x-opt-partition-key, and will hash to a partition ID.
     * @returns {any}
     */
    send(data: EventData, partitionKey?: string): any;
    /**
     * Send a batch of EventData to the EventHub.
     * @param {Array<EventData>} datas  An array of EventData objects to be sent in a Batch message.
     * @param {string} [partitionKey]   Partition key - sent as x-opt-partition-key, and will hash to a partition ID.
     * @returns {any}
     */
    sendBatch(datas: EventData[], partitionKey?: string): any;
    /**
     * "Unlink" this sender, closing the link and resolving when that operation is complete. Leaves the underlying connection/session open.
     * @method close
     * @return {Promise<void>}
     */
    close(): Promise<void>;
    /**
     * Ensures that the token is renewed within the predfiend renewal margin.
     * @returns {void}
     */
    private _ensureTokenRenewal();
}
