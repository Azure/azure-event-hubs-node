// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
import { CommandBuilder } from "yargs";
import { EventHubClient, EventHubReceiver, EventPosition, EventData } from "../../lib"
export const command = "receive";

export const describe = "Sends messages to an eventhub.";

export const builder: CommandBuilder = {
  p: {
    alias: "partitions",
    describe: "Comma seperated partition IDs.",
    default: "0",
    string: true,
    coerce: ((arg: any) => {
      if (typeof arg === "string")
        return arg.split(",").map((x) => { return x.trim() });
      else
        return arg;
    })
  },
  g: {
    alias: "consumer",
    describe: "Consumer group name",
    default: "$default",
    string: true
  },
  o: {
    alias: "offset",
    describe: "Starting offset",
    default: "-1",
    string: true
  },
  d: {
    alias: "duration",
    describe: "Duration in seconds of the test",
    default: 3600,
    number: true
  }
};

function validateArgs(argv: any) {
  if (!argv) {
    throw new Error(`argv cannot be null or undefined.`);
  }

  if (!argv.connStr && (!argv.key || !argv.keyName || !argv.address)) {
    throw new Error(`Either provide --conn-str OR (--address "sb://{yournamespace}.servicebus.windows.net" --key-name "<shared-access-key-name>" --key "<shared-access-key-value>")`);
  }
}

export async function handler(argv: any): Promise<void> {
  try {
    validateArgs(argv);
    let partitionIds = argv.partitions;
    const consumerGroup = argv.consumer;
    const offset = argv.offset;
    let client: EventHubClient;
    let connectionString = argv.connStr;
    if (!connectionString) {
      let address = argv.address;
      if (!address.endsWith("/")) address += "/";
      if (!address.startsWith("sb://")) address = "sb://" + address;
      connectionString = `Endpoint=${address};SharedAccessKeyName=${argv.keyName};SharedAccessKey=${argv.key}`;
    }
    client = EventHubClient.createFromConnectionString(connectionString, argv.hub);
    if (!partitionIds) {
      partitionIds = await client.getPartitionIds();
    }
    for (let id of partitionIds) {
      let receiver: EventHubReceiver = await client.createReceiver(id, { consumerGroup: consumerGroup, eventPosition: EventPosition.fromOffset(offset, true) });
      console.log(`Created Receiver: "${receiver.name!}" for partition: "${id}" in consumer group: "${consumerGroup}" in event hub "${argv.hub}".`);
      receiver.on("message", (m: EventData) => {
        if (m.body) {
          console.log("[Receiver - %s], %s, Received message:", receiver.name!, m.enqueuedTimeUtc!.toString(), m.body.toString());
        }
      });
      console.log(`Attached message handler for receiver - "${receiver.name!}"`)
    }
  } catch (err) {
    return Promise.reject(err);
  }
}