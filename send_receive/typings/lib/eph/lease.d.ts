import { BlobService, ServiceResponse } from "azure-storage";
export interface CreateContainerResult {
    created: BlobService.ContainerResult;
    details: ServiceResponse;
}
export default class Lease {
    static notHeldError: string;
    static _beginningOfTime: string;
    partitionId?: string;
    leaseId?: string;
    storageAccount: any;
    blobService: BlobService;
    container: any;
    blob: any;
    fullUri: string;
    private _isHeld;
    private _containerAndBlobExist;
    constructor(storageConnectionString: string, container: any, blob: any);
    ensureContainerAndBlobExist(): Promise<void>;
    /**
     * Returns the best-guess as to whether the lease is still held. May not be accurate if lease has expired.
     *
     * @method isHeld
     *
     * @returns {boolean}
     */
    isHeld(): boolean;
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
    setIsHeld(isItHeld: boolean): void;
    acquire(options: BlobService.AcquireLeaseRequestOptions): Promise<Lease>;
    renew(options: BlobService.AcquireLeaseRequestOptions): Promise<Lease>;
    release(options?: BlobService.LeaseRequestOptions): Promise<Lease>;
    updateContents(text: string, options?: BlobService.CreateBlobRequestOptions): Promise<Lease>;
    getContents(options?: BlobService.GetBlobRequestOptions): Promise<string>;
    private _ensureContainerExists();
    private _ensureBlobExists();
    static createFromNameAndKey(storageAccount: string, storageKey: string, container: BlobService.ContainerResult, blob: BlobService.BlobResult): Lease;
}
