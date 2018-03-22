import { AmqpMessage } from "../eventData";
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
    private _token;
    private _owner;
    private _checkpointDetails;
    constructor(partitionId: string, owner: string, lease: Lease);
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
    checkpoint(): Promise<CheckpointInfo>;
    setCheckpointData(owner: string, token: string, epoch: number, offset: string, sequenceNumber: number): void;
    setCheckpointDataFromPayload(payload: CheckpointInfo): void;
    updateCheckpointDataFromLease(): Promise<CheckpointInfo>;
    /**
     * Updates data from the message, which should have an annotations field containing something like:
     *   "x-opt-sequence-number":6,"x-opt-offset":"480","x-opt-enqueued-time":"2015-12-18T17:26:49.331Z"
     *
     * @method updateCheckpointDataFromMessage
     * @param {*} message
     */
    updateCheckpointDataFromMessage(message: AmqpMessage): void;
}
