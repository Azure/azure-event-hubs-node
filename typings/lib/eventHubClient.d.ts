import { ApplicationTokenCredentials, DeviceTokenCredentials, UserTokenCredentials, MSITokenCredentials } from "ms-rest-azure";
import { EventHubReceiver, EventHubSender, ConnectionConfig } from ".";
import { TokenProvider } from "./auth/token";
import { EventHubPartitionRuntimeInformation, EventHubRuntimeInformation } from "./managementClient";
import EventPosition from "./eventPosition";
export interface ReceiveOptions {
    /**
     * @property {object} [eventPosition] The starting event position at which to start receiving messages.
     * This is used to filter messages for the EventHub Receiver.
     */
    eventPosition?: EventPosition;
    /**
     * @property {string} [consumerGroup] The consumer group to which the receiver wants to connect to.
     * If not provided then it will be connected to "$default" consumer group.
     */
    consumerGroup?: string;
    /**
     * @property {number} [prefetchCount] The upper limit of events this receiver will actively receive
     * regardless of whether a receive operation is pending. Defaults to 500.
     */
    prefetchCount?: number;
    /**
     * @property {number} [epoch] The epoch value that this receiver is currently using for partition ownership.
     */
    epoch?: number;
    /**
     * @property {boolean} [enableReceiverRuntimeMetric] A value indicating whether the runtime metric of a receiver is enabled.
     */
    enableReceiverRuntimeMetric?: boolean;
}
/**
 * @class EventHubClient
 * Describes the EventHub client.
 */
export declare class EventHubClient {
    config: ConnectionConfig;
    tokenProvider: TokenProvider;
    connection?: any;
    connectionId?: string;
    userAgent: string;
    receivers: {
        [x: string]: EventHubReceiver;
    };
    senders: {
        [x: string]: EventHubSender;
    };
    private _managementClient;
    private _cbsClient;
    /**
     * Instantiate a client pointing to the Event Hub given by this configuration.
     *
     * @constructor
     * @param {ConnectionConfig} config - The connection configuration to create the EventHub Client.
     * @param {TokenProvider} [tokenProvider] - The token provider that provides the token for authentication.
     * Default value: SasTokenProvider.
     */
    constructor(config: ConnectionConfig, tokenProvider?: TokenProvider);
    /**
     * Closes the AMQP connection to the Event Hub for this client,
     * returning a promise that will be resolved when disconnection is completed.
     * @method close
     * @returns {Promise<any>}
     */
    close(): Promise<any>;
    /**
     * Creates a sender to the given event hub, and optionally to a given partition.
     * @method createSender
     * @param {(string|number)} [partitionId] Partition ID to which it will send event data.
     * @returns {Promise<EventHubSender>}
     */
    createSender(partitionId?: string | number): Promise<EventHubSender>;
    /**
     * Creates a new receiver that will receive event data from the EventHub.
     * @method createReceiver
     * @param {EventHubClient} client                            The EventHub client.
     * @param {string|number} partitionId                        Partition ID from which to receive.
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
    createReceiver(partitionId: string | number, options?: ReceiveOptions): Promise<EventHubReceiver>;
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
     * Opens the AMQP connection to the Event Hub for this client, returning a promise
     * that will be resolved when the connection is completed.
     * @method open
     *
     * @param {boolean} [useSaslPlain] - True for using sasl plain mode for authentication, false otherwise.
     * @returns {Promise<void>}
     */
    private _open(useSaslPlain?);
    /**
     * Creates an EventHub Client from connection string.
     * @method createFromConnectionString
     * @param {string} connectionString - Connection string of the form 'Endpoint=sb://my-servicebus-namespace.servicebus.windows.net/;SharedAccessKeyName=my-SA-name;SharedAccessKey=my-SA-key'
     * @param {string} [path] - EventHub path of the form 'my-event-hub-name'
     * @param {TokenProvider} [tokenProvider] - An instance of the token provider that provides the token for authentication. Default value: SasTokenProvider.
     * @returns {EventHubClient} - An instance of the eventhub client.
     */
    static createFromConnectionString(connectionString: string, path?: string, tokenProvider?: TokenProvider): EventHubClient;
    /**
     * Creates an EventHub Client from AADTokenCredentials.
     * @method
     * @param {string} host - Fully qualified domain name for Event Hubs. Most likely, {yournamespace}.servicebus.windows.net
     * @param {string} entityPath - EventHub path of the form 'my-event-hub-name'
     * @param {TokenCredentials} credentials - The AAD Token credentials. It can be one of the following: ApplicationTokenCredentials | UserTokenCredentials | DeviceTokenCredentials | MSITokenCredentials.
     */
    static createFromAadTokenCredentials(host: string, entityPath: string, credentials: ApplicationTokenCredentials | UserTokenCredentials | DeviceTokenCredentials | MSITokenCredentials): EventHubClient;
}
