import * as rhea from "rhea"

export namespace EventData {
  export interface Dictionary<T> {
    [key: string]: T;
  }
}

export class EventData {
  // string or decoded json of that string
  readonly body: any;
  readonly enqueuedTimeUtc?: Date | string | number;
  readonly partitionKey?: string | null;
  readonly offset?: string;
  readonly sequenceNumber?: number;
  readonly annotations?: EventData.Dictionary<any>;
  readonly systemProperties?: EventData.Dictionary<any>;
  properties?: EventData.Dictionary<any>;
  applicationProperties?: EventData.Dictionary<any>;

  constructor(body: any, annotations: EventData.Dictionary<any>, properties: EventData.Dictionary<any>, applicationProperties: EventData.Dictionary<any>) {
    this.body = body;
    this.annotations = annotations;
    this.properties = properties;
    this.systemProperties = properties;
    this.applicationProperties = applicationProperties;
    if (this.annotations) {
      this.partitionKey = this.annotations["x-opt-partition-key"];
      this.sequenceNumber = this.annotations["x-opt-sequence-number"];
      this.enqueuedTimeUtc = this.annotations["x-opt-enqueued-time"];
      this.offset = this.annotations["x-opt-offset"];
    }
  }

  static fromAmqpMessage(msg: any): EventData {
    return new EventData(msg.body, msg.message_annotations, msg.properties, msg.application_properties);
  }
}