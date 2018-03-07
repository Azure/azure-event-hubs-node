import { EventHubClient } from "../lib";

const connectionString = "SB_CONNECTION_STRING";
const entityPath = "ENTITY_PATH";
const str = process.env[connectionString] || "";
const path = process.env[entityPath] || "";


async function main(): Promise<void> {
  const client = EventHubClient.fromConnectionString(str, path);
  const sender = await client.createSender();
  const receiver = await client.createReceiver("0");
  sender.send("Hey Amar!!");
  receiver.on("message", (eventData: any) => {
    console.log(">>> EventDataObject: ", eventData);
    console.log("### Actual message:", eventData.body ? eventData.body.toString() : null);
  });
}

main().catch((err) => {
  console.log("error: ", err);
});
