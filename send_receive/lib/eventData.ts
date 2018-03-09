// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import * as Constants from "./util/constants";

export interface Dictionary<T> {
  [key: string]: T;
}

export interface EventData {
  // string or decoded json of that string
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
  // TODO: Ask Gordon about other AMQP message properties like durable, first_acquirer, etc.
  // https://docs.microsoft.com/en-us/azure/service-bus-messaging/service-bus-amqp-protocol-guide#messages
  body: any;
  message_annotations?: AmqpMessageAnnotations;
  properties?: Dictionary<any>;
  application_properties?: Dictionary<any>;
}

export namespace EventData {

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
    }
    if (msg.application_properties) {
      data.applicationProperties = msg.application_properties;
    }
    return data;
  }

  export function toAmqpMessage(data: EventData): AmqpMessage {
    let msg: AmqpMessage = {
      body: data.body
    };
    if (data.annotations) {
      msg.message_annotations = data.annotations;
    }
    if (data.properties) {
      msg.properties = data.properties;
    }
    if (data.applicationProperties) {
      msg.application_properties = data.applicationProperties;
    }
    if (data.partitionKey) {
      if (!msg.message_annotations) msg.message_annotations = {};
      msg.message_annotations[Constants.partitionKey] = data.partitionKey;
    }
    if (data.sequenceNumber) {
      if (!msg.message_annotations) msg.message_annotations = {};
      msg.message_annotations[Constants.sequenceNumber] = data.sequenceNumber;
    }
    if (data.enqueuedTimeUtc) {
      if (!msg.message_annotations) msg.message_annotations = {};
      msg.message_annotations[Constants.enqueuedTime] = data.enqueuedTimeUtc;
    }
    if (data.offset) {
      if (!msg.message_annotations) msg.message_annotations = {};
      msg.message_annotations[Constants.offset] = data.offset;
    }
    return msg;
  }
}
