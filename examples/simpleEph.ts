import { EventProcessorHost, EventHubClient } from "../lib";
//import * as uuid from "uuid/v4";
import PartitionContext from "../lib/eph/partitionContext";
import { EventData } from "../lib/eventData";

const connectionString = "EVENTHUB_CONNECTION_STRING";
const entityPath = "EVENTHUB_NAME";
const str = process.env[connectionString] || "";
const path = process.env[entityPath] || "";
const storage = "STORAGE_CONNECTION_STRING";
const storageStr = process.env[storage] || "";
let partitions = {};
//let msgId = uuid();
let ehc = EventHubClient.createFromConnectionString(str, path);
async function main(): Promise<void> {
  try {
    const ids = await ehc.getPartitionIds();
    const sender = await ehc.createSender();
    ids.forEach((id) => {
      partitions[id] = false;
    });
    const host = EventProcessorHost.createFromConnectionString("fromnode", "$default", storageStr, str, path);
    host.on(EventProcessorHost.message, async (ctx: PartitionContext, d: EventData) => {
      try {
        console.log('Rx message from ' + ctx.partitionId + ': ' + JSON.stringify(d));
        if (d.body === "Hello awesome world!!") {
          await ctx.checkpoint();
          const contents = await ctx.lease.getContent();
          console.log('Seen expected message. New lease contents: ' + contents);
          const parsed = JSON.parse(contents);
          console.assert(parsed.offset === d.annotations!['x-opt-offset']);
        }
      } catch (err) {
        console.log(err);
      }
    });
    host.on(EventProcessorHost.opened, (ctx) => {
      partitions[ctx.partitionId] = true;
      let allSet = true;
      for (const p in partitions) {
        if (!partitions.hasOwnProperty(p)) continue;
        if (!partitions[p]) allSet = false;
      }
      if (allSet) {
        sender.send({ body: "Hey there!!" });
      }
    });
    await host.start();
  } catch (err) {
    console.log(err);
  }
}

main().catch((err) => {
  console.log("error: ", err);
});
