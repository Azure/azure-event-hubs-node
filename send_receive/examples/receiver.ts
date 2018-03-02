import { EventHubClient } from "../lib/index";

const str = process.env["SB_CONNECTION_STRING"] || "";
const path = process.env["ENTITY_PATH"] || "";


async function main(): Promise<void> {
  const client = EventHubClient.fromConnectionString(str, path);
  const receiver = await client.createReceiver("0");
  receiver.on("message", (eventData) => {
    console.log(eventData);
  });
}

main().catch((err) => {
  console.log("error: ", err);
})