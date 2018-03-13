"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("../lib");
const msrestAzure = require("ms-rest-azure");
const endpoint = "ENDPOINT";
const entityPath = "ENTITY_PATH";
const address = process.env[endpoint] || "";
const path = process.env[entityPath] || "";
async function main() {
    const credentials = await msrestAzure.interactiveLogin({ tokenAudience: lib_1.aadEventHubsAudience });
    const client = lib_1.EventHubClient.createFromAadTokenCredentials(address, path, credentials);
    const sender = await client.createSender("0");
    const receiver = await client.createReceiver("0", { enableReceiverRuntimeMetric: true });
    sender.send({ body: "Hello awesome world!!" });
    receiver.on("message", (eventData) => {
        console.log(">>> EventDataObject: ", eventData);
        console.log("### Actual message:", eventData.body ? eventData.body.toString() : null);
    });
    await sender.close();
}
main().catch((err) => {
    console.log("error: ", err);
});
//# sourceMappingURL=sendReceiveWithInteractiveAuth.js.map