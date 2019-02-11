// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { EventHubClient, EventData, EventPosition } from "../lib";
import * as dotenv from "dotenv";
dotenv.config();

const connectionString = "EVENTHUB_CONNECTION_STRING";
const entityPath = "EVENTHUB_NAME";
const str = process.env[connectionString] || "";
const path = process.env[entityPath] || "";


async function main(): Promise<void> {
  const client = EventHubClient.createFromConnectionString(str, path);
  const partitionIs = await client.getPartitionIds();
  const result: EventData[] = await client.receiveBatch(partitionIs[0], 10, 20, { eventPosition: EventPosition.fromStart() });
  let i = 0;
  for (const data of result) {
    console.log("### Actual message (%d):", ++i, data.body);
  }
  await client.close();
}

main().catch((err) => {
  console.log("error: ", err);
});
