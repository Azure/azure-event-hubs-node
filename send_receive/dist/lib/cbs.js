"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.
Object.defineProperty(exports, "__esModule", { value: true });
const rheaPromise = require("./rhea-promise");
const uuid = require("uuid/v4");
const Constants = require("./util/constants");
/**
 * CBS session.
 */
let session;
/**
 * CBS sender link in the session.
 */
let sender;
/**
 * CBS receiver link in the session.
 */
let receiver;
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
    if (!connection) {
        throw new Error(`Please provide a connection to initiate cbs.`);
    }
    if (!session && !sender && !receiver) {
        session = await rheaPromise.createSession(connection);
        let rxOpt = {
            source: {
                address: endpoint
            },
            name: replyTo,
            target: {
                address: replyTo
            }
        };
        [sender, receiver] = await Promise.all([
            rheaPromise.createSender(session, { target: { address: endpoint } }),
            rheaPromise.createReceiver(session, rxOpt)
        ]);
    }
}
async function negotiateClaim(audience, connection, tokenObject) {
    return new Promise(async function (resolve, reject) {
        try {
            await init(connection);
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
            receiver.on(Constants.message, (result) => {
                const code = result.message.application_properties[Constants.statusCode];
                const desc = result.message.application_properties[Constants.statusDescription];
                const errorCondition = result.message.application_properties[Constants.errorCondition];
                if (code > 200 && code < 300) {
                    resolve();
                }
                else {
                    let e = new Error(desc);
                    e.code = code;
                    if (errorCondition)
                        e.errorCondition = errorCondition;
                    reject(e);
                }
            });
            sender.send(request);
        }
        catch (err) {
            reject(err);
        }
    });
}
exports.negotiateClaim = negotiateClaim;
//# sourceMappingURL=cbs.js.map