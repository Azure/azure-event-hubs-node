// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { EventEmitter } from "events";
import { EventData } from "./eventData";
import * as Constants from "./util/constants";
import { EventHubClient, ReceiveOptions } from ".";
import * as rheaPromise from "./rhea-promise";
import * as cbs from "./cbs";
import * as rhea from "rhea";

export class EventHubReceiver extends EventEmitter {
  client: EventHubClient;
  name?: string;
  partitionId: string | number;
  consumerGroup: string;
  address: string;
  options?: ReceiveOptions;
  private _receiver: any;
  private _session: any;

  /**
   * Instantiate a new receiver from the AMQP `Receiver`. Used by `EventHubClient`.
   *
   * @constructor
   * @param {EventHubClient} client                     The EventHub client.
   * @param {(string | number)} partitionId             Partition ID from which to receive.
   * @param {ReceiveOptions} [options]                  Options for how you'd like to connect. Only one can be specified.
   * @param {(Date|Number)} options.startAfterTime      Only receive messages enqueued after the given time.
   * @param {string} options.startAfterOffset           Only receive messages after the given offset.
   * @param {string} options.customFilter               If you want more fine-grained control of the filtering.
   * @param {string} options.consumerGroup              Consumer group from which to receive.
   *      See https://github.com/Azure/amqpnetlite/wiki/Azure%20Service%20Bus%20Event%20Hubs for details.
   */
  constructor(client: EventHubClient, partitionId: string | number, options?: ReceiveOptions) {
    super();
    this.client = client;
    this.partitionId = partitionId;
    this.consumerGroup = options && options.consumerGroup ? options.consumerGroup : Constants.defaultConsumerGroup;
    this.address = `${this.client.config.entityPath}/ConsumerGroups/${this.consumerGroup}/Partitions/${this.partitionId}`;
    this.options = options;

    const onMessage = (context: any) => {
      const evData = EventData.fromAmqpMessage(context.message);
      this.emit(Constants.message, evData);
    };

    this.on("newListener", (event) => {
      if (event === Constants.message) {
        if (this._session && this._receiver) {
          this._receiver.on(Constants.message, onMessage);
        }
      }
    });

    this.on("removeListener", (event) => {
      if (event === Constants.message) {
        if (!this._session && this._receiver) {
          this._receiver.on(Constants.message, onMessage);
        }
      }
    });
  }

  /**
   * Negotiates the CBS claim and creates a new AMQP receiver under a new AMQP session.
   */
  async init(): Promise<void> {
    try {
      await this.client.open();
      const audience = `${this.client.config.endpoint}${this.address}`;
      const tokenObject = this.client.tokenProvider.getToken(audience);
      await cbs.negotiateClaim(audience, this.client.connection, tokenObject);
      if (!this._session && !this._receiver) {
        let rcvrOptions: rheaPromise.ReceiverOptions = {
          autoaccept: false,
          source: {
            address: this.address
          }
        };
        if (this.options) {
          let filterClause = "";
          if (this.options.startAfterTime) {
            let time = (this.options.startAfterTime instanceof Date) ? this.options.startAfterTime.getTime() : this.options.startAfterTime;
            filterClause = `${Constants.enqueuedTimeAnnotation} > '${time}'`;
          } else if (this.options.startAfterOffset) {
            filterClause = `${Constants.offsetAnnotation} > '${this.options.startAfterOffset}'`;
          } else if (this.options.customFilter) {
            filterClause = this.options.customFilter;
          }

          if (filterClause) {
            rcvrOptions.source.filter = {
              "apache.org:selector-filter:string": rhea.types.wrap_described(filterClause, 0x468C00000004)
            };
          }
        }
        this._session = await rheaPromise.createSession(this.client.connection);
        this._receiver = await rheaPromise.createReceiver(this._session, rcvrOptions);
        this.name = this._receiver.name;
      }
      this._ensureTokenRenewal();
    } catch (err) {
      return Promise.reject(err);
    }
  }

  /**
   * Closes the underlying AMQP receiver.
   */
  async close(): Promise<void> {
    try {
      await this._receiver.detach();
      this.removeAllListeners();
      this._receiver = undefined;
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
