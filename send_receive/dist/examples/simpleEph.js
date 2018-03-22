"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("../lib");
const uuid = require("uuid/v4");
const connectionString = "SB_CONNECTION_STRING";
const entityPath = "ENTITY_PATH";
const str = process.env[connectionString] || "";
const path = process.env[entityPath] || "";
const storage = "STORAGE_CONNECTION_STRING";
const storageStr = process.env[storage] || "";
let partitions = {};
let msgId = uuid();
let ehc = lib_1.EventHubClient.createFromConnectionString(str, path);
async function main() {
    try {
        const ids = await ehc.getPartitionIds();
        //const sender = await ehc.createSender();
        ids.forEach((id) => {
            partitions[id] = false;
        });
        const host = lib_1.EventProcessorHost.createFromConnectionString("fromnode", "$default", storageStr, str, path);
        host.on(lib_1.EventProcessorHost.message, async (ctx, m) => {
            try {
                console.log('Rx message from ' + ctx.partitionId + ': ' + JSON.stringify(m));
                if (m.body.id === msgId) {
                    await ctx.checkpoint();
                    const contents = await ctx.lease.getContents();
                    console.log('Seen expected message. New lease contents: ' + contents);
                    const parsed = JSON.parse(contents);
                    parsed.offset.should.eql(m.message_annotations['x-opt-offset']);
                }
            }
            catch (err) {
                console.log(err);
            }
        });
        host.on(lib_1.EventProcessorHost.opened, (ctx) => {
            partitions[ctx.partitionId] = true;
            let allSet = true;
            for (const p in partitions) {
                if (!partitions.hasOwnProperty(p))
                    continue;
                if (!partitions[p])
                    allSet = false;
            }
            if (allSet) {
                //sender.send({ body: { id: msgId } });
            }
        });
        await host.start();
    }
    catch (err) {
        console.log(err);
    }
}
main().catch((err) => {
    console.log("error: ", err);
});
//# sourceMappingURL=simpleEph.js.map