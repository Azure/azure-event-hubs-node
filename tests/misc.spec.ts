// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import * as chai from "chai";
const should = chai.should();
import * as chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);

import { EventPosition, EventHubClient, EventHubReceiver, EventData, EventHubRuntimeInformation, EventHubSender } from "../lib";

describe("Misc tests", function () {
  this.timeout(600000);
  const service = { connectionString: process.env.EVENTHUB_CONNECTION_STRING, path: process.env.EVENTHUB_NAME };
  let client: EventHubClient = EventHubClient.createFromConnectionString(service.connectionString!, service.path);
  let receiver: EventHubReceiver;
  let sender: EventHubSender;
  let hubInfo: EventHubRuntimeInformation;
  before("validate environment", async function () {
    should.exist(process.env.EVENTHUB_CONNECTION_STRING,
      "define EVENTHUB_CONNECTION_STRING in your environment before running integration tests.");
    should.exist(process.env.EVENTHUB_NAME,
      "define EVENTHUB_NAME in your environment before running integration tests.");
    hubInfo = await client.getHubRuntimeInformation();
  });

  after("close the connection", async function () {
    await client.close();
  });

  afterEach("close the sender link", async function () {
    if (sender) {
      await sender.close();
      // console.log("Sender closed.");
    }
    if (receiver) {
      await receiver.close();
      // console.log("Receiver closed.");
    }
  });

  it("should be able to send an receive a large message", async function () {
    const bodysize = 220 * 1024;
    const partitionId = hubInfo.partitionIds[0];
    const msgString = "A".repeat(220 * 1024);
    const msgBody = Buffer.from(msgString);
    const obj: EventData = { body: msgBody };
    console.log("Sending one message with %d bytes.", bodysize);
    receiver = await client.createReceiver(partitionId, { eventPosition: EventPosition.fromEnqueuedTime(Date.now()) });
    sender = await client.createSender(partitionId);
    await sender.send(obj);
    // console.log("Successfully sent the large message.");
    let datas = await receiver.receive(10, 5);
    // console.log("received message: ", datas);
    should.exist(datas);
    datas.length.should.equal(1);
    datas[0].body.toString().should.equal(msgString)
  });

  it("should consistently send messages with partitionkey to a partition", async function () {
    const msgToSendCount = 50;
    let partitionOffsets = {};
    console.log("Discovering end of stream on each partition.");
    const partitionIds = hubInfo.partitionIds;
    for (let id of partitionIds) {
      const pInfo = await client.getPartitionInformation(id);
      partitionOffsets[id] = pInfo.lastEnqueuedOffset;
      console.log(`Partition ${id} has last message with offset ${pInfo.lastEnqueuedOffset}.`);
    }
    console.log("Sending %d messages.", msgToSendCount);
    function getRandomInt(max) {
      return Math.floor(Math.random() * Math.floor(max));
    }
    sender = await client.createSender();
    for (let i = 0; i < msgToSendCount; i++) {
      const partitionKey = getRandomInt(10);
      await sender.send({ body: "Hello EventHub " + i }, partitionKey.toString());
    }
    console.log("Starting to receive all messages from each partition.");
    let partitionMap = {};
    let totalReceived = 0;
    for (let id of partitionIds) {
      receiver = await client.createReceiver(id, { eventPosition: EventPosition.fromOffset(partitionOffsets[id]) });
      let datas = await receiver.receive(50, 10);
      console.log(`Received ${datas.length} messages from partition ${id}.`);
      for (let d of datas) {
        console.log(">>>> _raw_amqp_mesage: ", d._raw_amqp_mesage)
        const pk = d.partitionKey as string;
        console.log("pk: ", pk);
        if (partitionMap[pk] && partitionMap[pk] !== id) {
          console.log(`#### Error: Received a message from partition ${id} with partition key ${pk}, whereas the same key was observed on partition ${partitionMap[pk]} before.`);
        }
        partitionMap[pk] = id;
        console.log("partitionMap ", partitionMap);
      }
      totalReceived += datas.length;
    }
    totalReceived.should.equal(msgToSendCount);
  });
});
