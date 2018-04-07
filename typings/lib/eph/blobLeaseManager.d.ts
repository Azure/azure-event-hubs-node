/// <reference types="node" />
import { EventEmitter } from "events";
import BlobLease, { Lease } from "./blobLease";
import { Dictionary } from "../eventData";
/**
 * Interface describing the Lease with renew interval and expiry time.
 * @interface LeaseWithDuration
 */
export interface LeaseWithDuration {
    /**
     * @property {Lease} lease - The actual lease.
     */
    lease: Lease;
    /**
     * @property {NodeJS.Timer} [interval] The renew interval.
     */
    interval?: NodeJS.Timer;
    /**
     * @property {number} [expires] The time in which the lease expires.
     */
    expires?: number;
}
export declare namespace LeaseManager {
    const acquired = "lease:acquired";
    const lost = "lease:lost";
    const released = "lease:released";
    let defaultLeaseDuration: number;
}
/**
 * Interface describing the LeaseManager. You can implement your own LeaseManager.
 * @interface
 */
export interface LeaseManager extends EventEmitter {
    /**
     * @property {number} leaseDuration The amount of time for which the lease can be held.
     */
    leaseDuration: number;
    /**
     * @property {object} leases A dictionary of leases that the manager is currently managing.
     */
    leases: Dictionary<LeaseWithDuration>;
    /**
     * Resets the dictionary of leases to an empty object.
     * @method reset
     */
    reset(): void;
    /**
     * Manages the specified lease.
     * @param {Lease} lease The lease to be managed.
     */
    manageLease(lease: Lease): void;
    /**
     * Unmanages the specified lease.
     * @param {Lease} lease The lease to be unmanaged.
     */
    unmanageLease(lease: Lease): Promise<void>;
}
/**
 * Describes the Azure Storage Blob lease manager.
 * @class BlobLeaseManager
 * @extends EventEmitter
 * @implements LeaseManager
 */
export default class BlobLeaseManager extends EventEmitter implements LeaseManager {
    static acquired: string;
    static lost: string;
    static released: string;
    static defaultLeaseDuration: number;
    leaseDuration: number;
    leases: Dictionary<LeaseWithDuration>;
    /**
     * Instantiates a BlobLeaseManager.
     * @constructor
     * @param {number} [leaseDurationInSeconds] The lease duration in seconds for which it can be held. Default value: 60.
     */
    constructor(leaseDurationInSeconds?: number);
    /**
     * Resets the leases dictionary to an empty object.
     */
    reset(): void;
    /**
     * Manages the specified blob lease.
     * @param {BlobLease} lease The lease to be managed.
     */
    manageLease(lease: BlobLease): void;
    /**
     * Unmanages the specified blob lease.
     * @param {BlobLease} lease The lease to be unmanaged.
     */
    unmanageLease(lease: BlobLease): Promise<void>;
    private _unmanage(lease);
    private _acquire(lease);
    private _maintain(lease);
}
