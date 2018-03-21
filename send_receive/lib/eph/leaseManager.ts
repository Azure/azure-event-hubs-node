// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { EventEmitter } from "events";
import * as debugModule from "debug";
import Lease from "./lease";
import { Dictionary } from "../eventData";
const debug = debugModule("cerulean:lease-manager");

export interface LeaseWithDuration {
  lease: Lease;
  interval?: NodeJS.Timer;
  expires?: number;
}

export default class LeaseManager extends EventEmitter {
  // Events
  static acquired: string = "lease:acquired";
  static lost: string = "lease:lost";
  static released: string = "lease:released";
  // seconds
  static defaultLeaseDuration: number = 60;

  leaseDuration: number = LeaseManager.defaultLeaseDuration;
  leases: Dictionary<LeaseWithDuration>;

  constructor(leaseDurationInSeconds?: number) {
    super();
    this.leases = {};
    this.leaseDuration = leaseDurationInSeconds || LeaseManager.defaultLeaseDuration;
  }

  manageLease(lease: Lease): void {
    this.leases[lease.fullUri] = { lease: lease };
    this._acquire(lease);
  }

  async unmanageLease(lease: Lease): Promise<void> {
    try {
      if (this.leases[lease.fullUri].interval) {
        this._unmanage(lease);
        await lease.release();
        debug("Released " + lease.fullUri);
        lease.setIsHeld(false);
        this.emit(LeaseManager.released, lease);
      }
    } catch (ignored) {
      debug("Ignoring error when unmanaging lease, as it likely means it was not held: ", ignored);
      this.emit(LeaseManager.released, lease);
    }
  }

  private _unmanage(lease: Lease): void {
    if (this.leases[lease.fullUri].interval) clearInterval(this.leases[lease.fullUri].interval as NodeJS.Timer);
    delete this.leases[lease.fullUri].interval;
  }

  private async _acquire(lease: Lease): Promise<void> {
    try {
      const acquireLease = async (): Promise<void> => {
        try {
          await lease.acquire({ leaseDuration: this.leaseDuration });
          debug("Acquired " + lease.fullUri);
          lease.setIsHeld(true);
          this._unmanage(lease);
          this.leases[lease.fullUri].expires = Date.now() + (this.leaseDuration * 1000);
          this._maintain(lease);
          this.emit(LeaseManager.acquired, lease);
        } catch (error) {
          const msg = `Failed to acquire lease for '${lease.fullUri}': ${error}. Will retry.`;
          debug(msg);
          return Promise.reject(msg);
        }
      };
      this.leases[lease.fullUri].interval = setInterval(acquireLease, this.leaseDuration * 1000);
      await acquireLease(); // Best-case scenario, it acquires immediately and clears the interval.
    } catch (err) {
      return Promise.reject(err);
    }
  }

  private async _maintain(lease: Lease): Promise<void> {
    try {
      const renewPeriod = (this.leaseDuration / 4) * 1000;
      this.leases[lease.fullUri].interval = setInterval(async () => {
        try {
          await lease.renew({ leaseDuration: this.leaseDuration });
          debug(`Renewed '${lease.fullUri}'`);
          this.leases[lease.fullUri].expires = Date.now() + (this.leaseDuration * 1000);
        } catch (error) {
          if ((this.leases[lease.fullUri].expires as number) < Date.now() + renewPeriod) {
            // We"ll expire before next renewal comes in.
            // Alert a lease loss, delay a bit, and then queue up a re-acquire.
            this._unmanage(lease);
            this.emit(LeaseManager.lost, lease);
            lease.setIsHeld(false);
            setTimeout(() => {
              debug(`Lease '${lease.fullUri}' lost. Attempting to re-acquire.`);
              this._acquire(lease);
            }, renewPeriod * 2);
          } else {
            debug(`Failed to renew lease for '${lease.fullUri}': '${error}'. Will retry.`);
          }
        }
      }, renewPeriod);
    } catch (err) {
      return Promise.reject(err);
    }
  }
}
