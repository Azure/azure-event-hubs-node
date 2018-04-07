import { EventData } from "../eventData";
import BlobLease from "./blobLease";
export interface CheckpointInfo {
    partitionId: string;
    owner: string;
    token: string;
    epoch: number;
    offset?: string;
    sequenceNumber: number;
}
/**
 * Describes the Partition Context.
 * @class PartitionContext
 */
export default class PartitionContext {
    partitionId: string;
    lease: BlobLease;
    private _token;
    private _owner;
    private _checkpointDetails;
    /**
     * Creates a new PartitionContext.
     * @param {string} partitionId The eventhub partition id.
     * @param {string} owner The name of the owner.
     * @param {BlobLease} lease The lease object.
     */
    constructor(partitionId: string, owner: string, lease: BlobLease);
    /**
     * Stores the checkpoint data into the appropriate blob, assuming the lease is held (otherwise, rejects).
     *
     * The checkpoint data is structured as a JSON payload (example):
     * {"partitionId":"0","owner":"ephtest","token":"48e209e3-55f0-41b8-a8dd-d9c09ff6c35a","epoch":1,"offset":"","sequenceNumber":0}
     *
     * @method checkpoint
     *
     * @return {Promise<CheckpointInfo>}
     */
    checkpoint(): Promise<CheckpointInfo>;
    setCheckpointData(owner: string, token: string, epoch: number, offset: string, sequenceNumber: number): void;
    setCheckpointDataFromPayload(payload: CheckpointInfo): void;
    /**
     * Updates the checkpoint data from the owned lease.
     * @return {Promise<CheckpointInfo>}
     */
    updateCheckpointDataFromLease(): Promise<CheckpointInfo>;
    /**
     * Updates data from the message, which should have an annotations field containing something like:
     *   "x-opt-sequence-number":6,"x-opt-offset":"480","x-opt-enqueued-time":"2015-12-18T17:26:49.331Z"
     *
     * @method updateCheckpointDataFromMessage
     * @param {EventData} eventData The event data received from the EventHubReceiver.
     */
    updateCheckpointDataFromEventData(eventData: EventData): void;
}
