// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import * as rheaPromise from "./rhea-promise";
import * as Constants from "./util/constants";
import { ApplicationTokenCredentials, DeviceTokenCredentials, UserTokenCredentials, MSITokenCredentials } from "ms-rest-azure";
import { EventHubReceiver, EventHubSender, ConnectionConfig } from ".";
import { TokenProvider } from "./auth/token";
import { SasTokenProvider } from "./auth/sas";
import { AadTokenProvider } from "./auth/aad";
import * as os from "os";
import * as process from "process";
import { ManagementClient, EventHubPartitionRuntimeInformation, EventHubRuntimeInformation } from "./managementClient";



export interface ReceiveOptions {
  filter?: {
    startAfterTime?: Date | number;
    startAfterOffset?: string;
    customFilter?: string;
  };
  consumerGroup?: string;
}

export class EventHubClient {

  config: ConnectionConfig;
  tokenProvider: TokenProvider;
  connection: any;
  userAgent: string = "/js-event-hubs";
  private managementClient: ManagementClient;
  /**
   * Instantiate a client pointing to the Event Hub given by this configuration.
   *
   * @constructor
   * @param {ConnectionConfig} config - The connection configuration to create the EventHub Client.
   * @param {TokenProvider} [tokenProvider] - The token provider that provides the token for authentication.
   */
  constructor(config: ConnectionConfig, tokenProvider?: TokenProvider) {
    this.config = config;
    if (!tokenProvider) {
      tokenProvider = new SasTokenProvider(config.endpoint, config.sharedAccessKeyName, config.sharedAccessKey);
    }
    this.tokenProvider = tokenProvider;
    this.userAgent = "/js-event-hubs";
    this.managementClient = new ManagementClient(this.config.entityPath as string);
  }

  /**
   * Closes the AMQP connection to the Event Hub for this client,
   * returning a promise that will be resolved when disconnection is completed.
   * @method close
   * @returns {Promise<any>}
   */
  async close(): Promise<any> {
    if (this.connection) {
      await this.connection.close();
    }
  }

