import { ApplicationTokenCredentials, DeviceTokenCredentials, UserTokenCredentials, MSITokenCredentials } from "ms-rest-azure";
import { EventHubReceiver, EventHubSender, ConnectionConfig } from ".";
import { TokenProvider } from "./auth/token";
export interface ReceiveOptions {
    filter?: {
        startAfterTime?: Date | number;
        startAfterOffset?: string;
        customFilter?: string;
    };
    consumerGroup?: string;
    enableReceiverRuntimeMetric?: boolean;
}
export interface EventHubRuntimeInformation {
    /**
     * @property {string} path - The name of the event hub.
     */
    path: string;
    /**
     * @property {Date} createdAt - The date and time the hub was created in UTC.
     */
    createdAt: Date;
    /**
     * @property {number} partitionCount - The number of partitions in the event hub.
     */
    partitionCount: number;
    /**
     * @property {string[]} partitionIds - The slice of string partition identifiers.
     */
    partitionIds: string[];
    /**
     * @property {string} type - The type of entity.
     */
    type: "com.microsoft:eventhub";
}
export interface EventHubPartitionRuntimeInformation {
    /**
     * @property {string} hubPath - The name of the eventhub.
     */
    hubPath: string;
    /**
     * @property {string} partitionId - Identifier of the partition within the eventhub.
     */
    partitionId: string;
    /**
     * @property {number} beginningSequenceNumber - The starting sequence number of the partition's message log.
     */
    beginningSequenceNumber: number;
    /**
     * @property {number} lastSequenceNumber - The last sequence number of the partition's message log.
     */
    lastSequenceNumber: number;
    /**
     * @property {number} lastEnqueuedOffset - The offset of the last enqueued message in the partition's message log.
     */
    lastEnqueuedOffset: number;
    /**
     * @property {Date} lastEnqueuedTimeUtc - The time of the last enqueued message in the partition's message log in UTC.
     */
    lastEnqueuedTimeUtc: Date;
    /**
     * @property {string} type - The type of entity.
     */
    type: "com.microsoft:partition";
}
export declare class EventHubClient {
    config: ConnectionConfig;
    tokenProvider: TokenProvider;
    connection: any;
    userAgent: string;
    /**
     * Instantiate a client pointing to the Event Hub given by this configuration.
     *
     * @constructor
     * @param {ConnectionConfig} config - The connection configuration to create the EventHub Client.
     * @param {TokenProvider} [tokenProvider] - The token provider that provides the token for authentication.
     */
    constructor(config: ConnectionConfig, tokenProvider?: TokenProvider);
    /**
     * Opens the AMQP connection to the Event Hub for this client, returning a promise
     * that will be resolved when the connection is completed.
     * @method open
     *
     * @param {boolean} [useSaslPlain] - True for using sasl plain mode for authentication, false otherwise.
     * @returns {Promise<void>}
     */
    open(useSaslPlain?: boolean): Promise<void>;
    /**
     * Closes the AMQP connection to the Event Hub for this client,
     * returning a promise that will be resolved when disconnection is completed.
     * @method close
     * @returns {Promise}
     */
    close(): Promise<any>;
    /**
     * Provides the eventhub runtime information.
     * @method getHubRuntimeInformation
     * @returns {Promise<EventHubRuntimeInformation>}
     */
    getHubRuntimeInformation(): Promise<EventHubRuntimeInformation>;
    /**
     * Provides an array of partitionIds.
     * @method getPartitionIds
     * @returns {Promise<Array<string>>}
     */
    getPartitionIds(): Promise<Array<string>>;
    /**
     * Provides information about the specified partition.
     * @method getPartitionInformation
     * @param {(string|number)} partitionId Partition ID for which partition information is required.
     */
    getPartitionInformation(partitionId: string | number): Promise<EventHubPartitionRuntimeInformation>;
    /**
     * Creates a sender to the given event hub, and optionally to a given partition.
     * @method createSender
     * @param {(string|number)} [partitionId] Partition ID to which it will send messages.
     * @returns {Promise<EventHubSender>}
     */
    createSender(partitionId?: string | number): Promise<EventHubSender>;
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
    createReceiver(partitionId: string | number, options?: ReceiveOptions): Promise<EventHubReceiver>;
    /**
     * @private
     * Helper method to make the management request
     * @param {string} type - The type of entity requested for. Valid values are "eventhub", "partition"
     * @param {string | number} [partitionId] - The partitionId. Required only when type is "partition".
     */
    private _makeManagementRequest(type, partitionId?);
    /**
     * Creates an EventHub Client from connection string.
     * @method createFromConnectionString
     * @param {string} connectionString - Connection string of the form 'Endpoint=sb://my-servicebus-namespace.servicebus.windows.net/;SharedAccessKeyName=my-SA-name;SharedAccessKey=my-SA-key'
     * @param {string} [path] - EventHub path of the form 'my-event-hub-name'
     * @param {TokenProvider} [tokenProvider] - An instance of the token provider that provides the token for authentication.
     * @returns {EventHubClient} - An instance of the eventhub client.
     */
    static createFromConnectionString(connectionString: string, path?: string, tokenProvider?: TokenProvider): EventHubClient;
    /**
     * Creates an EventHub Client from AADTokenCredentials.
     * @method
     * @param {string} host - Fully qualified domain name for Event Hubs. Most likely, {yournamespace}.servicebus.windows.net
     * @param {string} entityPath - EventHub path of the form 'my-event-hub-name'
     */
    static createFromAadTokenCredentials(host: string, entityPath: string, credentials: ApplicationTokenCredentials | UserTokenCredentials | DeviceTokenCredentials | MSITokenCredentials): EventHubClient;
}
