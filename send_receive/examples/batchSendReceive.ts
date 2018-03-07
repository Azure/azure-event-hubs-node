import { EventHubClient } from "../lib";
import * as rhea from "rhea";

const connectionString = "SB_CONNECTION_STRING";
const entityPath = "ENTITY_PATH";
const str = process.env[connectionString] || "";
const path = process.env[entityPath] || "";


async function main(): Promise<void> {
  const client = EventHubClient.fromConnectionString(str, path);
  console.log("Created EH client from connection string");
  const sender = await client.createSender("0");
  console.log("Created Sender for partition 0.");
  const receiver = await client.createReceiver("0", { startAfterTime: Date.now() });
  console.log("Created Receiver for partition 0 and CG $default.");

  const annotations = {
    'x-opt-partition-key': 'pk1234656'
  }
  const messageCount = 5;
  // encoding the batchMessage with annotations of the first message
  let batchMessageBuffer = rhea.message.encode({ "message_annotations": annotations });
  for (let i = 0; i < messageCount; i++) {
    // For simplicity I am simply considering a message object with body. No annotations, etc.
    let msg: any = { "body": `Hello foo ${i}` };
    if (i === 0) {
      msg = { "body": `Hello foo ${i}`, "message_annotations": annotations };
    }
    // encode the message
    let encodedMessage = rhea.message.encode(msg);
    // wrap it as a data_section of body of another message
    let anothermessage = { "body": rhea.message.data_section(encodedMessage) };
    // encode the wrapped message
    let encodeAnotherMessage = rhea.message.encode(anothermessage);
    console.log(">>>>>>>>>>>>>>>>>>>>");
    console.log("encodeAnotherMessage: ", encodeAnotherMessage.toString())
    // concat or append it to the encoded batch message (buffer)
    batchMessageBuffer = Buffer.concat([batchMessageBuffer, encodeAnotherMessage]);
  }

  console.log("$$$$$$$$$$$$$$$$$$$");
  console.log("batchMessageBuffer: ", batchMessageBuffer.toString())
  // the final batch message
  const batchmessage = {
    body: batchMessageBuffer,
    message_format: 0x80013700
  };

  sender.send(batchmessage);
  console.log('sent message');

  console.log("message sent");
  receiver.on("message", (eventData: any) => {
    console.log(">>> EventDataObject: ", eventData);
    console.log("### Actual message:", eventData.body ? eventData.body.toString() : null);
  });
}

main().catch((err) => {
  console.log("error: ", err);
});
