import * as Constants from "./util/constants";

export interface EventData {
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
}

export namespace EventData {
  export interface Dictionary<T> {
    [key: string]: T;
  }
  export function fromAmqpMessage(msg: any): EventData {
    // TODO: Look at how other sdks are encoding their payloads and copy them. This will ensure consistency across all the sdks.
    let data: any = {
      body: msg.body,
    };
    if (msg.message_annotations) {
      data.annotations = msg.message_annotations;
      data.partitionKey = msg.message_annotations[Constants.partitionKey];
      data.sequenceNumber = msg.message_annotations[Constants.sequenceNumber];
      data.enqueuedTimeUtc = msg.message_annotations[Constants.enqueuedTime];
      data.offset = msg.message_annotations[Constants.offset];
    }
    if (msg.properties) {
      data.properties = msg.properties;
      data.systemProperties = msg.properties;
    }
    if (msg.application_properties) {
      data.applicationProperties = msg.application_properties;
    }
    return data;
  }
}
