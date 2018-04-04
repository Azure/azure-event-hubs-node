// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import * as chai from "chai";
const should = chai.should();
import * as chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);

import { EventHubClient, EventHubSender, EventData, Errors } from "../lib";
describe("EventHub Sender", function () {
  this.timeout(60000);
  const service = { connectionString: process.env.EVENTHUB_CONNECTION_STRING, path: process.env.EVENTHUB_NAME };
  let client: EventHubClient = EventHubClient.createFromConnectionString(service.connectionString!, service.path);
  let sender: EventHubSender;
  before("validate environment", function () {
    should.exist(process.env.EVENTHUB_CONNECTION_STRING,
      "define EVENTHUB_CONNECTION_STRING in your environment before running integration tests.");
    should.exist(process.env.EVENTHUB_NAME,
      "define EVENTHUB_NAME in your environment before running integration tests.");
  });

  after("close the connection", async function () {
    await client.close();
  });

  afterEach("close the sender link", async function () {
    await sender.close();
  });
  describe("Single message", function () {
    it("should be sent successfully.", async function () {
      sender = await client.createSender();
      sender.should.be.instanceof(EventHubSender);
      let data: EventData = {
        body: "Hello World"
      }
      const delivery = await sender.send(data);
      // console.log(delivery);
      delivery.id.should.equal(0);
      delivery.format.should.equal(0);
      delivery.settled.should.equal(true);
      delivery.remote_settled.should.equal(true);
      delivery.tag.toString().should.equal("0");
    });
    it("with partition key should be sent successfully.", async function () {
      sender = await client.createSender();
      sender.should.be.instanceof(EventHubSender);
      let data: EventData = {
        body: "Hello World with partition key"
      }
      const delivery = await sender.send(data, "p1234");
      // console.log(delivery);
      delivery.id.should.equal(0);
      delivery.format.should.equal(0);
      delivery.settled.should.equal(true);
      delivery.remote_settled.should.equal(true);
      delivery.tag.toString().should.equal("0");
    });
    it("should be sent successfully to a specific partition.", async function () {
      sender = await client.createSender("0");
      sender.should.be.instanceof(EventHubSender);
      let data: EventData = {
        body: "Hello World"
      }
      const delivery = await sender.send(data);
      // console.log(delivery);
      delivery.id.should.equal(0);
      delivery.format.should.equal(0);
      delivery.settled.should.equal(true);
      delivery.remote_settled.should.equal(true);
      delivery.tag.toString().should.equal("0");
    });
  });

  describe("Batch message", function () {
    it("should be sent successfully.", async function () {
      sender = await client.createSender();
      sender.should.be.instanceof(EventHubSender);
      let data: EventData[] = [
        {
          body: "Hello World 1"
        },
        {
          body: "Hello World 2"
        }
      ];
      const delivery = await sender.sendBatch(data);
      // console.log(delivery);
      delivery.id.should.equal(0);
      delivery.format.should.equal(0x80013700);
      delivery.settled.should.equal(true);
      delivery.remote_settled.should.equal(true);
      delivery.tag.toString().should.equal("0");
    });
    it("with partition key should be sent successfully.", async function () {
      sender = await client.createSender();
      sender.should.be.instanceof(EventHubSender);
      let data: EventData[] = [
        {
          body: "Hello World 1"
        },
        {
          body: "Hello World 2"
        }
      ];
      const delivery = await sender.sendBatch(data, "p1234");
      // console.log(delivery);
      delivery.id.should.equal(0);
      delivery.format.should.equal(0x80013700);
      delivery.settled.should.equal(true);
      delivery.remote_settled.should.equal(true);
      delivery.tag.toString().should.equal("0");
    });
    it("should be sent successfully to a specific partition.", async function () {
      sender = await client.createSender("0");
      sender.should.be.instanceof(EventHubSender);
      let data: EventData[] = [
        {
          body: "Hello World 1"
        },
        {
          body: "Hello World 2"
        }
      ];
      const delivery = await sender.sendBatch(data);
      // console.log(delivery);
      delivery.id.should.equal(0);
      delivery.format.should.equal(0x80013700);
      delivery.settled.should.equal(true);
      delivery.remote_settled.should.equal(true);
      delivery.tag.toString().should.equal("0");
    });
  });

  describe("Negative scenarios", function () {
    it("should throw 'MessagingEntityNotFoundError' if a message is sent after the sender is closed.", async function () {
      sender = await client.createSender();
      sender.should.be.instanceof(EventHubSender);
      let data: EventData = {
        body: "Hello World"
      }
      await sender.close();
      console.log("closed sender");
      try {
        await sender.send(data);
      } catch (err) {
        should.equal(true, err instanceof Errors.MessagingEntityNotFoundError);
      }
    });

    it("a message greater than 256 KB should fail.", async function () {
      sender = await client.createSender();
      sender.should.be.instanceof(EventHubSender);
      let data: EventData = {
        body: Buffer.from("Z".repeat(300000))
      }
      try {
        await sender.send(data);
      } catch (err) {
        // console.log(err);
        should.equal(true, err instanceof Errors.MessageTooLargeError);
        err.message.should.match(/.*The received message \(delivery-id:0, size:300016 bytes\) exceeds the limit \(262144 bytes\) currently allowed on the link\..*/ig);
      }
    });
  });
});