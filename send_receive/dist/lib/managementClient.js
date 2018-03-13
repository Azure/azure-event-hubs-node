"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.
Object.defineProperty(exports, "__esModule", { value: true });
const uuid = require("uuid/v4");
const rheaPromise = require("./rhea-promise");
const Constants = require("./util/constants");
const Buffer = require("buffer/").Buffer;
/**
 * @class ManagementClient
 * Descibes the EventHubs Management Client that talks
 * to the $management endpoint over AMQP connection.
 */
class ManagementClient {
    /**
     * @constructor
     * Instantiates the management client.
     * @param entityPath - The name/path of the entity (hub name) for which the management request needs to be made.
     */
    constructor(entityPath) {
        this.entityPath = entityPath;
        this.entityPath = entityPath;
    }
    /**
     * Provides the eventhub runtime information.
     * @method getHubRuntimeInformation
     * @param {Connection} connection - The established amqp connection
     * @returns {Promise<EventHubRuntimeInformation>}
     */
    async getHubRuntimeInformation(connection) {
        const info = await this._makeManagementRequest(connection, Constants.eventHub);
        const runtimeInfo = {
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
    async getPartitionIds(connection) {
        let runtimeInfo = await this.getHubRuntimeInformation(connection);
        return runtimeInfo.partitionIds;
    }
    /**
     * Provides information about the specified partition.
     * @method getPartitionInformation
     * @param {Connection} connection - The established amqp connection
     * @param {(string|number)} partitionId Partition ID for which partition information is required.
     */
    async getPartitionInformation(connection, partitionId) {
        if (!partitionId || (partitionId && typeof partitionId !== "string" && typeof partitionId !== "number")) {
            throw new Error("'partitionId' is a required parameter and must be of type: 'string' | 'number'.");
        }
        const info = await this._makeManagementRequest(connection, Constants.partition, partitionId);
        const partitionInfo = {
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
    async _makeManagementRequest(connection, type, partitionId) {
        if (partitionId && typeof partitionId !== "string" && typeof partitionId !== "number") {
            throw new Error("'partitionId' is a required parameter and must be of type: 'string' | 'number'.");
        }
        return new Promise(async (resolve, reject) => {
            try {
                const endpoint = Constants.management;
                const replyTo = uuid();
                const request = {
                    body: Buffer.from(JSON.stringify([])),
                    properties: {
                        message_id: uuid(),
                        reply_to: replyTo
                    },
                    application_properties: {
                        operation: Constants.readOperation,
                        name: this.entityPath,
                        type: `${Constants.vendorString}:${type}`
                    }
                };
                if (partitionId && type === Constants.partition) {
                    request.application_properties.partition = partitionId;
                }
                const rxopt = { source: { address: endpoint }, name: replyTo, target: { address: replyTo } };
                const session = await rheaPromise.createSession(connection);
                const [sender, receiver] = await Promise.all([
                    rheaPromise.createSender(session, { target: { address: endpoint } }),
                    rheaPromise.createReceiver(session, rxopt)
                ]);
                // TODO: Handle timeout incase SB/EH does not send a response.
                receiver.on(Constants.message, ({ message, delivery }) => {
                    const code = message.application_properties[Constants.statusCode];
                    const desc = message.application_properties[Constants.statusDescription];
                    if (code === 200) {
                        return resolve(message.body);
                    }
                    else if (code === 404) {
                        return reject(desc);
                    }
                });
                sender.send(request);
            }
            catch (err) {
                reject(err);
            }
        });
    }
}
exports.ManagementClient = ManagementClient;
//# sourceMappingURL=managementClient.js.map