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
    /**
     * @property {string} [name] The unique EventHub Sender name (mostly a guid).
     */
    name?: string;
    /**
     * @property {EventHubClient} client The EventHub client to which the sender belongs to.
     */
    client: EventHubClient;
    /**
     * @property {string} [partitionId] The partitionId to which the sender wants to send the EventData.
     */
    partitionId?: string | number;
    /**
     * @property {string} address The EventHub Sender address.
     */
    address: string;
    /**
     * @property {string} audience The EventHub Sender token audience.
     */
    audience: string;
    /**
     * @property {any} [_sender] The AMQP sender link.
     * @private
     */
    private _sender?;
    /**
     * @property {any} [_session] The AMQP sender session.
     * @private
     */
    private _session?;
    /**
     * @property {NodeJS.Timer} _tokenRenewalTimer The token renewal timer that keeps track of when the EventHub Sender is due for token renewal.
     * @private
     */
    private _tokenRenewalTimer?;
    /**
     * Creates a new EventHubSender instance.
     * @constructor
     * @param {EventHubClient} client The EventHub client.
     * @param {string|number} [partitionId] The EventHub partition id to which the sender wants to send the event data.
     */
    constructor(client: EventHubClient, partitionId?: string | number);
    /**
     * Initializes the sender session on the connection.
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
