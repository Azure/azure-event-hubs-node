/// <reference types="node" />
import { EventEmitter } from "events";
import Lease from "./lease";
import { Dictionary } from "../eventData";
export interface LeaseWithDuration {
    lease: Lease;
    interval?: NodeJS.Timer;
    expires?: number;
}
export default class LeaseManager extends EventEmitter {
    static acquired: string;
    static lost: string;
    static released: string;
    static defaultLeaseDuration: number;
    leaseDuration: number;
    leases: Dictionary<LeaseWithDuration>;
    constructor(leaseDurationInSeconds?: number);
    manageLease(lease: Lease): void;
    unmanageLease(lease: Lease): Promise<void>;
    private _unmanage(lease);
    private _acquire(lease);
    private _maintain(lease);
}
