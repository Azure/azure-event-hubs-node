// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

export { EventData, AmqpMessage, AmqpMessageAnnotations, Dictionary } from "./eventData";
export { ConnectionConfig } from "./connectionConfig";
export { EventHubReceiver, ReceiverRuntimeInfo, OnMessage as ReceiverOnMessage } from "./eventHubReceiver";
export { EventHubSender } from "./eventHubSender";
import * as Errors from "./errors";
export { EventHubClient, ReceiveOptions } from "./eventHubClient";
export { EventHubPartitionRuntimeInformation, EventHubRuntimeInformation } from "./managementClient";
export { TokenType, TokenProvider, TokenInfo } from "./auth/token";
import EventProcessorHost, { OnOpen, OnClose, OnMessage } from "./eph/eventProcessorHost";
import BlobLeaseManager, { LeaseManager, LeaseWithDuration } from "./eph/blobLeaseManager";
import BlobLease, { Lease, CreateContainerResult } from "./eph/blobLease";
import PartitionContext, { CheckpointInfo } from "./eph/partitionContext";
export {
  EventProcessorHost, OnOpen, OnClose, OnMessage, PartitionContext,
  CheckpointInfo, BlobLease, BlobLeaseManager, LeaseManager,
  LeaseWithDuration, Lease, CreateContainerResult, Errors
};
export { aadEventHubsAudience } from "./util/constants";
export import EventHubManagementClient = require("azure-arm-eventhub");
import * as EventHubManagementModels from "azure-arm-eventhub/lib/models";
export { EventHubManagementModels };
