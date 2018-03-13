import { EventHubClient, aadEventHubsAudience } from "../lib";
import * as msrestAzure from "ms-rest-azure";

const endpoint = "ENDPOINT";
const entityPath = "ENTITY_PATH";
const address = process.env[endpoint] || "";
const path = process.env[entityPath] || "";

async function main(): Promise<void> {
  const credentials = await msrestAzure.interactiveLogin({ tokenAudience: aadEventHubsAudience });
  const client = EventHubClient.createFromAadTokenCredentials(address, path, credentials);
  const sender = await client.createSender("0");
  const receiver = await client.createReceiver("0", { enableReceiverRuntimeMetric: true });
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
