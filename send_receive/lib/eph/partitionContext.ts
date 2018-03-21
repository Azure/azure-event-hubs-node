// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import * as debugModule from "debug";
const debug = debugModule("azure:event-hubs:processor:partition");
import * as uuid from "uuid/v4";
import { AmqpMessage } from "../eventData";
import * as Constants from "../util/constants";
import Lease from "./lease";

export interface CheckpointInfo {
  partitionId: string;
  owner: string;
  token: string;
  epoch: number;
  offset: string;
  sequenceNumber: number;
}

export default class PartitionContext {
  partitionId: string;
  lease: Lease;
  private _token: string;
  private _owner: string;
  private _checkpointDetails: CheckpointInfo;

  constructor(partitionId: string, owner: string, lease: Lease) {
    this.partitionId = partitionId;
    this._owner = owner;
    this.lease = lease;
    this._token = uuid();
    this._checkpointDetails = {
      partitionId: this.partitionId,
      owner: this._owner,
      token: this._token,
      epoch: 1,
      offset: "",
      sequenceNumber: 0
    };
  }

  /**
   * Stores the checkpoint data into the appropriate blob, assuming the lease is held (otherwise, rejects).
   *
   * The checkpoint data is compatible with the .NET EventProcessorHost, and is structured as a JSON payload (example):
   * {"PartitionId":"0","Owner":"ephtest","Token":"48e209e3-55f0-41b8-a8dd-d9c09ff6c35a","Epoch":1,"Offset":"","SequenceNumber":0}
   *
   * @method checkpoint
   *
   * @return {Promise<CheckpointInfo>}
   */
  async checkpoint(): Promise<CheckpointInfo> {
    try {
      if (this.lease.isHeld()) {
        this._checkpointDetails.owner = this._owner; // We"re setting it, ensure we"re the owner.
        await this.lease.updateContents(JSON.stringify(this._checkpointDetails));
        return this._checkpointDetails;
      } else {
        return Promise.reject(new Error("Lease not held"));
      }
    } catch (err) {
      return Promise.reject(err);
    }
  }

  setCheckpointData(owner: string, token: string, epoch: number, offset: string, sequenceNumber: number): void {
    this._checkpointDetails.owner = owner;
    this._checkpointDetails.token = token;
    this._checkpointDetails.epoch = epoch;
    this._checkpointDetails.offset = offset;
    this._checkpointDetails.sequenceNumber = sequenceNumber;
  }

  setCheckpointDataFromPayload(payload: CheckpointInfo): void {
    this._checkpointDetails = payload;
  }

  async updateCheckpointDataFromLease(): Promise<CheckpointInfo> {
    try {
      const contents: string = await this.lease.getContents();
      if (contents) {
        debug("Lease " + this.lease.fullUri + " contents: " + contents);
        try {
          const payload = JSON.parse(contents);
          this.setCheckpointDataFromPayload(payload);
        } catch (err) {
          return Promise.reject("Invalid payload '" + contents + "': " + err);
        }
      }
      return this._checkpointDetails;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  /**
   * Updates data from the message, which should have an annotations field containing something like:
   *   "x-opt-sequence-number":6,"x-opt-offset":"480","x-opt-enqueued-time":"2015-12-18T17:26:49.331Z"
   *
   * @method updateCheckpointDataFromMessage
   * @param {*} message
   */
  updateCheckpointDataFromMessage(message: AmqpMessage): void {
    if (message && message.message_annotations) {
      const anno = message.message_annotations;
      if (anno[Constants.enqueuedTime]) this._checkpointDetails.epoch = anno[Constants.enqueuedTime] as number;
      if (anno[Constants.offset]) this._checkpointDetails.offset = anno[Constants.offset] as string;
      if (anno[Constants.sequenceNumber]) this._checkpointDetails.sequenceNumber = anno[Constants.sequenceNumber] as number;
    }
  }
}
