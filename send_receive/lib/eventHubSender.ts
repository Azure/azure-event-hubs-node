import { EventEmitter } from "events";
import * as Constants from "./util/constants";
import { EventHubClient } from ".";
import * as cbs from "./cbs";
import * as rheaPromise from "./rhea-promise";

/**
 * Instantiates a new sender from the AMQP `Sender`. Used by `EventHubClient`.
 *
 * @param {any} session - The amqp session on which the amqp sender link was created.
 * @param {any} sender - The amqp sender link.
 * @constructor
 */
export class EventHubSender extends EventEmitter {
  name?: string;
  client: EventHubClient;
  partitionId?: string;
  private _sender: any;
  private _session: any;

  constructor(client: EventHubClient, partitionId?: string) {
    super();
    this.client = client;
    this.partitionId = partitionId;
  }

  async init(): Promise<void> {
    try {
      await this.client.open();
      let audience = `${this.client.config.endpoint}${this.client.config.entityPath}`;
      if (this.partitionId) audience += `/${this.partitionId}`;
      const tokenObject = this.client.tokenProvider.getToken(audience);
      await cbs.negotiateClaim(audience, this.client.connection, tokenObject);
      if (!this._session && !this._sender) {
        this._session = await rheaPromise.createSession(this.client.connection);
        this._sender = await rheaPromise.createSender(this._session, this.client.config.entityPath as string);
        this.name = this._sender.name;
      }

      this._ensureTokenRenewal();
    } catch (err) {
      return Promise.reject(err);
    }
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
    try {
      await this._sender.detach();
      this.removeAllListeners();
      this._sender = undefined;
      this._session = undefined;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  /**
   * Ensures that the token is renewed within the predfiend renewal margin.
   */
  private _ensureTokenRenewal(): void {
    const tokenValidTimeInSeconds = this.client.tokenProvider.tokenValidTimeInSeconds;
    const tokenRenewalMarginInSeconds = this.client.tokenProvider.tokenRenewalMarginInSeconds;
    const nextRenewalTimeout = (tokenValidTimeInSeconds - tokenRenewalMarginInSeconds) * 1000;
    setTimeout(async () => await this.init(), nextRenewalTimeout);
  }
}
