import { EventEmitter } from "events";
import * as Constants from "./util/constants";

/**
 * Instantiates a new sender from the AMQP `Sender`. Used by `EventHubClient`.
 *
 * @param {any} session - The amqp session on which the amqp sender link was created.
 * @param {any} sender - The amqp sender link.
 * @constructor
 */
export class EventHubSender extends EventEmitter {
  private _sender: any;
  private _session: any;

  constructor(session: any, sender: any) {
    super();
    this._session = session;
    this._sender = sender;
  }

  /**
   * Sends the given message, with the given options on this link
   *
   * @method send
   * @param {any} message                   Message to send.  Will be sent as UTF8-encoded JSON string.
   * @param {string} [partitionKey]       Partition key - sent as x-opt-partition-key, and will hash to a partition ID.
   *
   * @return {Promise}
   */
  send(message: any, partitionKey?: string): any {
    if (partitionKey) {
      if (!message.message_annotations) message.message_annotations = {};
      message.message_annotations[Constants.partitionKey] = partitionKey;
    }
    if (!this._session && !this._sender) {
      throw new Error("amqp sender is not present. Hence cannot send the message.");
    }
    return this._sender.send(message);
  }

  /**
   * "Unlink" this sender, closing the link and resolving when that operation is complete. Leaves the underlying connection/session open.
   *
   * @method close
   *
   * @return {Promise}
   */
  async close(): Promise<void> {
    await this._sender.detach();
    this.removeAllListeners();
    this._sender = undefined;
    this._session = undefined;
  }
}
