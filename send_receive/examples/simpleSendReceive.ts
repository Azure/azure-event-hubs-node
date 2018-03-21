import { EventHubClient } from "../lib";

const connectionString = "SB_CONNECTION_STRING";
const entityPath = "ENTITY_PATH";
const str = process.env[connectionString] || "";
const path = process.env[entityPath] || "";

async function main(): Promise<void> {
  const client = EventHubClient.createFromConnectionString(str, path);
  // const sender = await client.createSender("0");
  const ids = await client.getPartitionIds();
  ids.forEach(async (id) => {
    const receiver = await client.createReceiver(id, { filter: { startAfterTime: Date.now() } });
    // sender.send({ body: "Hello awesome world!!" + new Date().toString() });
    receiver.on("message", async (eventData: any) => {
      console.log(">>> EventDataObject: ", eventData);
      console.log("### Actual message:", eventData.body ? eventData.body.toString() : null);
      await receiver.close();
      await client.close();
    });
  });
  // await sender.close();
}

main().catch((err) => {
  console.log("error: ", err);
});
