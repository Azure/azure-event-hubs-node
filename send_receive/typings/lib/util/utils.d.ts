/// <reference types="async-lock" />
import * as AsyncLock from "async-lock";
export interface AsyncLockOptions {
    /**
     * @property {number} [timeout] The max timeout. Default is: 0 (never timeout).
     */
    timeout?: number;
    /**
     * @property {number} [maxPending] Maximum pending tasks. Default is: 1000.
     */
    maxPending?: number;
    /**
     * @property {boolean} [domainReentrant] Whether lock can reenter in the same domain. Default is: false.
     */
    domainReentrant?: boolean;
    /**
     * @property {any} [Promise] Your implementation of the promise. Default is: global promise.
     */
    Promise?: any;
}
export interface ParsedConnectionString {
    Endpoint: string;
    SharedAccessKeyName: string;
    SharedAccessKey: string;
    EntityPath?: string;
    [x: string]: any;
}
export declare function parseConnectionString(connectionString: string): ParsedConnectionString;
/**
 * Gets a new instance of the async lock with desired settings.
 * @param {AsyncLockOptions} [options] The async lock options.
 */
export declare function getNewAsyncLock(options?: AsyncLockOptions): AsyncLock;
/**
 * @constant {AsyncLock} defaultLock The async lock instance with default settings.
 */
export declare const defaultLock: AsyncLock;
