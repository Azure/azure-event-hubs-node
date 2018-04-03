"use strict";
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const should = chai.should();
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const lib_1 = require("../lib");
describe("RuntimeInformation", function () {
    this.timeout(60000);
    let client;
    const service = { connectionString: process.env.EVENTHUB_CONNECTION_STRING, path: process.env.EVENTHUB_NAME };
    before("validate environment", function () {
        should.exist(process.env.EVENTHUB_CONNECTION_STRING, "define EVENTHUB_CONNECTION_STRING in your environment before running integration tests.");
        should.exist(process.env.EVENTHUB_NAME, "define EVENTHUB_NAME in your environment before running integration tests.");
    });
    afterEach('close the connection', async function () {
        await client.close();
    });
    function arrayOfIncreasingNumbersFromZero(length) {
        return Array.apply(null, new Array(length)).map((x, i) => { return `${i}`; });
    }
    it("gets the hub runtime information", async function () {
        client = lib_1.EventHubClient.createFromConnectionString(service.connectionString, service.path);
        const hubRuntimeInfo = await client.getHubRuntimeInformation();
        console.log(hubRuntimeInfo);
        hubRuntimeInfo.path.should.equal(service.path);
        hubRuntimeInfo.type.should.equal("com.microsoft:eventhub");
        hubRuntimeInfo.partitionIds.should.have.members(arrayOfIncreasingNumbersFromZero(hubRuntimeInfo.partitionIds.length));
        hubRuntimeInfo.partitionCount.should.equal(hubRuntimeInfo.partitionIds.length);
        hubRuntimeInfo.createdAt.should.be.instanceof(Date);
    });
    it("gets the partition runtime information", async function () {
        client = lib_1.EventHubClient.createFromConnectionString(service.connectionString, service.path);
        const partitionRuntimeInfo = await client.getPartitionInformation("0");
        console.log(partitionRuntimeInfo);
        partitionRuntimeInfo.partitionId.should.equal("0");
        partitionRuntimeInfo.type.should.equal("com.microsoft:partition");
        partitionRuntimeInfo.hubPath.should.equal(service.path);
        partitionRuntimeInfo.lastEnqueuedTimeUtc.should.be.instanceof(Date);
        should.exist(partitionRuntimeInfo.lastSequenceNumber);
        should.exist(partitionRuntimeInfo.lastEnqueuedOffset);
    });
});
//# sourceMappingURL=hubruntime.spec.js.map