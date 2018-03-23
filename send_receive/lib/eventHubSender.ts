// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import * as rhea from "rhea";
import * as debugModule from "debug";
import * as cbs from "./cbs";
import * as errors from "./errors";
import * as rheaPromise from "./rhea-promise";
import * as Constants from "./util/constants";
import { EventEmitter } from "events";
import { EventHubClient, EventData } from ".";
import { AmqpMessage } from "./eventData";

const debug = debugModule("azure:event-hubs:sender");

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
  partitionId?: string | number;
  address: string;
  private _sender: any;
  private _session: any;
  private _tokenRenewalTimer?: NodeJS.Timer;

  constructor(client: EventHubClient, partitionId?: string | number) {
    super();
    this.client = client;
    this.address = this.client.config.entityPath as string;
    this.partitionId = partitionId;
    if (this.partitionId !== null && this.partitionId !== undefined) {
      this.address += `/Partitions/${this.partitionId}`;
    }

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
   * Negotiates the cbs claim and initializes the sender session on the connection.
   * @returns {Promoise<void>}
   */
  async init(): Promise<void> {
    try {
      let audience = `${this.client.config.endpoint}${this.address}`;
      const tokenObject = await this.client.tokenProvider.getToken(audience);
      debug(`[${this.client.connection.options.id}] EH Sender: calling negotiateClaim for audience "${audience}"`);
      await cbs.negotiateClaim(audience, this.client.connection, tokenObject);
      if (!this._session && !this._sender) {
        this._session = await rheaPromise.createSession(this.client.connection);
        let options: rheaPromise.SenderOptions = {
          target: {
            address: this.address
          }
        };
        this._sender = await rheaPromise.createSender(this._session, options);
        this.name = this._sender.name;
        debug(`[${this.client.connection.options.id}] Negotatited claim for sender "${this.name}" with with partition "${this.partitionId}"`);
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
   * @param {any} data                    Message to send.  Will be sent as UTF8-encoded JSON string.
   * @param {string} [partitionKey]       Partition key - sent as x-opt-partition-key, and will hash to a partition ID.
   * @returns {any}
   */
  send(data: EventData, partitionKey?: string): any {
    if (!data || (data && typeof data !== 'object')) {
      throw new Error('data is required and it must be of type object.');
    }

    if (partitionKey && typeof partitionKey !== 'string') {
      throw new Error('partitionKey must be of type string');
    }

    if (!this._session && !this._sender) {
      throw new Error("amqp sender is not present. Hence cannot send the message.");
    }

    let message = EventData.toAmqpMessage(data);
    if (partitionKey) {
      if (!message.message_annotations) message.message_annotations = {};
      message.message_annotations[Constants.partitionKey] = partitionKey;
    }
    debug(`[${this.client.connection.options.id}] Sender "${this.name}", sending message: \n`, message);
    return this._sender.send(message);
  }

  /**
   * Send a batch of EventData to the EventHub.
   * @param {Array<EventData>} datas  An array of EventData objects to be sent in a Batch message.
   * @param {string} [partitionKey]   Partition key - sent as x-opt-partition-key, and will hash to a partition ID.
   * @returns {any}
   */
  sendBatch(datas: EventData[], partitionKey?: string): any {
    if (!datas || (datas && !Array.isArray(datas))) {
      throw new Error('data is required and it must be an Array.');
    }

    if (partitionKey && typeof partitionKey !== 'string') {
      throw new Error('partitionKey must be of type string');
    }

    if (!this._session && !this._sender) {
      throw new Error("amqp sender is not present. Hence cannot send the message.");
    }
    debug(`[${this.client.connection.options.id}] Sender "${this.name}", trying to send EventData[].`, datas);
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
    debug(`[${this.client.connection.options.id}] Sender "${this.name}", sending encoded batch message.`, encodedBatchMessage);
    return this._sender.send(encodedBatchMessage, undefined, 0x80013700);
  }

  /**
   * "Unlink" this sender, closing the link and resolving when that operation is complete. Leaves the underlying connection/session open.
   * @method close
   * @return {Promise<void>}
   */
  async close(): Promise<void> {
    try {
      await this._sender.detach();
      this.removeAllListeners();
      this._sender = undefined;
      this._session = undefined;
      clearTimeout(this._tokenRenewalTimer as NodeJS.Timer);
      debug(`[${this.client.connection.options.id}] Sender "${this.name}" closed.`);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  /**
   * Ensures that the token is renewed within the predfiend renewal margin.
   * @returns {void}
   */
  private _ensureTokenRenewal(): void {
    const tokenValidTimeInSeconds = this.client.tokenProvider.tokenValidTimeInSeconds;
    const tokenRenewalMarginInSeconds = this.client.tokenProvider.tokenRenewalMarginInSeconds;
    const nextRenewalTimeout = (tokenValidTimeInSeconds - tokenRenewalMarginInSeconds) * 1000;
    this._tokenRenewalTimer = setTimeout(async () => await this.init(), nextRenewalTimeout);
    debug(`[${this.client.connection.options.id}] Sender "${this.name}", has next token renewal in ${nextRenewalTimeout / 1000} seconds ` +
      `@(${new Date(Date.now() + nextRenewalTimeout).toString()}).`);
  }
}
