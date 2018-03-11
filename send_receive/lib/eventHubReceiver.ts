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
  enableReceiverRuntimeMetric: boolean = false;
  options?: ReceiveOptions;
  private _receiver: any;
  private _session: any;


  /**
   * Instantiate a new receiver from the AMQP `Receiver`. Used by `EventHubClient`.
   *
   * @constructor
   * @param {EventHubClient} client                            The EventHub client.
   * @param {(string | number)} partitionId                    Partition ID from which to receive.
   * @param {ReceiveOptions} [options]                         Options for how you'd like to connect.
   * @param {string} options.consumerGroup                     Consumer group from which to receive.
   * @param {boolean} options.enableReceiverRuntimeMetric      Whether the runtime metric of a receiver is enabled
   * @param {ReceiveOptions.filter} [options.filter]           Filter settings on the receiver. Only one of
   * startAfterTime, startAfterOffset, customFilter can be specified
   * @param {(Date|Number)} options.filter.startAfterTime      Only receive messages enqueued after the given time.
   * @param {string} options.filter.startAfterOffset           Only receive messages after the given offset.
   * @param {string} options.filter.customFilter               If you want more fine-grained control of the filtering.
   *      See https://github.com/Azure/amqpnetlite/wiki/Azure%20Service%20Bus%20Event%20Hubs for details.
   */
  constructor(client: EventHubClient, partitionId: string | number, options?: ReceiveOptions) {
    super();
    if (!options) options = {};
    this.client = client;
    this.partitionId = partitionId;
    this.consumerGroup = options.consumerGroup ? options.consumerGroup : Constants.defaultConsumerGroup;
    this.address = `${this.client.config.entityPath}/ConsumerGroups/${this.consumerGroup}/Partitions/${this.partitionId}`;
    this.enableReceiverRuntimeMetric = false;
    if (options.enableReceiverRuntimeMetric !== null && options.enableReceiverRuntimeMetric !== undefined) {
      this.enableReceiverRuntimeMetric = options.enableReceiverRuntimeMetric;
    }
    this.options = options;

    const onMessage = (context: any) => {
      const evData = EventData.fromAmqpMessage(context.message);
      console.log(">>>>>>>>> raw message>>>>>>>> ", context.message);
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
      const tokenObject = await this.client.tokenProvider.getToken(audience);
      await cbs.negotiateClaim(audience, this.client.connection, tokenObject);
      if (!this._session && !this._receiver) {
        let rcvrOptions: rheaPromise.ReceiverOptions = {
          autoaccept: false,
          source: {
            address: this.address
          }
        };
        if (this.options) {
          // Set filter on the receiver if specified.
          if (this.options.filter) {
            let filterSetting = this.options.filter;
            let filterClause = "";
            if (filterSetting.startAfterTime) {
              let time = (filterSetting.startAfterTime instanceof Date) ? filterSetting.startAfterTime.getTime() : filterSetting.startAfterTime;
              filterClause = `${Constants.enqueuedTimeAnnotation} > '${time}'`;
            } else if (filterSetting.startAfterOffset) {
              filterClause = `${Constants.offsetAnnotation} > '${filterSetting.startAfterOffset}'`;
            } else if (filterSetting.customFilter) {
              filterClause = filterSetting.customFilter;
            }

            if (filterClause) {
              rcvrOptions.source.filter = {
                "apache.org:selector-filter:string": rhea.types.wrap_described(filterClause, 0x468C00000004)
              };
            }
          }
          // if (this.options.enableReceiverRuntimeMetric) {
          //   rcvrOptions.desired_capabilities = "com.microsoft:enable-receiver-runtime-metric";
          // }
          // {"delivery_annotations":{"last_enqueued_sequence_number":69,"last_enqueued_offset":"13064","last_enqueued_time_utc":1520644564474,"runtime_info_retrieval_time_utc":1520644564490},"message_annotations":{"x-opt-sequence-number":69,"x-opt-offset":"13064","x-opt-enqueued-time":1520644564474},"body":"Hello awesome world!!"}
          // >>> EventDataObject: {
          //  body: 'Hello awesome world!!',
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