  /**
   * Creates a sender to the given event hub, and optionally to a given partition.
   * @method createSender
   * @param {(string|number)} [partitionId] Partition ID to which it will send messages.
   * @returns {Promise<EventHubSender>}
   */
  async createSender(partitionId?: string | number): Promise<EventHubSender> {
    if (partitionId && typeof partitionId !== "string" && typeof partitionId !== "number") {
      throw new Error("'partitionId' is a required parameter and must be of type: 'string' | 'number'.");
    }

    try {
      let ehSender = new EventHubSender(this, partitionId);
      await this._open();
      await ehSender.init();
      return ehSender;
    } catch (err) {
      return Promise.reject(err);
    }
  }

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
  async createReceiver(partitionId: string | number, options?: ReceiveOptions): Promise<EventHubReceiver> {
    if (!partitionId || (partitionId && typeof partitionId !== "string" && typeof partitionId !== "number")) {
      throw new Error("'partitionId' is a required parameter and must be of type: 'string' | 'number'.");
    }

    try {
      let ehReceiver = new EventHubReceiver(this, partitionId, options);
      await this._open();
      await ehReceiver.init();
      return ehReceiver;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  /**
   * Provides the eventhub runtime information.
   * @method getHubRuntimeInformation
   * @returns {Promise<EventHubRuntimeInformation>}
   */
  async getHubRuntimeInformation(): Promise<EventHubRuntimeInformation> {
    try {
      await this._open();
      return await this.managementClient.getHubRuntimeInformation(this.connection);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  /**
   * Provides an array of partitionIds.
   * @method getPartitionIds
   * @returns {Promise<Array<string>>}
   */
  async getPartitionIds(): Promise<Array<string>> {
    let runtimeInfo = await this.getHubRuntimeInformation();
    return runtimeInfo.partitionIds;
  }

  /**
   * Provides information about the specified partition.
   * @method getPartitionInformation
   * @param {(string|number)} partitionId Partition ID for which partition information is required.
   */
  async getPartitionInformation(partitionId: string | number): Promise<EventHubPartitionRuntimeInformation> {
    try {
      await this._open();
      return await this.managementClient.getPartitionInformation(this.connection, partitionId);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  /**
   * Opens the AMQP connection to the Event Hub for this client, returning a promise
   * that will be resolved when the connection is completed.
   * @method open
   *
   * @param {boolean} [useSaslPlain] - True for using sasl plain mode for authentication, false otherwise.
   * @returns {Promise<void>}
   */
  private async _open(useSaslPlain?: boolean): Promise<void> {
    if (useSaslPlain && typeof useSaslPlain !== "boolean") {
      throw new Error("'useSaslPlain' must be of type 'boolean'.");
    }
    if (!this.connection) {
      const connectOptions: rheaPromise.ConnectionOptions = {
        transport: Constants.TLS,
        host: this.config.host,
        hostname: this.config.host,
        username: this.config.sharedAccessKeyName,
        port: 5671,
        reconnect_limit: 100,
        properties: {
          product: "MSJSClient",
          version: Constants.packageJsonInfo.version || "0.1.0",
          platform: `(${os.arch()}-${os.type()}-${os.release()})`,
          framework: `Node/${process.version}`,
          "user-agent": this.userAgent
        }
      };
      if (useSaslPlain) {
        connectOptions.password = this.config.sharedAccessKey;
      }
      this.connection = await rheaPromise.connect(connectOptions);
    }
  }

  /**
   * Creates an EventHub Client from connection string.
   * @method createFromConnectionString
   * @param {string} connectionString - Connection string of the form 'Endpoint=sb://my-servicebus-namespace.servicebus.windows.net/;SharedAccessKeyName=my-SA-name;SharedAccessKey=my-SA-key'
   * @param {string} [path] - EventHub path of the form 'my-event-hub-name'
   * @param {TokenProvider} [tokenProvider] - An instance of the token provider that provides the token for authentication.
   * @returns {EventHubClient} - An instance of the eventhub client.
   */
  static createFromConnectionString(connectionString: string, path?: string, tokenProvider?: TokenProvider): EventHubClient {
    if (!connectionString || (connectionString && typeof connectionString !== "string")) {
      throw new Error("'connectionString' is a required parameter and must be of type: 'string'.");
    }
    const config = ConnectionConfig.create(connectionString, path);

    if (!config.entityPath) {
      throw new Error(`Either the connectionString must have "EntityPath=<path-to-entity>" or you must provide "path", while creating the client`);
    }
    return new EventHubClient(config, tokenProvider);
  }

  /**
   * Creates an EventHub Client from AADTokenCredentials.
   * @method
   * @param {string} host - Fully qualified domain name for Event Hubs. Most likely, {yournamespace}.servicebus.windows.net
   * @param {string} entityPath - EventHub path of the form 'my-event-hub-name'
   */
  static createFromAadTokenCredentials(host: string, entityPath: string, credentials: ApplicationTokenCredentials | UserTokenCredentials | DeviceTokenCredentials | MSITokenCredentials): EventHubClient {
    if (!host || (host && typeof host !== "string")) {
      throw new Error("'host' is a required parameter and must be of type: 'string'.");
    }

    if (!entityPath || (entityPath && typeof entityPath !== "string")) {
      throw new Error("'entityPath' is a required parameter and must be of type: 'string'.");
    }

    if (!credentials ||
      (credentials &&
        !(credentials instanceof ApplicationTokenCredentials ||
          credentials instanceof UserTokenCredentials ||
          credentials instanceof DeviceTokenCredentials ||
          credentials instanceof MSITokenCredentials))) {
      throw new Error("'credentials' is a required parameter and must be an instance of ApplicationTokenCredentials | UserTokenCredentials | DeviceTokenCredentials | MSITokenCredentials.");
    }

    if (!host.endsWith("/")) host += "/";
    const connectionString = `Endpoint=sb://${host};SharedAccessKeyName=defaultKeyName;SharedAccessKey=defaultKeyValue`;
    const tokenProvider = new AadTokenProvider(credentials);
    return EventHubClient.createFromConnectionString(connectionString, entityPath, tokenProvider);
  }
}
