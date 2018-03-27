"use strict";
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
chai.should();
const lib_1 = require("../lib");
class AMQPError {
    constructor(conditionStr) {
        this.name = "AmqpProtocolError";
        this.name = "AmqpProtocolError";
        this.condition = conditionStr;
    }
}
describe("Errors", function () {
    describe("translate", function () {
        it("acts as a passthrough if the input is not an AmqpProtocolError", function () {
            const MyError = function () { };
            const err = new MyError();
            lib_1.Errors.translate(err).should.equal(err);
        });
        [
            { from: "amqp:not-found", to: "EventHubsCommunicationError" },
            { from: "com.microsoft:argument-out-of-range", to: "ArgumentOutOfRangeError" },
            { from: "<unknown>", to: "Error" }
        ]
            .forEach(function (mapping) {
            it("translates " + mapping.from + " into " + mapping.to, function () {
                const err = new AMQPError(mapping.from);
                const errorClass = lib_1.Errors.translate(err).constructor.name;
                errorClass.should.equal(mapping.to);
            });
        });
    });
});
//# sourceMappingURL=errors.spec.js.map