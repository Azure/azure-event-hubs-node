"use strict";
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("../lib");
const chai = require("chai");
chai.should();
describe("ConnectionConfig", function () {
    it("populates config properties from an Event Hubs connection string", function () {
        const config = lib_1.ConnectionConfig.create("Endpoint=sb://hostname.servicebus.windows.net/;SharedAccessKeyName=sakName;SharedAccessKey=sak;EntityPath=ep");
        config.should.have.property("host").that.equals("hostname.servicebus.windows.net");
        config.should.have.property("sharedAccessKeyName").that.equals("sakName");
        config.should.have.property("sharedAccessKey").that.equals("sak");
        config.should.have.property("entityPath").that.equals("ep");
    });
    it("populates path from the path argument if connection string does not have EntityPath", function () {
        const config = lib_1.ConnectionConfig.create("Endpoint=sb://hostname.servicebus.windows.net/;SharedAccessKeyName=sakName;SharedAccessKey=sak", "abc");
        config.should.have.property("entityPath").that.equals("abc");
    });
});
//# sourceMappingURL=config.spec.js.map