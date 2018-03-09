"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("../lib");
const connectionString = "SB_CONNECTION_STRING";
const entityPath = "ENTITY_PATH";
const str = process.env[connectionString] || "";
const path = process.env[entityPath] || "";
async function main() {
    const client = lib_1.EventHubClient.fromConnectionString(str, path);
    const sender = await client.createSender("0");
    const receiver = await client.createReceiver("0");
    sender.send({ body: "Hello awesome world!!" });
    receiver.on("message", (eventData) => {
        console.log(">>> EventDataObject: ", eventData);
        console.log("### Actual message:", eventData.body ? eventData.body.toString() : null);
    });
}
main().catch((err) => {
    console.log("error: ", err);
});
//# sourceMappingURL=simpleSendRecieve.js.map