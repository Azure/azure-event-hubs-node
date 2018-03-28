// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
import { CommandBuilder } from "yargs";
import * as crypto from "crypto";
import { EventHubClient, EventData, EventHubSender } from "../../lib";

export const command = "send";

export const describe = "Sends messages to an eventhub.";

export const builder: CommandBuilder = {
  b: {
    alias: "msg-count",
    describe: "Number of events to send.",
    default: 1,
    number: true
  },
  s: {
    alias: "msg-size",
    describe: "size in bytes for each event",
    default: 256,
    number: true
  }
};

function validateArgs(argv: any): void {
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
    let client: EventHubClient;
    let connectionString = argv.connStr;
    if (!connectionString) {
      let address = argv.address;
      if (!address.endsWith("/")) address += "/";
      if (!address.startsWith("sb://")) address = "sb://" + address;
      connectionString = `Endpoint=${address};SharedAccessKeyName=${argv.keyName};SharedAccessKey=${argv.key}`;
    }
    client = EventHubClient.createFromConnectionString(connectionString, argv.hub);
    const sender: EventHubSender = await client.createSender();
    const msgCount = argv.msgCount;
    const msgSize = argv.msgSize;
    if (msgCount > 1) {
      sender.send({ body: crypto.randomBytes(msgSize) });
    } else {
      let datas: EventData[] = [];
      let count = 0;
      for (let i = 0; i < msgCount; i++) {
        let obj: EventData = { body: crypto.randomBytes(msgSize) };
        datas.push(obj);
        count++;
      }
      sender.sendBatch(datas);
      console.log("Number of Sent messages: ", count);
    }
  } catch (err) {
    return Promise.reject(err);
  }
}
