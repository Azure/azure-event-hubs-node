"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.
Object.defineProperty(exports, "__esModule", { value: true });
const rhea = require("rhea");
const debugModule = require("debug");
const debug = debugModule("rhea-promise");
async function connect(options) {
    return new Promise((resolve, reject) => {
        const connection = rhea.connect(options);
        function onOpen(context) {
            connection.removeListener('connection_open', onOpen);
            connection.removeListener('connection_close', onClose);
            connection.removeListener('disconnected', onClose);
            debug("Resolving the promise with amqp connection.");
            resolve(connection);
        }
        function onClose(err) {
            connection.removeListener('connection_open', onOpen);
            connection.removeListener('connection_close', onClose);
            connection.removeListener('disconnected', onClose);
            debug(`Error occurred while establishing amqp connection.`, err.connection.error);
            reject(err);
        }
        connection.once('connection_open', onOpen);
        connection.once('connection_close', onClose);
        connection.once('disconnected', onClose);
    });
}
exports.connect = connect;
async function createSession(connection) {
    return new Promise((resolve, reject) => {
        const session = connection.create_session();
        function onOpen(context) {
            session.removeListener('session_open', onOpen);
            session.removeListener('session_close', onClose);
            debug("Resolving the promise with amqp session.");
            resolve(session);
        }
        function onClose(err) {
            session.removeListener('session_open', onOpen);
            session.removeListener('session_close', onClose);
            debug(`Error occurred while establishing a session over amqp connection.`, err.session.error);
            reject(err);
        }
        session.once('session_open', onOpen);
        session.once('session_close', onClose);
        debug("Calling amqp session.begin().");
        session.begin();
    });
}
exports.createSession = createSession;
async function createSender(session, options) {
    return new Promise((resolve, reject) => {
        const sender = session.attach_sender(options);
        function onOpen(context) {
            sender.removeListener('sendable', onOpen);
            sender.removeListener('sender_close', onClose);
            debug(`Resolving the promise with amqp sender "${sender.name}".`);
            resolve(sender);
        }
        function onClose(err) {
            sender.removeListener('sendable', onOpen);
            sender.removeListener('sender_close', onClose);
            debug(`Error occurred while creating a sender over amqp connection.`, err.sender.error);
            reject(err);
        }
        sender.once('sendable', onOpen);
        sender.once('sender_close', onClose);
    });
}
exports.createSender = createSender;
async function createReceiver(session, options) {
    return new Promise((resolve, reject) => {
        const receiver = session.attach_receiver(options);
        function onOpen(context) {
            receiver.removeListener('receiver_open', onOpen);
            receiver.removeListener('receiver_close', onClose);
            debug(`Resolving the promise with amqp receiver "${receiver.name}".`);
            resolve(receiver);
        }
        function onClose(err) {
            receiver.removeListener('receiver_open', onOpen);
            receiver.removeListener('receiver_close', onClose);
            debug(`Error occurred while creating a receiver over amqp connection.`, err.receiver.error);
            reject(err);
        }
        receiver.once('receiver_open', onOpen);
        receiver.once('receiver_close', onClose);
    });
}
exports.createReceiver = createReceiver;
var AmqpResponseStatusCode;
(function (AmqpResponseStatusCode) {
    AmqpResponseStatusCode[AmqpResponseStatusCode["Continue"] = 100] = "Continue";
    AmqpResponseStatusCode[AmqpResponseStatusCode["SwitchingProtocols"] = 101] = "SwitchingProtocols";
    AmqpResponseStatusCode[AmqpResponseStatusCode["OK"] = 200] = "OK";
    AmqpResponseStatusCode[AmqpResponseStatusCode["Created"] = 201] = "Created";
    AmqpResponseStatusCode[AmqpResponseStatusCode["Accepted"] = 202] = "Accepted";
    AmqpResponseStatusCode[AmqpResponseStatusCode["NonAuthoritativeInformation"] = 203] = "NonAuthoritativeInformation";
    AmqpResponseStatusCode[AmqpResponseStatusCode["NoContent"] = 204] = "NoContent";
    AmqpResponseStatusCode[AmqpResponseStatusCode["ResetContent"] = 205] = "ResetContent";
    AmqpResponseStatusCode[AmqpResponseStatusCode["PartialContent"] = 206] = "PartialContent";
    AmqpResponseStatusCode[AmqpResponseStatusCode["Ambiguous"] = 300] = "Ambiguous";
    AmqpResponseStatusCode[AmqpResponseStatusCode["MultipleChoices"] = 300] = "MultipleChoices";
    AmqpResponseStatusCode[AmqpResponseStatusCode["Moved"] = 301] = "Moved";
    AmqpResponseStatusCode[AmqpResponseStatusCode["MovedPermanently"] = 301] = "MovedPermanently";
    AmqpResponseStatusCode[AmqpResponseStatusCode["Found"] = 302] = "Found";
    AmqpResponseStatusCode[AmqpResponseStatusCode["Redirect"] = 302] = "Redirect";
    AmqpResponseStatusCode[AmqpResponseStatusCode["RedirectMethod"] = 303] = "RedirectMethod";
    AmqpResponseStatusCode[AmqpResponseStatusCode["SeeOther"] = 303] = "SeeOther";
    AmqpResponseStatusCode[AmqpResponseStatusCode["NotModified"] = 304] = "NotModified";
    AmqpResponseStatusCode[AmqpResponseStatusCode["UseProxy"] = 305] = "UseProxy";
    AmqpResponseStatusCode[AmqpResponseStatusCode["Unused"] = 306] = "Unused";
    AmqpResponseStatusCode[AmqpResponseStatusCode["RedirectKeepVerb"] = 307] = "RedirectKeepVerb";
    AmqpResponseStatusCode[AmqpResponseStatusCode["TemporaryRedirect"] = 307] = "TemporaryRedirect";
    AmqpResponseStatusCode[AmqpResponseStatusCode["BadRequest"] = 400] = "BadRequest";
    AmqpResponseStatusCode[AmqpResponseStatusCode["Unauthorized"] = 401] = "Unauthorized";
    AmqpResponseStatusCode[AmqpResponseStatusCode["PaymentRequired"] = 402] = "PaymentRequired";
    AmqpResponseStatusCode[AmqpResponseStatusCode["Forbidden"] = 403] = "Forbidden";
    AmqpResponseStatusCode[AmqpResponseStatusCode["NotFound"] = 404] = "NotFound";
    AmqpResponseStatusCode[AmqpResponseStatusCode["MethodNotAllowed"] = 405] = "MethodNotAllowed";
    AmqpResponseStatusCode[AmqpResponseStatusCode["NotAcceptable"] = 406] = "NotAcceptable";
    AmqpResponseStatusCode[AmqpResponseStatusCode["ProxyAuthenticationRequired"] = 407] = "ProxyAuthenticationRequired";
    AmqpResponseStatusCode[AmqpResponseStatusCode["RequestTimeout"] = 408] = "RequestTimeout";
    AmqpResponseStatusCode[AmqpResponseStatusCode["Conflict"] = 409] = "Conflict";
    AmqpResponseStatusCode[AmqpResponseStatusCode["Gone"] = 410] = "Gone";
    AmqpResponseStatusCode[AmqpResponseStatusCode["LengthRequired"] = 411] = "LengthRequired";
    AmqpResponseStatusCode[AmqpResponseStatusCode["PreconditionFailed"] = 412] = "PreconditionFailed";
    AmqpResponseStatusCode[AmqpResponseStatusCode["RequestEntityTooLarge"] = 413] = "RequestEntityTooLarge";
    AmqpResponseStatusCode[AmqpResponseStatusCode["RequestUriTooLong"] = 414] = "RequestUriTooLong";
    AmqpResponseStatusCode[AmqpResponseStatusCode["UnsupportedMediaType"] = 415] = "UnsupportedMediaType";
    AmqpResponseStatusCode[AmqpResponseStatusCode["RequestedRangeNotSatisfiable"] = 416] = "RequestedRangeNotSatisfiable";
    AmqpResponseStatusCode[AmqpResponseStatusCode["ExpectationFailed"] = 417] = "ExpectationFailed";
    AmqpResponseStatusCode[AmqpResponseStatusCode["UpgradeRequired"] = 426] = "UpgradeRequired";
    AmqpResponseStatusCode[AmqpResponseStatusCode["InternalServerError"] = 500] = "InternalServerError";
    AmqpResponseStatusCode[AmqpResponseStatusCode["NotImplemented"] = 501] = "NotImplemented";
    AmqpResponseStatusCode[AmqpResponseStatusCode["BadGateway"] = 502] = "BadGateway";
    AmqpResponseStatusCode[AmqpResponseStatusCode["ServiceUnavailable"] = 503] = "ServiceUnavailable";
    AmqpResponseStatusCode[AmqpResponseStatusCode["GatewayTimeout"] = 504] = "GatewayTimeout";
    AmqpResponseStatusCode[AmqpResponseStatusCode["HttpVersionNotSupported"] = 505] = "HttpVersionNotSupported";
})(AmqpResponseStatusCode = exports.AmqpResponseStatusCode || (exports.AmqpResponseStatusCode = {}));
//# sourceMappingURL=index.js.map