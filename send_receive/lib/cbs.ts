// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { TokenInfo } from "./auth/token";
import { RequestResponseLink, createRequestResponseLink } from "./rpc";
import * as rheaPromise from "./rhea-promise";
import * as uuid from "uuid/v4";
import * as Constants from "./util/constants";
import * as debugModule from "debug";
import { ConditionStatusMapper, translate } from "./errors";
import { defaultLock } from "./util/utils";
const debug = debugModule("azure:event-hubs:cbs");

/**
 * CBS sender, receiver on the same session.
 */
let cbsSenderReceiverLink: RequestResponseLink;
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
  if (!cbsSenderReceiverLink) {
    let rxOpt: rheaPromise.ReceiverOptions = {
      source: {
        address: endpoint
      },
      name: replyTo
    };
    cbsSenderReceiverLink = await createRequestResponseLink(connection, { target: { address: endpoint } }, rxOpt);
    debug(`Successfully created the cbs sender "${cbsSenderReceiverLink.sender.name}" and receiver "${cbsSenderReceiverLink.receiver.name}" links over cbs session.`);
  }
}

export function negotiateClaim(audience: string, connection: any, tokenObject: TokenInfo): Promise<any> {
  return new Promise(async (resolve: any, reject: any): Promise<void> => {
    try {
      await defaultLock.acquire(Constants.negotiateCbsKey, () => { return init(connection); });
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
      const messageCallback = (result: any) => {
        // remove the event listener as this will be registered next time when someone makes a request.
        cbsSenderReceiverLink.receiver.removeListener(Constants.message, messageCallback);
        const code: number = result.message.application_properties[Constants.statusCode];
        const desc: string = result.message.application_properties[Constants.statusDescription];
        let errorCondition: string | undefined = result.message.application_properties[Constants.errorCondition];
        debug(`$cbs request: \n`, request);
        debug(`$cbs response: \n`, result.message);
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
      };
      cbsSenderReceiverLink.receiver.on(Constants.message, messageCallback);
      cbsSenderReceiverLink.sender.send(request);
    } catch (err) {
      debug(`An error occurred while negotating the cbs claim: \n`, err);
      reject(err);
    }
  });
}
