import { EventHubClient } from "../lib/index";

const str = process.env["SB_CONNECTION_STRING"] || "";
const path = process.env["ENTITY_PATH"] || "";


async function main(): Promise<void> {
  const client = EventHubClient.createFromConnectionString(str, path);
  let info = await client.getHubRuntimeInformation();
  console.log("RuntimeInfo: ", info);
  await client.close();
}

main().catch((err) => {
  console.log("error: ", err);
});
