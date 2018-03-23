/// <reference types="node" />
import { LeaseManager } from "./blobLeaseManager";
import PartitionContext from "./partitionContext";
import { EventHubClient } from "../eventHubClient";
import { EventEmitter } from "events";
import { TokenProvider, EventHubRuntimeInformation, EventHubPartitionRuntimeInformation } from "..";
import { EventData } from "../eventData";
import { ApplicationTokenCredentials, UserTokenCredentials, DeviceTokenCredentials, MSITokenCredentials } from "ms-rest-azure";
/**
 * Describes the event handler signtaure for the "ephost:opened" event.
 */
export interface OnOpen {
    (event: "ephost:opened", handler: (context: PartitionContext) => void): void;
}
/**
 * Describes the event handler signtaure for the "ephost:message" event.
 */
export interface OnMessage {
    (event: "ephost:message", handler: (context: PartitionContext, eventData: EventData) => void): void;
}
/**
 * Describes the event handler signtaure for the "ephost:closed" event.
 */
export interface OnClose {
    (event: "ephost:closed", handler: (context: PartitionContext, reason?: any) => void): void;
}
/**
 * Describes the Event Processor Host to process events from an EventHub.
 * @class EventProcessorHost
 */
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
     * Passed the PartitionContext and EventData.
     */
    static message: string;
    private _hostName;
    private _consumerGroup;
    private _storageConnectionString;
    private _eventHubClient;
    private _leaseManager;
    private _contextByPartition?;
    private _receiverByPartition?;
    /**
     * Creates a new host to process events from an Event Hub.
     * @param {string} hostName Name of the processor host. MUST BE UNIQUE. Strongly recommend including a Guid to ensure uniqueness.
     * @param {string} consumerGroup The name of the consumer group within the Event Hub.
     * @param {string} storageConnectionString Connection string to Azure Storage account used for leases and checkpointing. Example DefaultEndpointsProtocol=https;AccountName=<account-name>;AccountKey=<account-key>;EndpointSuffix=core.windows.net
     * @param {EventHubClient} eventHubClient The EventHub client
     * @param {LeaseManager} [LeaseManager] A manager to manage leases. Default: BlobLeaseManager.
     */
    constructor(hostName: string, consumerGroup: string, storageConnectionString: string, eventHubClient: EventHubClient, leaseManager?: LeaseManager);
    /**
     * Provides the host name for the Event processor host.
     */
    readonly hostName: string;
    /**
     * Provides the consumer group name for the Event processor host.
     */
    readonly consumerGroup: string;
    /**
     * Provides the eventhub runtime information.
     * @method getHubRuntimeInformation
     * @returns {Promise<EventHubRuntimeInformation>}
     */
    getHubRuntimeInformation(): Promise<EventHubRuntimeInformation>;
    /**
     * Provides information about the specified partition.
     * @method getPartitionInformation
     * @param {(string|number)} partitionId Partition ID for which partition information is required.
     */
    getPartitionInformation(partitionId: string | number): Promise<EventHubPartitionRuntimeInformation>;
    /**
     * Provides an array of partitionIds.
     * @method getPartitionIds
     * @returns {Promise<string[]>}
     */
    getPartitionIds(): Promise<string[]>;
    /**
     * Starts the event processor host, fetching the list of partitions, (optionally) filtering them, and attempting
     * to grab leases on the (filtered) set. For each successful lease, will get the details from the blob and start
     * a receiver at the point where it left off previously.
     *
     * @method start
     * @param {function} [partitionFilter]  Predicate that takes a partition ID and return true/false for whether we should
     *  attempt to grab the lease and watch it. If not provided, all partitions will be tried.
     *
     * @return {Promise<EventProcessorHost>}
     */
    start(partitionFilter?: Function): Promise<EventProcessorHost>;
    /**
     * Stops the EventProcessorHost from processing messages.
     * @return {Promise<void>}
     */
    stop(): Promise<void>;
    private _attachReceiver(partitionId);
    private _detachReceiver(partitionId, reason?);
    /**
     * Convenience method for generating unique host name.
     * @param {string} [prefix] String to use as the beginning of the name. Default value: "js-host".
     * @return {string} A unique host name
     */
    static createHostName(prefix?: string): string;
    /**
     * Creates a new host to process events from an Event Hub.
     * @param {string} hostName Name of the processor host. MUST BE UNIQUE. Strongly recommend including a Guid to ensure uniqueness.
     * @param {string} consumerGroup The name of the consumer group within the Event Hub.
     * @param {string} storageConnectionString Connection string to Azure Storage account used for leases and checkpointing.
     * Example DefaultEndpointsProtocol=https;AccountName=<account-name>;AccountKey=<account-key>;EndpointSuffix=core.windows.net
     * @param {string} eventHubConnectionString Connection string for the Event Hub to receive from.
     * Example: 'Endpoint=sb://my-servicebus-namespace.servicebus.windows.net/;SharedAccessKeyName=my-SA-name;SharedAccessKey=my-SA-key'
     * @param {string} [eventHubPath] The name of the EventHub. This is optional if the eventHubConnectionString contains ENTITY_PATH=hub-name.
     * @param {TokenProvider} [tokenProvider] An instance of the token provider that provides the token for authentication.
     * Default value: SasTokenProvider.
     * @param {LeaseManager} [LeaseManager] A manager to manage leases. Default: BlobLeaseManager.
     */
    static createFromConnectionString(hostName: string, consumerGroup: string, storageConnectionString: string, eventHubConnectionString: string, eventHubPath?: string, tokenProvider?: TokenProvider, leaseManager?: LeaseManager): EventProcessorHost;
    /**
     * Creates a new host to process events from an Event Hub.
     * @method
     * @param {string} hostName Name of the processor host. MUST BE UNIQUE. Strongly recommend including a Guid to ensure uniqueness.
     * @param {string} consumerGroup The name of the consumer group within the Event Hub.
     * @param {string} storageConnectionString Connection string to Azure Storage account used for leases and checkpointing.
     * Example DefaultEndpointsProtocol=https;AccountName=<account-name>;AccountKey=<account-key>;EndpointSuffix=core.windows.net
     * @param {string} namespace Fully qualified domain name for Event Hubs. Example: "{your-sb-namespace}.servicebus.windows.net"
     * @param {string} eventHubPath The name of the EventHub. This is optional if the eventHubConnectionString contains ENTITY_PATH=hub-name.
     * @param {TokenCredentials} credentials - The AAD Token credentials. It can be one of the following:
     * ApplicationTokenCredentials | UserTokenCredentials | DeviceTokenCredentials | MSITokenCredentials.
     * @param {LeaseManager} [LeaseManager] A manager to manage leases. Default: BlobLeaseManager.
     */
    static createFromAadTokenCredentials(hostName: string, consumerGroup: string, storageConnectionString: string, namespace: string, eventHubPath: string, credentials: ApplicationTokenCredentials | UserTokenCredentials | DeviceTokenCredentials | MSITokenCredentials, leaseManager?: LeaseManager): EventProcessorHost;
}
