import { BlobService, ServiceResponse } from "azure-storage";
export interface CreateContainerResult {
    created: BlobService.ContainerResult;
    details: ServiceResponse;
}
export interface Lease {
    partitionId?: string;
    leaseId?: string;
    isHeld: boolean;
    acquire(options: any): Promise<Lease>;
    renew(options: any): Promise<Lease>;
    release(options: any): Promise<Lease>;
    updateContent(text: string, options?: any): Promise<Lease>;
    getContent(options?: any): Promise<string>;
}
export default class BlobLease implements Lease {
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
    /**
     * Ensures that the container and blob exist.
     */
    ensureContainerAndBlobExist(): Promise<void>;
    /**
     * Returns the best-guess as to whether the lease is still held. May not be accurate if lease has expired.
     * @returns {boolean}
     */
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
    isHeld: boolean;
    acquire(options: BlobService.AcquireLeaseRequestOptions): Promise<BlobLease>;
    renew(options: BlobService.AcquireLeaseRequestOptions): Promise<BlobLease>;
    release(options?: BlobService.LeaseRequestOptions): Promise<BlobLease>;
    /**
     * Updates content from the Azure Storage Blob.
     * @param {string} text The text to be written
     * @param {BlobService.CreateBlobRequestOptions} options The options that can be provided while writing content to the blob.
     */
    updateContent(text: string, options?: BlobService.CreateBlobRequestOptions): Promise<BlobLease>;
    /**
     * Gets content from the Azure Storage Blob.
     * @param {BlobService.GetBlobRequestOptions} options Options to be passed while getting content from the blob.
     */
    getContent(options?: BlobService.GetBlobRequestOptions): Promise<string>;
    private _ensureContainerExists();
    private _ensureBlobExists();
    /**
     * Creates a lease from storage account name and key
     * @param {string} storageAccount The name of the storage account.
     * @param {string} storageKey The storage key value.
     * @param {BlobService.ContainerResult} container The Azure storage blob container.
     * @param {BlobService.BlobResult} blob The Azure storage blob.
     */
    static createFromNameAndKey(storageAccount: string, storageKey: string, container: BlobService.ContainerResult, blob: BlobService.BlobResult): BlobLease;
}
