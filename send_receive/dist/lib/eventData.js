"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.
Object.defineProperty(exports, "__esModule", { value: true });
const Constants = require("./util/constants");
var EventData;
(function (EventData) {
    function fromAmqpMessage(msg) {
        // TODO: Look at how other sdks are encoding their payloads and copy them. This will ensure consistency across all the sdks.
        let data = {
            body: msg.body,
        };
        if (msg.message_annotations) {
            data.annotations = msg.message_annotations;
            data.partitionKey = msg.message_annotations[Constants.partitionKey];
            data.sequenceNumber = msg.message_annotations[Constants.sequenceNumber];
            data.enqueuedTimeUtc = msg.message_annotations[Constants.enqueuedTime];
            data.offset = msg.message_annotations[Constants.offset];
        }
        if (msg.properties) {
            data.properties = msg.properties;
        }
        if (msg.application_properties) {
            data.applicationProperties = msg.application_properties;
        }
        return data;
    }
    EventData.fromAmqpMessage = fromAmqpMessage;
    function toAmqpMessage(data) {
        let msg = {
            body: data.body
        };
        if (data.annotations) {
            msg.message_annotations = data.annotations;
        }
        if (data.properties) {
            msg.properties = data.properties;
        }
        if (data.applicationProperties) {
            msg.application_properties = data.applicationProperties;
        }
        if (data.partitionKey) {
            if (!msg.message_annotations)
                msg.message_annotations = {};
            msg.message_annotations[Constants.partitionKey] = data.partitionKey;
        }
        if (data.sequenceNumber) {
            if (!msg.message_annotations)
                msg.message_annotations = {};
            msg.message_annotations[Constants.sequenceNumber] = data.sequenceNumber;
        }
        if (data.enqueuedTimeUtc) {
            if (!msg.message_annotations)
                msg.message_annotations = {};
            msg.message_annotations[Constants.enqueuedTime] = data.enqueuedTimeUtc;
        }
        if (data.offset) {
            if (!msg.message_annotations)
                msg.message_annotations = {};
            msg.message_annotations[Constants.offset] = data.offset;
        }
        return msg;
    }
    EventData.toAmqpMessage = toAmqpMessage;
})(EventData = exports.EventData || (exports.EventData = {}));
//# sourceMappingURL=eventData.js.map