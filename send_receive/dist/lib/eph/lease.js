"use strict";
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
Object.defineProperty(exports, "__esModule", { value: true });
const azure_storage_1 = require("azure-storage");
const debugModule = require("debug");
const debug = debugModule("cerulean:lease");
class Lease {
    constructor(storageConnectionString, container, blob) {
        this._isHeld = false;
        this._containerAndBlobExist = false;
        this.blobService = azure_storage_1.createBlobService(storageConnectionString);
        this.storageAccount = (storageConnectionString.match("AccountName=([^;]*);") || [])[1];
        this.container = container;
        this.blob = blob;
        this.fullUri = `https://${this.storageAccount}.blob.core.windows.net/${container}/${blob}`;
        this._isHeld = false;
        this._containerAndBlobExist = false;
        debug(`Full lease path: ${this.fullUri}`);
    }
    async ensureContainerAndBlobExist() {
        try {
            if (!this._containerAndBlobExist) {
                await this._ensureContainerExists();
                await this._ensureBlobExists();
                this._containerAndBlobExist = true;
            }
        }
        catch (err) {
            return Promise.reject(err);
        }
    }
    /**
     * Returns the best-guess as to whether the lease is still held. May not be accurate if lease has expired.
     *
     * @method isHeld
     *
     * @returns {boolean}
     */
    isHeld() {
        return this._isHeld;
    }
    /**
     * Since others may manage lease renewal/acquisition, this allows them to tell the lease whether they believe it is held or not.
     * For instance, if the LeaseManager fails to renew the lease once, the lease may still be held, but after multiple times,
     * the hold might expire. The LeaseManager may choose to tell the lease that it has lost the hold before that has actually occurred.
     *
     * The lease is normally pretty good about managing this itself (on acquire/renew/release success), but for special cases (like the above)
     * this method might be required.
     *
     * @param isItHeld
     */
    setIsHeld(isItHeld) {
        this._isHeld = isItHeld;
    }
    async acquire(options) {
        try {
            await this.ensureContainerAndBlobExist();
            return new Promise((resolve, reject) => {
                this.blobService.acquireLease(this.container, this.blob, options, (error, result, response) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        this.leaseId = result.id;
                        debug(`Acquired lease: ${this.leaseId}`, result);
                        this._isHeld = true;
                        resolve(this);
                    }
                });
            });
        }
        catch (err) {
            return Promise.reject(err);
        }
    }
    renew(options) {
        return new Promise((resolve, reject) => {
            if (!this.leaseId) {
                reject(new Error(Lease.notHeldError));
            }
            else {
                this.blobService.renewLease(this.container, this.blob, this.leaseId, options, (error, result, response) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        debug(`Renewed lease: ${this.leaseId}`, result);
                        this._isHeld = true;
                        resolve(this);
                    }
                });
            }
        });
    }
    release(options) {
        return new Promise((resolve, reject) => {
            if (!this.leaseId) {
                reject(new Error(Lease.notHeldError));
            }
            else {
                if (!options)
                    options = {};
                this.blobService.releaseLease(this.container, this.blob, this.leaseId, options, (error, result, response) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        debug(`Released lease: ${this.leaseId}`, result);
                        delete this.leaseId;
                        this._isHeld = false;
                        resolve(this);
                    }
                });
            }
        });
    }
    updateContents(text, options) {
        return new Promise((resolve, reject) => {
            if (!this.leaseId) {
                reject(new Error(Lease.notHeldError));
            }
            else {
                if (!options)
                    options = {};
                if (!options.leaseId)
                    options.leaseId = this.leaseId;
                this.blobService.createBlockBlobFromText(this.container, this.blob, text, options, (error, result, response) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        debug(`Updated blob contents with: ${this.leaseId}`, result);
                        resolve(this);
                    }
                });
            }
        });
    }
    getContents(options) {
        return new Promise((resolve, reject) => {
            if (!this.leaseId) {
                reject(new Error(Lease.notHeldError));
            }
            else {
                if (!options)
                    options = {};
                if (!options.leaseId)
                    options.leaseId = this.leaseId;
                this.blobService.getBlobToText(this.container, this.blob, options, (error, text, result, response) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        debug(`Fetched blob contents with: ${this.leaseId}`, text, result);
                        resolve(text);
                    }
                });
            }
        });
    }
    _ensureContainerExists() {
        const self = this;
        return new Promise((resolve, reject) => {
            self.blobService.createContainerIfNotExists(self.container, (error, result, response) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve({ created: result, details: response });
                }
            });
        });
    }
    _ensureBlobExists() {
        const self = this;
        return new Promise((resolve, reject) => {
            // Honestly, there"s no better way to say "hey, make sure this thing exists?"
            const options = { accessConditions: { DateUnModifiedSince: Lease._beginningOfTime } };
            self.blobService.createBlockBlobFromText(self.container, self.blob, "", options, (error, result, response) => {
                if (error) {
                    if (error.statusCode === 412) {
                        // Blob already exists.
                        resolve();
                    }
                    else {
                        reject(error);
                    }
                }
                else {
                    resolve();
                }
            });
        });
    }
    static createFromNameAndKey(storageAccount, storageKey, container, blob) {
        const connectionString = `DefaultEndpointsProtocol=https;AccountName=${storageAccount};AccountKey=${storageKey}`;
        return new Lease(connectionString, container, blob);
    }
}
Lease.notHeldError = "Lease not held";
Lease._beginningOfTime = new Date(1990, 1, 1).toUTCString();
exports.default = Lease;
//# sourceMappingURL=lease.js.map