import { EventHubClient } from "../lib";

const connectionString = "SB_CONNECTION_STRING";
const entityPath = "ENTITY_PATH";
const str = process.env[connectionString] || "";
const path = process.env[entityPath] || "";


async function main(): Promise<void> {
  const client = EventHubClient.createFromConnectionString(str, path);
  const sender = await client.createSender("0");
  const receiver = await client.createReceiver("0");
  sender.send({ body: "Hello awesome world!!" });
  receiver.on("message", (eventData: any) => {
    console.log(">>> EventDataObject: ", eventData);
    console.log("### Actual message:", eventData.body ? eventData.body.toString() : null);
  });
  await sender.close();
}

main().catch((err) => {
  console.log("error: ", err);
});
