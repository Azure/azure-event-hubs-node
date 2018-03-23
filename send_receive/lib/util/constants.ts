// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

export const partitionKey = "x-opt-partition-key";
export const sequenceNumber = "x-opt-sequence-number";
export const enqueuedTime = "x-opt-enqueued-time";
export const offset = "x-opt-offset";
export const enqueuedTimeAnnotation = "amqp.annotation.x-opt-enqueued-time";
export const offsetAnnotation = "amqp.annotation.x-opt-offset";
export const message = "message";
export const error = "error";
export const statusCode = "status-code";
export const statusDescription = "status-description";
export const errorCondition = "error-condition";
export const management = "$management";
export const partition = "partition";
export const partitionId = "partitionId";
export const readOperation = "READ";
export const TLS = "tls";
export const defaultConsumerGroup = "$default";
export const eventHub = "eventhub";
export const cbsEndpoint = "$cbs";
export const cbsReplyTo = "cbs";
export const operationPutToken = "put-token";
export const aadEventHubsAudience = "https://eventhubs.azure.net/";
export const maxUserAgentLength = 128;
export const packageJsonInfo = require("../../../package.json");
export const vendorString = "com.microsoft";
export const attachEpoch = `${vendorString}:epoch`;
export const enableReceiverRuntimeMetricName = `${vendorString}:enable-receiver-runtime-metric`;
export const receiverError = "receiver_error";
export const senderError = "sender_error";
export const sessionError = "session_error";
export const connectionError = "connection_error";
export const defaultOperationTimeoutInSeconds = 60;
export const managementRequestKey = "managementRequest";
export const negotiateCbsKey = "negotiateCbs";
export const ensureContainerAndBlob = "ensureContainerAndBlob";
