// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

export { EventData } from "./eventData";
export { ConnectionConfig } from "./connectionConfig";
export { EventHubReceiver } from "./eventHubReceiver";
export { EventHubSender } from "./eventHubSender";
export {
  EventHubClient, EventHubPartitionRuntimeInformation,
  EventHubRuntimeInformation, ReceiveOptions
} from "./eventHubClient";

export { TokenType, TokenProvider, TokenInfo } from "./auth/token";

export { aadEventHubsAudience } from "./util/constants";
export import EventHubManagementClient = require("azure-arm-eventhub");
import * as EventHubManagementModels from "azure-arm-eventhub/lib/models";
export { EventHubManagementModels };
