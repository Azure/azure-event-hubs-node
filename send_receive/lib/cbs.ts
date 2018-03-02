import { TokenProvider } from "./auth/token";
import * as rheaPromise from "./rhea-promise";
import * as uuid from "uuid/v4";
import * as Constants from "./util/constants";

export async function negotiateClaim(audience: string, connection: any, tokenProvider: TokenProvider): Promise<any> {
  return new Promise(async function (resolve: any, reject: any): Promise<any> {
    try {
      const endpoint = Constants.cbsEndpoint;
      const replyTo = Constants.cbsReplyTo + "-" + uuid();
      const tokenObject = tokenProvider.getToken(audience);
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
      let rxOpt = {
        name: replyTo,
        target: {
          address: replyTo
        }
      };
      const session = await rheaPromise.createSession(connection);
      const [sender, receiver] = await Promise.all([
        rheaPromise.createSender(session, endpoint, {}),
        rheaPromise.createReceiver(session, endpoint, rxOpt)
      ]);

      receiver.on(Constants.message, ({ message, delivery }) => {
        const code: number = message.application_properties[Constants.statusCode];
        const desc: string = message.application_properties[Constants.statusDescription];
        const errorCondition: string | undefined = message.application_properties[Constants.errorCondition];

        if (code > 200 && code < 300) {
          resolve();
        } else {
          let e: any = new Error(desc);
          e.code = code;
          if (errorCondition) e.errorCondition = errorCondition;
          reject(e);
        }
      });
      sender.send(request);
    } catch (err) {
      reject(err);
    }
  });
}
