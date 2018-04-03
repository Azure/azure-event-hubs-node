// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import * as rhea from "rhea";
import * as debugModule from "debug";
import * as errors from "./errors";
import * as rheaPromise from "./rhea-promise";
import * as Constants from "./util/constants";
import { EventEmitter } from "events";
import { EventData, AmqpMessage } from ".";
import { ConnectionContext } from "./eventHubClient";
import { defaultLock } from "./util/utils";

const debug = debugModule("azure:event-hubs:sender");

/**
 * Instantiates a new sender from the AMQP `Sender`. Used by `EventHubClient`.
 *
 * @param {any} session - The amqp session on which the amqp sender link was created.
 * @param {any} sender - The amqp sender link.
 * @constructor
 */
export class EventHubSender extends EventEmitter {
  /**
   * @property {string} [name] The unique EventHub Sender name (mostly a guid).
   */
  name?: string;
  /**
   * @property {string} [partitionId] The partitionId to which the sender wants to send the EventData.
   */
  partitionId?: string | number;
  /**
   * @property {string} address The EventHub Sender address.
   */
  address: string;
  /**
   * @property {string} audience The EventHub Sender token audience.
   */
  audience: string;
  /**
   * @property {ConnectionContext} _context Provides relevant information about the amqp connection,
   * cbs and $management sessions, token provider, sender and receivers.
   * @private
   */
  private _context: ConnectionContext;
  /**
   * @property {any} [_sender] The AMQP sender link.
   * @private
   */
  private _sender?: any;
  /**
   * @property {any} [_session] The AMQP sender session.
   * @private
   */
  private _session?: any;
  /**
   * @property {NodeJS.Timer} _tokenRenewalTimer The token renewal timer that keeps track of when
   * the EventHub Sender is due for token renewal.
   * @private
   */
  private _tokenRenewalTimer?: NodeJS.Timer;

  /**
   * Creates a new EventHubSender instance.
   * @constructor
   * @param {EventHubClient} client The EventHub client.
   * @param {string|number} [partitionId] The EventHub partition id to which the sender wants to send the event data.
   */
  constructor(context: ConnectionContext, partitionId?: string | number) {
    super();
    this._context = context;
    this.address = this._context.config.entityPath as string;
    this.partitionId = partitionId;
    if (this.partitionId !== null && this.partitionId !== undefined) {
      this.address += `/Partitions/${this.partitionId}`;
    }
    this.audience = `${this._context.config.endpoint}${this.address}`;
    const onError = (context: rheaPromise.Context) => {
      this.emit(Constants.error, errors.translate(context.sender.error));
    };

    this.on("newListener", (event) => {
      if (event === Constants.senderError) {
        if (this._session && this._sender) {
          this._sender.on(Constants.senderError, onError);
        }
      }
    });

    this.on("removeListener", (event) => {
      if (event === Constants.senderError) {
        if (this._session && this._sender) {
          this._sender.on(Constants.senderError, onError);
        }
      }
    });
  }

