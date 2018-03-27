// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import * as chai from "chai";
const should = chai.should();
import * as chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);

import { EventHubReceiver, EventHubSender, EventHubClient, Errors } from "../lib";

function testFalsyValues(testFn) {
  [null, undefined, "", 0].forEach(function (value) {
    testFn(value);
  });
}

describe("EventHubClient", function () {
  describe("#constructor", function () {
    ["endpoint", "entityPath", "sharedAccessKeyName", "sharedAccessKey"].forEach(function (prop) {
      it("throws if config." + prop + " is falsy", function () {
        testFalsyValues(function (falsyVal) {
          const test = function () {
            let config = { endpoint: "a", entityPath: "b", sharedAccessKey: "c", sharedAccessKeyName: "d" };
            config[prop] = falsyVal;
            return new EventHubClient(config as any);
          };
          test.should.throw(Error, `'${prop}' is a required property of the ConnectionConfig.`);
        });
      });
    });
  });

  describe(".fromConnectionString", function () {
    it("throws when there is no connection string", function () {
      testFalsyValues(function (value) {
        const test = function () {
          return EventHubClient.createFromConnectionString(value);
        };
        test.should.throw(Error, "'connectionString' is a required parameter and must be of type: 'string'.");
      });
    });

    it("throws when it cannot find the Event Hub path", function () {
      const test = function () {
        return EventHubClient.createFromConnectionString("abc");
      };
      test.should.throw(Error, `Either provide "path" or the "connectionString": "abc", must contain EntityPath="<path-to-the-entity>".`);
    });

    it("creates an EventHubClient from a connection string", function () {
      const client = EventHubClient.createFromConnectionString("Endpoint=sb://a;SharedAccessKeyName=b;SharedAccessKey=c;EntityPath=d");
      client.should.be.an.instanceof(EventHubClient);
    });

    it("creates an EventHubClient from a connection string and an Event Hub path", function () {
      const client = EventHubClient.createFromConnectionString("Endpoint=sb://a;SharedAccessKeyName=b;SharedAccessKey=c", "path");
      client.should.be.an.instanceof(EventHubClient);
    });
  });
});

function arrayOfIncreasingNumbersFromZero(length) {
  return Array.apply(null, new Array(length)).map((x, i) => { return `${i}`; });
}

before("validate environment", function () {
  should.exist(process.env.EVENTHUB_CONNECTION_STRING,
    "define EVENTHUB_CONNECTION_STRING in your environment before running integration tests.");
  should.exist(process.env.EVENTHUB_NAME,
    "define EVENTHUB_NAME in your environment before running integration tests.");
});

const services = [
  { name: "Event Hubs", connectionString: process.env.EVENTHUB_CONNECTION_STRING, path: process.env.EVENTHUB_NAME }
];

services.forEach(function (service) {
  describe("EventHubClient on " + service.name, function () {
    this.timeout(60000);
    let client: EventHubClient;

    afterEach('close the connection', async function () {
      await client.close();
    });

    describe("#close", function () {
      it("is a no-op when the connection is already closed", function () {
        client = EventHubClient.createFromConnectionString(service.connectionString!, service.path);
        return client.close().should.be.fulfilled;
      });
    });

    describe("getPartitionIds", function () {
      it("returns an array of partition IDs", async function () {
        client = EventHubClient.createFromConnectionString(service.connectionString!, service.path);
        const ids = await client.getPartitionIds();
        ids.should.have.members(arrayOfIncreasingNumbersFromZero(ids.length));
      });

      it("returns MessagingEntityNotFoundError if the server does not recognize the Event Hub path", async function () {
        try {
          client = EventHubClient.createFromConnectionString(service.connectionString!, "bad" + Math.random());
          await client.getPartitionIds();
        } catch (err) {
          should.equal(true, err instanceof Errors.MessagingEntityNotFoundError);
        }
      });
    });

    describe("createSender", function () {
      [0, "0", "1"].forEach(function (partitionId) {
        it("returns a Sender when partitionId is " + partitionId, async function () {
          client = EventHubClient.createFromConnectionString(service.connectionString!, service.path);
          const sender = await client.createSender(partitionId);
          should.equal(true, sender instanceof EventHubSender);
        });
      });
    });

    describe("createReceiver", function () {
      it("returns a Receiver", async function () {
        client = EventHubClient.createFromConnectionString(service.connectionString!, service.path);
        const receiver = await client.createReceiver("0");
        should.equal(true, receiver instanceof EventHubReceiver);
        await receiver.close();
      });
    });
  });
});