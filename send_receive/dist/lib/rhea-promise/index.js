"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.
Object.defineProperty(exports, "__esModule", { value: true });
const rhea = require("rhea");
async function connect(options) {
    return new Promise((resolve, reject) => {
        const connection = rhea.connect(options);
        function onOpen(context) {
            connection.removeListener('connection_open', onOpen);
            connection.removeListener('connection_close', onClose);
            connection.removeListener('disconnected', onClose);
            resolve(connection);
        }
        function onClose(err) {
            connection.removeListener('connection_open', onOpen);
            connection.removeListener('connection_close', onClose);
            connection.removeListener('disconnected', onClose);
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
            resolve(session);
        }
        function onClose(err) {
            session.removeListener('session_open', onOpen);
            session.removeListener('session_close', onClose);
            reject(err);
        }
        session.once('session_open', onOpen);
        session.once('session_close', onClose);
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
            resolve(sender);
        }
        function onClose(err) {
            sender.removeListener('sendable', onOpen);
            sender.removeListener('sender_close', onClose);
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
            resolve(receiver);
        }
        function onClose(err) {
            receiver.removeListener('receiver_open', onOpen);
            receiver.removeListener('receiver_close', onClose);
            reject(err);
        }
        receiver.once('receiver_open', onOpen);
        receiver.once('receiver_close', onClose);
    });
}
exports.createReceiver = createReceiver;
//# sourceMappingURL=index.js.map