  /**
   * Initializes the sender session on the connection.
   * @returns {Promoise<void>}
   */
  async init(): Promise<void> {
    try {
      // Acquire the lock and establish a cbs session if it does not exist on the connection. Although node.js
      // is single threaded, we need a locking mechanism to ensure that a race condition does not happen while
      // creating a shared resource (in this case the cbs session, since we want to have exactly 1 cbs session
      // per connection).
      debug(`Acquiring lock: ${this._context.cbsSession.cbsLock} for creating the cbs session while creating` +
        ` the sender.`);
      await defaultLock.acquire(this._context.cbsSession.cbsLock,
        () => { return this._context.cbsSession.init(this._context.connection); });
      const tokenObject = await this._context.tokenProvider.getToken(this.audience);
      debug(`[${this._context.connectionId}] EH Sender: calling negotiateClaim for audience "${this.audience}".`);
      // Negotitate the CBS claim.
      await this._context.cbsSession.negotiateClaim(this.audience, this._context.connection, tokenObject);
      if (!this._session && !this._sender) {
        this._session = await rheaPromise.createSession(this._context.connection);
        let options: rheaPromise.SenderOptions = {
          target: {
            address: this.address
          }
        };
        this._sender = await rheaPromise.createSender(this._session, options);
        this.name = this._sender.name;
        console.log(this._sender.credit);
        this._sender.credit = 10;
        debug(`[${this._context.connectionId}] Negotatited claim for sender "${this.name}" with with partition` +
          ` "${this.partitionId}"`);
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
   * @param {any} data               Message to send.  Will be sent as UTF8-encoded JSON string.
   * @param {string} [partitionKey]  Partition key - sent as x-opt-partition-key, and will hash to a partitionId.
   * @returns {Promise<any>} Promise<any>
   */
  async send(data: EventData, partitionKey?: string): Promise<any> {
    try {
      if (!data || (data && typeof data !== "object")) {
        throw new Error("data is required and it must be of type object.");
      }

      if (partitionKey && typeof partitionKey !== "string") {
        throw new Error("partitionKey must be of type string");
      }

      if (!this._session && !this._sender) {
        throw new Error("amqp sender is not present. Hence cannot send the message.");
      }

      let message = EventData.toAmqpMessage(data);
      if (partitionKey) {
        if (!message.message_annotations) message.message_annotations = {};
        message.message_annotations[Constants.partitionKey] = partitionKey;
      }
      await this._trySend(message);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  /**
   * Send a batch of EventData to the EventHub.
   * @param {Array<EventData>} datas  An array of EventData objects to be sent in a Batch message.
   * @param {string} [partitionKey]   Partition key - sent as x-opt-partition-key, and will hash to a partitionId.
   * @return {Promise<any>} Promise<any>
   */
  async sendBatch(datas: EventData[], partitionKey?: string): Promise<any> {
    try {
      if (!datas || (datas && !Array.isArray(datas))) {
        throw new Error("data is required and it must be an Array.");
      }

      if (partitionKey && typeof partitionKey !== "string") {
        throw new Error("partitionKey must be of type string");
      }

      if (!this._session && !this._sender) {
        throw new Error("amqp sender is not present. Hence cannot send the message.");
      }
      debug(`[${this._context.connectionId}] Sender "${this.name}", trying to send EventData[].`, datas);
      let messages: AmqpMessage[] = [];
      // Convert EventData to AmqpMessage.
      for (let i = 0; i < datas.length; i++) {
        let message = EventData.toAmqpMessage(datas[i]);
        if (partitionKey) {
          if (!message.message_annotations) message.message_annotations = {};
          message.message_annotations[Constants.partitionKey] = partitionKey;
        }
        messages[i] = message;
      }
      // Encode every amqp message and then convert every encoded message to amqp data section
      let batchMessage: AmqpMessage = {
        body: rhea.message.data_sections(messages.map(rhea.message.encode))
      };
      // Set message_annotations, application_properties and properties of the first message as
      // that of the envelope (batch message).
      if (messages[0].message_annotations) {
        batchMessage.message_annotations = messages[0].message_annotations;
      }
      if (messages[0].application_properties) {
        batchMessage.application_properties = messages[0].application_properties;
      }
      if (messages[0].properties) {
        batchMessage.properties = messages[0].properties;
      }
      // Finally encode the envelope (batch message).
      const encodedBatchMessage = rhea.message.encode(batchMessage);
      debug(`[${this._context.connectionId}] Sender "${this.name}", ` +
        `sending encoded batch message.`, encodedBatchMessage);
      return await this._trySend(encodedBatchMessage, undefined, 0x80013700);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  /**
   * "Unlink" this sender, closing the link and resolving when that operation is complete.
   * Leaves the underlying connection/session open.
   * @method close
   * @return {Promise<void>} Promise<void>
   */
  async close(): Promise<void> {
    try {
      await this._sender.detach();
      this.removeAllListeners();
      delete this._context.senders[this.name!];
      debug(`Deleted the sender "${this.name!}" from the client cache.`);
      this._sender = undefined;
      this._session = undefined;
      clearTimeout(this._tokenRenewalTimer as NodeJS.Timer);
      debug(`[${this._context.connectionId}] Sender "${this.name}" closed.`);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  /**
   * Tries to send the message to EventHub if there is enough credit to send them
   * and the circular buffer has available space to settle the message after sending them.
   *
   * We have implemented a synchronous send over here. We shall be waiting for the message
   * to be accepted or rejected and accordingly resolve or reject the promise.
   *
   * @param message The message to be sent to EventHub.
   * @return {Promise<any>} Promise<any>
   */
  private _trySend(message: AmqpMessage, tag?: any, format?: number): Promise<any> {
    return new Promise((resolve, reject) => {
      debug(`[${this._context.connectionId}] Sender "${this.name}", credit: ${this._sender.credit}, ` +
        `available: ${this._sender.session.outgoing.available()}.`);
      if (this._sender.sendable()) {
        debug(`[${this._context.connectionId}] Sender "${this.name}", sending message: \n`, message);
        type Func<T, V> = (a: T) => V;
        let onRejected: Func<rheaPromise.Context, void>;
        const onAccepted: Func<rheaPromise.Context, void> = (context: rheaPromise.Context) => {
          // Since we will be adding listener for accepted and rejected event every time
          // we send a message, we need to remove listener for both the events.
          // This will ensure duplicate listeners are not added for the same event.
          this._sender.removeListener("accepted", onAccepted);

          this._sender.removeListener("rejected", onRejected);
          debug(`[${this._context.connectionId}] Sender "${this.name}", got event accepted.`);
          resolve(context.delivery);
        };
        onRejected = (context: rheaPromise.Context) => {
          this._sender.removeListener("rejected", onRejected);
          this._sender.removeListener("accepted", onAccepted);
          debug(`[${this._context.connectionId}] Sender "${this.name}", got event accepted.`);
          reject(errors.translate(context.delivery.remote_state.error));
        };
        this._sender.on("accepted", onAccepted);
        this._sender.on("rejected", onRejected);
        const delivery = this._sender.send(message, tag, format);
        debug(`[${this._context.connectionId}] Sender "${this.name}", sent message with delivery id: ${delivery.id}`);
      } else {
        // This case should technically not happen. rhea starts the sender credit with 1000 and the circular buffer with a size
        // of 2048. It refreshes the credit and replenishes the circular buffer capacity as it processes the message transfer.
        // In case we end up here, we shall retry sending the message after 5 seconds. This should be a reasonable time for the
        // sender to be sendable again.
        debug(`[${this._context.connectionId}] Sender "${this.name}", not enough capacity to send messages. Will retry in 5 seconds.`);
        setTimeout(() => {
          debug(`[${this._context.connectionId}] Sender "${this.name}", timeout complete. Will try sending the message.`);
          resolve(this._trySend(message, tag, format));
        }, 5000);
      }
    });
  }

  /**
   * Ensures that the token is renewed within the predfiend renewal margin.
   * @private
   * @returns {void}
   */
  private _ensureTokenRenewal(): void {
    const tokenValidTimeInSeconds = this._context.tokenProvider.tokenValidTimeInSeconds;
    const tokenRenewalMarginInSeconds = this._context.tokenProvider.tokenRenewalMarginInSeconds;
    const nextRenewalTimeout = (tokenValidTimeInSeconds - tokenRenewalMarginInSeconds) * 1000;
    this._tokenRenewalTimer = setTimeout(async () => await this.init(), nextRenewalTimeout);
    debug(`[${this._context.connectionId}] Sender "${this.name}", has next token renewal in ` +
      `${nextRenewalTimeout / 1000} seconds @(${new Date(Date.now() + nextRenewalTimeout).toString()}).`);
  }
}
