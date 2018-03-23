"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.
Object.defineProperty(exports, "__esModule", { value: true });
const rpc_1 = require("./rpc");
const uuid = require("uuid/v4");
const Constants = require("./util/constants");
const debugModule = require("debug");
const errors_1 = require("./errors");
const utils_1 = require("./util/utils");
const debug = debugModule("azure:event-hubs:cbs");
/**
 * CBS sender, receiver on the same session.
 */
let cbsSenderReceiverLink;
/**
 * CBS endpoint - "$cbs"
 */
const endpoint = Constants.cbsEndpoint;
/**
 * CBS replyTo - The reciever link name that the service should reply to.
 */
const replyTo = Constants.cbsReplyTo + "-" + uuid();
/**
 * Creates a singleton instance of the CBS session if it hasn't been initialized previously on the given connection.
 * @param {any} connection The AMQP connection object on which the CBS session needs to be initialized.
 */
async function init(connection) {
    if (!cbsSenderReceiverLink) {
        let rxOpt = {
            source: {
                address: endpoint
            },
            name: replyTo
        };
        cbsSenderReceiverLink = await rpc_1.createRequestResponseLink(connection, { target: { address: endpoint } }, rxOpt);
        debug(`[${connection.options.id}] Successfully created the cbs sender "${cbsSenderReceiverLink.sender.name}" and receiver "${cbsSenderReceiverLink.receiver.name}" links over cbs session.`);
    }
}
function negotiateClaim(audience, connection, tokenObject) {
    return new Promise(async (resolve, reject) => {
        try {
            await utils_1.defaultLock.acquire(Constants.negotiateCbsKey, () => { return init(connection); });
            const request = {
                body: tokenObject.token,
                properties: {
                    message_id: uuid(),
                    reply_to: replyTo,
                    to: endpoint,
                },
                application_properties: {
                    operation: Constants.operationPutToken,
                    name: audience,
                    type: tokenObject.tokenType
                }
            };
            const messageCallback = (result) => {
                // remove the event listener as this will be registered next time when someone makes a request.
                cbsSenderReceiverLink.receiver.removeListener(Constants.message, messageCallback);
                const code = result.message.application_properties[Constants.statusCode];
                const desc = result.message.application_properties[Constants.statusDescription];
                let errorCondition = result.message.application_properties[Constants.errorCondition];
                debug(`[${connection.options.id}] $cbs request: \n`, request);
                debug(`[${connection.options.id}] $cbs response: \n`, result.message);
                if (code > 199 && code < 300) {
                    resolve();
                }
                else {
                    // Try to map the status code to error condition
                    if (!errorCondition) {
                        errorCondition = errors_1.ConditionStatusMapper[code];
                    }
                    // If we still cannot find a suitable error condition then we default to "amqp:internal-error"
                    if (!errorCondition) {
                        errorCondition = "amqp:internal-error";
                    }
                    let e = {
                        condition: errorCondition,
                        description: desc
                    };
                    reject(errors_1.translate(e));
                }
            };
            cbsSenderReceiverLink.receiver.on(Constants.message, messageCallback);
            cbsSenderReceiverLink.sender.send(request);
        }
        catch (err) {
            debug(`[${connection.options.id}] An error occurred while negotating the cbs claim: \n`, err);
            reject(err);
        }
    });
}
exports.negotiateClaim = negotiateClaim;
//# sourceMappingURL=cbs.js.map