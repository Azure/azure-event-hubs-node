// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { TokenInfo } from "./auth/token";
import * as rheaPromise from "./rhea-promise";
import * as uuid from "uuid/v4";
import * as Constants from "./util/constants";
import { ConditionStatusMapper, translate } from "./errors";
let count = 0;
/**
 * CBS session.
 */
let session: any;
/**
 * CBS sender link in the session.
 */
let sender: any;
/**
 * CBS receiver link in the session.
 */
let receiver: any;
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
async function init(connection: any): Promise<void> {
  if (!connection) {
    throw new Error(`Please provide a connection to initiate cbs.`);
  }
  if (!session && !sender && !receiver) {
    session = await rheaPromise.createSession(connection);
    let rxOpt: rheaPromise.ReceiverOptions = {
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

export async function negotiateClaim(audience: string, connection: any, tokenObject: TokenInfo): Promise<any> {
  return new Promise(async function (resolve: any, reject: any): Promise<any> {
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
      receiver.on(Constants.message, (result: any) => {
        const code: number = result.message.application_properties[Constants.statusCode];
        const desc: string = result.message.application_properties[Constants.statusDescription];
        let errorCondition: string | undefined = result.message.application_properties[Constants.errorCondition];
        console.log(">>>>>> %d cbs request body", ++count, request);
        console.log("###### %d cbs response", count, result.message);
        if (code > 199 && code < 300) {
          resolve();
        } else {
          // Try to map the status code to error condition
          if (!errorCondition) {
            errorCondition = ConditionStatusMapper[code];
          }
          // If we still cannot find a suitable error condition then we default to "amqp:internal-error"
          if (!errorCondition) {
            errorCondition = "amqp:internal-error";
          }
          let e: rheaPromise.AmqpError = {
            condition: errorCondition,
            description: desc
          };
          reject(translate(e));
        }
      });
      sender.send(request);
    } catch (err) {
      reject(err);
    }
  });
}
