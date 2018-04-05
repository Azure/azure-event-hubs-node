// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import * as chai from "chai";
import * as uuid from "uuid/v4";
const should = chai.should();
import * as chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);

import { EventPosition, EventHubClient, EventHubReceiver, EventData, Errors, EventHubRuntimeInformation, EventHubSender } from "../lib";

describe("EventHub Receiver", function () {
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

  describe("with EventPosition specified as", function () {
    it("'from end of stream' should receive messages correctly", async function () {
      const partitionId = hubInfo.partitionIds[0];
      sender = await client.createSender(partitionId);
      for (let i = 0; i < 10; i++) {
        const ed: EventData = {
          body: "Hello awesome world " + i
        }
        await sender.send(ed);
        console.log("sent message - " + i);
      }
      // console.log("Creating new receiver with offset EndOfStream");
      receiver = await client.createReceiver(partitionId, { eventPosition: EventPosition.fromEnd() });
      // send a new message. We should only receive this new message.
      const uid = uuid();
      const ed: EventData = {
        body: "New message",
        applicationProperties: {
          stamp: uid
        }
      }
      await sender.send(ed);
      // console.log(">>>>>>> Sent the new message after creating the receiver. We should only receive this message.");
      const datas = await receiver.receive(10, 5);
      // console.log("received messages: ", datas);
      datas.length.should.equal(1);
      datas[0].applicationProperties!.stamp.should.equal(uid);
      // console.log("Next receive on this partition should not receive any messages.");
      const datas2 = await receiver.receive(10, 10);
      datas2.length.should.equal(0);
    });

    it("'after a particular offset' should receive messages correctly", async function () {
      const partitionId = hubInfo.partitionIds[0];
      const pInfo = await client.getPartitionInformation(partitionId);
      sender = await client.createSender(partitionId);
      // console.log(`Creating new receiver with last enqueued offset: "${pInfo.lastEnqueuedOffset}".`);
      receiver = await client.createReceiver(partitionId, { eventPosition: EventPosition.fromOffset(pInfo.lastEnqueuedOffset) });
      // send a new message. We should only receive this new message.
      const uid = uuid();
      const ed: EventData = {
        body: "New message after last enqueued offset",
        applicationProperties: {
          stamp: uid
        }
      }
      await sender.send(ed);
      // console.log("Sent the new message after creating the receiver. We should only receive this message.");
      const datas = await receiver.receive(10, 5);
      // console.log("received messages: ", datas);
      datas.length.should.equal(1);
      datas[0].applicationProperties!.stamp.should.equal(uid);
      // console.log("Next receive on this partition should not receive any messages.");
      const datas2 = await receiver.receive(10, 10);
      datas2.length.should.equal(0);
    });

    it("'after a particular offset with isInclusive true' should receive messages correctly", async function () {
      const partitionId = hubInfo.partitionIds[0];
      sender = await client.createSender(partitionId);
      const uid = uuid();
      const ed: EventData = {
        body: "New message after last enqueued offset",
        applicationProperties: {
          stamp: uid
        }
      }
      await sender.send(ed);
      // console.log(`Sent message 1 with stamp: ${uid}.`);
      const pInfo = await client.getPartitionInformation(partitionId);
      const uid2 = uuid();
      const ed2: EventData = {
        body: "New message after last enqueued offset",
        applicationProperties: {
          stamp: uid2
        }
      }
      await sender.send(ed2);
      // console.log(`Sent message 2 with stamp: ${uid} after getting the enqueued offset.`);
      // console.log(`Creating new receiver with last enqueued offset: "${pInfo.lastEnqueuedOffset}".`);
      receiver = await client.createReceiver(partitionId, { eventPosition: EventPosition.fromOffset(pInfo.lastEnqueuedOffset, true) });
      // console.log("We should receive the last 2 messages.");
      const datas = await receiver.receive(10, 5);
      // console.log("received messages: ", datas);
      datas.length.should.equal(2);
      datas[0].applicationProperties!.stamp.should.equal(uid);
      datas[1].applicationProperties!.stamp.should.equal(uid2);
      // console.log("Next receive on this partition should not receive any messages.");
      const datas2 = await receiver.receive(10, 10);
      datas2.length.should.equal(0);
    });

    it("'from a particular enqueued time' should receive messages correctly", async function () {
      const partitionId = hubInfo.partitionIds[0];
      const pInfo = await client.getPartitionInformation(partitionId);
      sender = await client.createSender(partitionId);
      // console.log(`Creating new receiver with last enqueued time: "${pInfo.lastEnqueuedTimeUtc}".`);
      receiver = await client.createReceiver(partitionId, { eventPosition: EventPosition.fromEnqueuedTime(pInfo.lastEnqueuedTimeUtc) });
      // send a new message. We should only receive this new message.
      const uid = uuid();
      const ed: EventData = {
        body: "New message after last enqueued time " + pInfo.lastEnqueuedTimeUtc,
        applicationProperties: {
          stamp: uid
        }
      }
      await sender.send(ed);
      // console.log("Sent the new message after creating the receiver. We should only receive this message.");
      const datas = await receiver.receive(10, 5);
      // console.log("received messages: ", datas);
      datas.length.should.equal(1);
      datas[0].applicationProperties!.stamp.should.equal(uid);
      // console.log("Next receive on this partition should not receive any messages.");
      const datas2 = await receiver.receive(10, 15);
      datas2.length.should.equal(0);
    });

    it("'after the particular sequence number' should receive messages correctly", async function () {
      const partitionId = hubInfo.partitionIds[0];
      const pInfo = await client.getPartitionInformation(partitionId);
      sender = await client.createSender(partitionId);
      // send a new message. We should only receive this new message.
      const uid = uuid();
      const ed: EventData = {
        body: "New message after last enqueued sequence number " + pInfo.lastSequenceNumber,
        applicationProperties: {
          stamp: uid
        }
      }
      await sender.send(ed);
      // console.log("Sent the new message after creating the receiver. We should only receive this message.");
      // console.log(`Creating new receiver with last enqueued sequence number: "${pInfo.lastSequenceNumber}".`);
      receiver = await client.createReceiver(partitionId, { eventPosition: EventPosition.fromSequenceNumber(pInfo.lastSequenceNumber) });
      const datas = await receiver.receive(10, 10);
      // console.log("received messages: ", datas);
      datas.length.should.equal(1);
      datas[0].applicationProperties!.stamp.should.equal(uid);
      // console.log("Next receive on this partition should not receive any messages.");
      const datas2 = await receiver.receive(10, 10);
      datas2.length.should.equal(0);
    });

    it("'after the particular sequence number' with isInclusive true should receive messages correctly", async function () {
      const partitionId = hubInfo.partitionIds[0];
      sender = await client.createSender(partitionId);
      const uid = uuid();
      const ed: EventData = {
        body: "New message before getting the last sequence number",
        applicationProperties: {
          stamp: uid
        }
      }
      await sender.send(ed);
      // console.log(`Sent message 1 with stamp: ${uid}.`);
      const pInfo = await client.getPartitionInformation(partitionId);
      const uid2 = uuid();
      const ed2: EventData = {
        body: "New message after the last enqueued offset",
        applicationProperties: {
          stamp: uid2
        }
      }
      await sender.send(ed2);
      // console.log(`Sent message 2 with stamp: ${uid}.`);
      // console.log(`Creating new receiver with last sequence number: "${pInfo.lastSequenceNumber}".`);
      receiver = await client.createReceiver(partitionId, { eventPosition: EventPosition.fromSequenceNumber(pInfo.lastSequenceNumber, true) });
      // console.log("We should receive the last 2 messages.");
      const datas = await receiver.receive(10, 10);
      // console.log("received messages: ", datas);
      datas.length.should.equal(2);
      datas[0].applicationProperties!.stamp.should.equal(uid);
      datas[1].applicationProperties!.stamp.should.equal(uid2);
      // console.log("Next receive on this partition should not receive any messages.");
      const datas2 = await receiver.receive(10, 10);
      datas2.length.should.equal(0);
    });
  });

  describe("in batch mode", function () {
    it("should receive messages correctly", async function () {
      const partitionId = hubInfo.partitionIds[0];
      receiver = await client.createReceiver(partitionId);
      const datas = await receiver.receive(5, 10);
      // console.log("received messages: ", datas);
      datas.length.should.equal(5);
    });
  });

  describe("with receiverRuntimeMetricEnabled", function () {
    it("should have ReceiverRuntimeInfo populated", async function () {
      const partitionId = hubInfo.partitionIds[0];
      sender = await client.createSender(partitionId);
      for (let i = 0; i < 10; i++) {
        const ed: EventData = {
          body: "Hello awesome world " + i
        }
        await sender.send(ed);
        // console.log("sent message - " + i);
      }
      // console.log("Getting the partition information");
      const pInfo = await client.getPartitionInformation(partitionId);
      // console.log("paritition info: ", pInfo);
      // console.log("Creating new receiver with offset EndOfStream");
      receiver = await client.createReceiver(partitionId, { eventPosition: EventPosition.fromStart(), enableReceiverRuntimeMetric: true });
      let datas = await receiver.receive(1, 10);
      // console.log("receiver.runtimeInfo ", receiver.runtimeInfo);
      datas.length.should.equal(1);
      should.exist(receiver.runtimeInfo);
      receiver.runtimeInfo!.lastEnqueuedOffset!.should.equal(pInfo.lastEnqueuedOffset);
      receiver.runtimeInfo!.lastSequenceNumber!.should.equal(pInfo.lastSequenceNumber);
      receiver.runtimeInfo!.lastEnqueuedTimeUtc!.getTime().should.equal(pInfo.lastEnqueuedTimeUtc.getTime());
      receiver.runtimeInfo!.paritionId!.should.equal(pInfo.partitionId);
      receiver.runtimeInfo!.retrievalTime!.getTime().should.be.greaterThan(Date.now() - 60000);
    });
  });

  describe("with epoch", function () {
    it("should behave correctly when 2 epoch receivers with different values are connecting to a partition in a consumer group", async function () {
      const partitionId = hubInfo.partitionIds[0];
      try {
        let events: EventData[] = [];
        const epochRcvr1 = await client.createReceiver(partitionId, { epoch: 1, eventPosition: EventPosition.fromEnd() });
        console.log("Created epoch receiver 1 %s", epochRcvr1.name);
        events = await epochRcvr1.receive(20, 10);
        console.log("Received events from epoch receiver 1 %s - %o", epochRcvr1.name, events.length);
        const epochRcvr2 = await client.createReceiver(partitionId, { epoch: 2, eventPosition: EventPosition.fromEnd() });
        console.log("Created epoch receiver 2 %s", epochRcvr2.name);
        events = await epochRcvr2.receive(20, 10);
        console.log(">>>> Received events from epoch receiver 1 %s - %o", epochRcvr2.name, events.length);
      } catch (err) {
        console.log(err);
      }
    });

    it("should behave correctly when a non epoch receiver is created after an epoch receiver", async function () {
      const partitionId = hubInfo.partitionIds[0];
      try {
        let events: EventData[] = [];
        const epochRcvr = await client.createReceiver(partitionId, { epoch: 1, eventPosition: EventPosition.fromEnd() });
        console.log("Created epoch receiver 1 %s", epochRcvr.name);
        events = await epochRcvr.receive(20, 10);
        console.log("Received events from epoch receiver 1 %s - %o", epochRcvr.name, events.length);
        const nonEpochRcvr = await client.createReceiver(partitionId, { eventPosition: EventPosition.fromEnd() });
        console.log("Created epoch receiver 2 %s", nonEpochRcvr.name);
        events = await nonEpochRcvr.receive(20, 10);
        console.log(">>>> Received events from non epoch receiver 2 %s - %o", epochRcvr.name, events.length);
      } catch (err) {
        console.log(err);
      }
    });

    it("should behave correctly when an epoch receiver is created after a non epoch receiver", async function () {
      const partitionId = hubInfo.partitionIds[0];
      try {
        let events: EventData[] = [];
        const nonEpochRcvr = await client.createReceiver(partitionId, { eventPosition: EventPosition.fromEnd() });
        console.log("Created epoch receiver 2 %s", nonEpochRcvr.name);
        const epochRcvr = await client.createReceiver(partitionId, { epoch: 1, eventPosition: EventPosition.fromEnd() });
        console.log("Created epoch receiver 1 %s", epochRcvr.name);
        events = await nonEpochRcvr.receive(20, 10);
        console.log(">>>> Received events from non epoch receiver %s - %o", nonEpochRcvr.name, events.length);
        events = await epochRcvr.receive(20, 10);
        console.log("Received events from epoch receiver 1 %s - %o", epochRcvr.name, events.length);
      } catch (err) {
        console.log(err);
      }
    });
  });

  describe("Negative scenarios", function () {
    it("should throw 'MessagingEntityNotFoundError' if a message is sent after the sender is closed", async function () {
      receiver = await client.createReceiver("0");
      receiver.should.be.instanceof(EventHubReceiver);
      await receiver.close();
      console.log("closed receiver.");
      try {
        await receiver.receive(10, 3);
      } catch (err) {
        should.equal(true, err instanceof Errors.MessagingEntityNotFoundError);
      }
    });

    it.skip("should receive 'QuotaExceededError' when attempting to connect more than 5 receivers to a partition in a consumer group", async function () {
      const partitionId = hubInfo.partitionIds[0];
      try {
        const rcvrs = await Promise.all([
          client.createReceiver(partitionId, { eventPosition: EventPosition.fromStart(), identifier: "rcvr-1" }),
          client.createReceiver(partitionId, { eventPosition: EventPosition.fromStart(), identifier: "rcvr-2" }),
          client.createReceiver(partitionId, { eventPosition: EventPosition.fromStart(), identifier: "rcvr-3" }),
          client.createReceiver(partitionId, { eventPosition: EventPosition.fromStart(), identifier: "rcvr-4" }),
          client.createReceiver(partitionId, { eventPosition: EventPosition.fromStart(), identifier: "rcvr-5" })
        ]);
        console.log(">>> Receivers length: ", rcvrs.length);
        for (const rcvr of rcvrs) {
          console.log("[%s], %s", rcvr.identifier, rcvr.name);
          rcvr.on("message", (data) => {
            //console.log("receiver %s, %o", rcvr.identifier!, data);
          });
          rcvr.on("receiver_error", (context) => {
            console.log("@@@@ Error received by receiver %s", rcvr.identifier!);
            console.log(context);
          });
        }
        console.log(">>> Attached message handlers to each receiver.")
        try {
          const failedRcvr = await client.createReceiver(partitionId, { eventPosition: EventPosition.fromStart(), identifier: "rcvr-6" });
          console.log(`Created 6th receiver - ${failedRcvr.name}`);
          failedRcvr.on("message", (data) => {
            //console.log(data);
          });
          failedRcvr.on("receiver_error", (context) => {
            console.log("@@@@ Error received by receiver %s", failedRcvr.identifier!);
            console.log(context);
          });
          rcvrs.push(failedRcvr);
        } catch (err) {
          console.log("### Receivers length: ", rcvrs.length);
          console.log(err);
        }
      } catch (err) {
        console.log("uber catch");
        console.log(err);
      }
    });
  });
});