// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import * as uuid from "uuid/v4";
import * as rheaPromise from "./rhea-promise";
import * as Constants from "./util/constants";
const Buffer = require("buffer/").Buffer;

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

/**
 * @class ManagementClient
 * Descibes the EventHubs Management Client that talks
 * to the $management endpoint over AMQP connection.
 */
export class ManagementClient {
  /**
   * @constructor
   * Instantiates the management client.
   * @param entityPath - The name/path of the entity (hub name) for which the management request needs to be made.
   */
  constructor(public entityPath: string) {
    this.entityPath = entityPath;
  }

  /**
   * Provides the eventhub runtime information.
   * @method getHubRuntimeInformation
   * @param {Connection} connection - The established amqp connection
   * @returns {Promise<EventHubRuntimeInformation>}
   */
  async getHubRuntimeInformation(connection: any): Promise<EventHubRuntimeInformation> {
    const info: any = await this._makeManagementRequest(connection, Constants.eventHub);
    const runtimeInfo: EventHubRuntimeInformation = {
      path: info.name,
      createdAt: new Date(info.created_at),
      partitionCount: info.partition_count,
      partitionIds: info.partition_ids,
      type: info.type
    };
    return runtimeInfo;
  }

  /**
   * Provides an array of partitionIds.
   * @method getPartitionIds
   * @param {Connection} connection - The established amqp connection
   * @returns {Promise<Array<string>>}
   */
  async getPartitionIds(connection: any): Promise<Array<string>> {
    let runtimeInfo = await this.getHubRuntimeInformation(connection);
    return runtimeInfo.partitionIds;
  }

  /**
   * Provides information about the specified partition.
   * @method getPartitionInformation
   * @param {Connection} connection - The established amqp connection
   * @param {(string|number)} partitionId Partition ID for which partition information is required.
   */
  async getPartitionInformation(connection: any, partitionId: string | number): Promise<EventHubPartitionRuntimeInformation> {
    if (!partitionId || (partitionId && typeof partitionId !== "string" && typeof partitionId !== "number")) {
      throw new Error("'partitionId' is a required parameter and must be of type: 'string' | 'number'.");
    }
    const info: any = await this._makeManagementRequest(connection, Constants.partition, partitionId);
    const partitionInfo: EventHubPartitionRuntimeInformation = {
      beginningSequenceNumber: info.begin_sequence_number,
      hubPath: info.name,
      lastEnqueuedOffset: info.last_enqueued_offset,
      lastEnqueuedTimeUtc: info.last_enqueued_time_utc,
      lastSequenceNumber: info.last_enqueued_sequence_number,
      partitionId: info.partition,
      type: info.type
    };
    return partitionInfo;
  }

  /**
   * @private
   * Helper method to make the management request
   * @param {Connection} connection - The established amqp connection
   * @param {string} type - The type of entity requested for. Valid values are "eventhub", "partition"
   * @param {string | number} [partitionId] - The partitionId. Required only when type is "partition".
   */
  private async _makeManagementRequest(connection: any, type: "eventhub" | "partition", partitionId?: string | number): Promise<any> {
    if (partitionId && typeof partitionId !== "string" && typeof partitionId !== "number") {
      throw new Error("'partitionId' is a required parameter and must be of type: 'string' | 'number'.");
    }
    return new Promise(async (resolve: any, reject: any) => {
      try {
        const endpoint = Constants.management;
        const replyTo = uuid();
        const request: any = {
          body: Buffer.from(JSON.stringify([])),
          properties: {
            message_id: uuid(),
            reply_to: replyTo
          },
          application_properties: {
            operation: Constants.readOperation,
            name: this.entityPath as string,
            type: `${Constants.vendorString}:${type}`
          }
        };
        if (partitionId && type === Constants.partition) {
          request.application_properties.partition = partitionId;
        }

        const rxopt: rheaPromise.ReceiverOptions = { source: { address: endpoint }, name: replyTo, target: { address: replyTo } };
        const session = await rheaPromise.createSession(connection);
        const [sender, receiver] = await Promise.all([
          rheaPromise.createSender(session, { target: { address: endpoint } }),
          rheaPromise.createReceiver(session, rxopt)
        ]);

        // TODO: Handle timeout incase SB/EH does not send a response.
        receiver.on(Constants.message, ({ message, delivery }: any) => {
          const code: number = message.application_properties[Constants.statusCode];
          const desc: string = message.application_properties[Constants.statusDescription];
          if (code === 200) {
            return resolve(message.body);
          } else if (code === 404) {
            return reject(desc);
          }
        });

        sender.send(request);
      } catch (err) {
        reject(err);
      }
    });
  }
}
