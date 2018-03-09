export interface Dictionary<T> {
    [key: string]: T;
}
export interface EventData {
    body: any;
    readonly enqueuedTimeUtc?: Date | string | number;
    readonly partitionKey?: string | null;
    readonly offset?: string;
    readonly sequenceNumber?: number;
    readonly annotations?: Dictionary<any>;
    properties?: Dictionary<any>;
    applicationProperties?: Dictionary<any>;
}
export interface AmqpMessageAnnotations {
    "x-opt-partition-key"?: string | null;
    "x-opt-sequence-number"?: number;
    "x-opt-enqueued-time"?: Date | string | number;
    "x-opt-offset"?: string;
    [x: string]: any;
}
export interface AmqpMessage {
    body: any;
    message_annotations?: AmqpMessageAnnotations;
    properties?: Dictionary<any>;
    application_properties?: Dictionary<any>;
}
export declare namespace EventData {
    function fromAmqpMessage(msg: any): EventData;
    function toAmqpMessage(data: EventData): AmqpMessage;
}
