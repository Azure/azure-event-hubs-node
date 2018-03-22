// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { EventHubClient } from "../eventHubClient";
import { EventEmitter } from "events";
import * as debugModule from "debug";
import { ArgumentError } from "../errors";
import PartitionContext from "./partitionContext";
import { EventHubReceiver } from "..";
import LeaseManager from "./leaseManager";
import Lease from "./lease";
import { Dictionary } from "../eventData";
const debug = debugModule("azure:event-hubs:processor:host");


export default class EventProcessorHost extends EventEmitter {
  /**
   * Opened: Triggered whenever a partition obtains its lease. Passed the PartitionContext.
   */
  static opened: string = "ephost:opened";
  /**
   * Triggered whenever a partition loses its lease and has to stop receiving,
   * or when the host is shut down. Passed the PartitionContext and the closing reason.
   */
  static closed: string = "ephost:closed";
  /**
   * Message: Triggered whenever a message comes in on a given partition.
   * Passed the PartitionContext and a message.
   */
  static message: string = "ephost:message";

  private _hostName: string;
  private _consumerGroup: string;
  private _storageConnectionString: string;
  private _eventHubClient: EventHubClient;
  private _leaseManager?: LeaseManager;
  private _contextByPartition?: Dictionary<PartitionContext>;
  private _receiverByPartition?: Dictionary<EventHubReceiver>;

  constructor(name: string, consumerGroup: string, storageConnectionString: string, eventHubClient: EventHubClient) {
    super();
    function ensure(paramName: string, param: any): void {
      if (!param) throw new ArgumentError(paramName + " cannot be null or missing");
    }
    ensure("name", name);
    ensure("consumerGroup", consumerGroup);
    ensure("storageConnectionString", storageConnectionString);
    ensure("eventHubClient", eventHubClient);

    this._hostName = name;
    this._consumerGroup = consumerGroup;
    this._eventHubClient = eventHubClient;
    this._storageConnectionString = storageConnectionString;
  }

  /**
   * Starts the event processor host, fetching the list of partitions, (optionally) filtering them, and attempting
   * to grab leases on the (filtered) set. For each successful lease, will get the details from the blob and start
   * a receiver at the point where it left off previously.
   *
   * @method start
   * @param {function} [partitionFilter]  Predicate that takes a partition ID and return true/false for whether we should
   *  attempt to grab the lease and watch it. If not provided, all partitions will be tried.
   *
   * @return {Promise}
   */
  async start(partitionFilter?: Function): Promise<EventProcessorHost> {
    try {
      this._contextByPartition = {};
      this._receiverByPartition = {};
      this._leaseManager = new LeaseManager();
      this._leaseManager.on(LeaseManager.acquired, (lease) => {
        debug("Acquired lease on " + lease.partitionId);
        this._attachReceiver(lease.partitionId);
      });
      this._leaseManager.on(LeaseManager.lost, (lease) => {
        debug("Lost lease on " + lease.partitionId);
        this._detachReceiver(lease.partitionId, "Lease lost");
      });
      this._leaseManager.on(LeaseManager.released, (lease) => {
        debug("Released lease on " + lease.partitionId);
        this._detachReceiver(lease.partitionId, "Lease released");
      });
      const ids = await this._eventHubClient.getPartitionIds();
      for (let i = 0; i < ids.length; i++) {
        let id = ids[i];
        if (partitionFilter && !partitionFilter(id)) {
          debug("Skipping partition " + id);
          continue;
        }
        debug("Managing lease for partition " + id);
        const blobPath = this._consumerGroup + "/" + id;
        const lease = new Lease(this._storageConnectionString, this._hostName, blobPath);
        lease.partitionId = id;
        this._contextByPartition![id] = new PartitionContext(id, this._hostName, lease);
        this._leaseManager!.manageLease(lease);
      }
    } catch (err) {
      return Promise.reject(err);
    }
    return this;
  }

  async stop(): Promise<void> {
    const unmanage = (l) => { return this._leaseManager!.unmanageLease(l); };
    let releases = [];
    for (const partitionId in this._contextByPartition!) {
      if (!this._contextByPartition!.hasOwnProperty(partitionId)) continue;
      const id = partitionId;
      const context = this._contextByPartition![id];
      await this._detachReceiver(id);
      unmanage.bind(undefined, context.lease);
      releases.push();
    }
    return Promise.all(releases).then(() => {
      this._leaseManager = undefined;
      this._contextByPartition = {};
    });
  }

  private async _attachReceiver(partitionId: string): Promise<EventHubReceiver> {
    const context = this._contextByPartition![partitionId];
    if (!context) return Promise.reject(new Error("Invalid state - missing context for partition " + partitionId));

    const checkpoint = await context.updateCheckpointDataFromLease();
    let filterOptions: any;
    if (checkpoint && checkpoint.offset) {
      filterOptions = { startAfterOffset: checkpoint.offset };
    }
    const receiver = await this._eventHubClient.createReceiver(partitionId, { consumerGroup: this._consumerGroup, filter: filterOptions });
    debug(`[${this._eventHubClient.connection.options.id}] Attaching receiver "${receiver.name}" for partition "${partitionId}" with offset: ${(checkpoint ? checkpoint.offset : "None")}`);
    this.emit(EventProcessorHost.opened, context);
    this._receiverByPartition![partitionId] = receiver;
    receiver.on("message", (message) => {
      context.updateCheckpointDataFromMessage(message);
      this.emit(EventProcessorHost.message, context, message);
    });
    return receiver;
  }

  private async _detachReceiver(partitionId: string, reason?: string): Promise<void> {
    const context = this._contextByPartition![partitionId];
    const receiver = this._receiverByPartition![partitionId];
    if (receiver) {
      delete this._receiverByPartition![partitionId];
      await receiver.close();
      debug(`[${this._eventHubClient.connection.options.id}] Closed the receiver "${receiver.name}".`);
      this.emit(EventProcessorHost.closed, context, reason);
    }
  }

  static createFromConnectionString(name: string, consumerGroup: string, storageConnectionString: string, eventHubConnectionString: string, eventHubPath: string): EventProcessorHost {
    return new EventProcessorHost(name, consumerGroup, storageConnectionString, EventHubClient.createFromConnectionString(eventHubConnectionString, eventHubPath));
  }
}
