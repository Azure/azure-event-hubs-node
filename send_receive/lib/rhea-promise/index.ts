// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import * as rhea from "rhea";

export async function connect(options: ConnectionOptions): Promise<any> {
  return new Promise((resolve, reject) => {
    const connection = rhea.connect(options);

    function onOpen(context: any): void {
      connection.removeListener('connection_open', onOpen);
      connection.removeListener('connection_close', onClose);
      connection.removeListener('disconnected', onClose);
      resolve(connection);
    }

    function onClose(err: any): void {
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

export async function createSession(connection: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const session = connection.create_session();

    function onOpen(context: any): void {
      session.removeListener('session_open', onOpen);
      session.removeListener('session_close', onClose);
      resolve(session);
    }

    function onClose(err: any): void {
      session.removeListener('session_open', onOpen);
      session.removeListener('session_close', onClose);
      reject(err);
    }

    session.once('session_open', onOpen);
    session.once('session_close', onClose);

    session.begin();
  });
}

export async function createSender(session: any, options?: SenderOptions): Promise<any> {
  return new Promise((resolve, reject) => {
    const sender = session.attach_sender(options);

    function onOpen(context: any): void {
      sender.removeListener('sendable', onOpen);
      sender.removeListener('sender_close', onClose);
      resolve(sender);
    }

    function onClose(err: any): void {
      sender.removeListener('sendable', onOpen);
      sender.removeListener('sender_close', onClose);
      reject(err);
    }

    sender.once('sendable', onOpen);
    sender.once('sender_close', onClose);
  });
}

export async function createReceiver(session: any, options?: ReceiverOptions): Promise<any> {
  return new Promise((resolve, reject) => {
    const receiver = session.attach_receiver(options);

    function onOpen(context: any): void {
      receiver.removeListener('receiver_open', onOpen);
      receiver.removeListener('receiver_close', onClose);
      resolve(receiver);
    }

    function onClose(err: any): void {
      receiver.removeListener('receiver_open', onOpen);
      receiver.removeListener('receiver_close', onClose);
      reject(err);
    }

    receiver.once('receiver_open', onOpen);
    receiver.once('receiver_close', onClose);
  });
}

export interface ConnectionOptions {
  /**
   * @property {string} [transport] - The transport option.
   */
  transport?: 'tls' | 'ssl' | 'tcp';
  /**
   * @property {string} host - The host to connect to.
   */
  host: string;
  /**
   * @property {string} hostname - The hostname to connect to.
   */
  hostname: string;
  /**
   * @property {number} port - The port number 5671 or 5672 at which to connect to.
   */
  port: number;
  /**
   * @property {boolean} [reconnect] if true (the default), the library will automatically attempt to
   * reconnect if disconnected.
   * - if false, automatic reconnect will be disabled
   * - if it is a numeric value, it is interpreted as the delay between
   * reconnect attempts (in milliseconds)
   */
  reconnect?: boolean;
  /**
   * @property {number} [reconnect_limit] maximum number of reconnect attempts. Applicable only when reconnect is true.
   */
  reconnect_limit?: number;
  /**
   * @property {number} [initial_reconnect_delay] - Time to wait in milliseconds before attempting to reconnect.
   */
  initial_reconnect_delay?: number;
  /**
   * @property {number} [max_reconnect_delay] - Maximum reconnect delay in milliseconds before attempting to reconnect.
   */
  max_reconnect_delay?: number;
  /**
   * @property {string} username - The username.
   */
  username: string;
  /**
   * @property {string} username - The secret.
   */
  password?: string;
}

export interface LinkOptions {
  /**
   * @property {string} [name] The name of the link.
   * This should be unique for the container.
   * If not specified a unqiue name is generated.
   */
  name?: string;
  /**
   * @property {number} [snd_settle_mode] it specifies the sender settle mode with following possibile values:
   * - 0 - "unsettled" - The sender will send all deliveries initially unsettled to the receiver.
   * - 1 - "settled" - The sender will send all deliveries settled to the receiver.
   * - 2 - "mixed" - (default) The sender MAY send a mixture of settled and unsettled deliveries to the receiver.
   */
  snd_settle_mode?: 0 | 1 | 2;
  /**
   * @property {number} [rcv_settle_mode] it specifies the receiver settle mode with following possibile values:
   * - 0 - "first" - The receiver will spontaneously settle all incoming transfers.
   * - 1 - "second" - The receiver will only settle after sending the disposition to the sender and receiving a
   * disposition indicating settlement of the delivery from the sender.
   */
  rcv_settle_mode?: 0 | 1;
}

export interface TerminusOptions {
  /**
   * @property {string} [address] - The AMQP address as target for this terminus.
   */
  address: string;
  /**
   * @property {object} [filter] - The filters to be added for the terminus.
   */
  filter?: {
    [x: string]: any;
  };
  /**
   * @property {boolean} [durable] - It specifies a request for the receiving peer
   * to dynamically create a node at the target/source. Default: false.
   */
  dynamic?: boolean;
  /**
   * @property {string} [expiry_policy] - The expiry policy of the terminus. Default value "session-end".
   */
  expiry_policy?: string;
  /**
   * @property {number} [durable] It specifies what state of the terminus will be retained durably:
   *  - the state of durable messages (unsettled_state value),
   *  - only existence and configuration of the terminus (configuration value), or
   *  - no state at all (none value);
   */
  durable?: number;
}

export interface ReceiverOptions extends LinkOptions {
  /**
   * @property {object} [prefetch]  A 'prefetch' window controlling the flow of messages over
   * this receiver. Defaults to 500 if not specified. A value of 0 can be used to
   * turn of automatic flow control and manage it directly.
   */
  prefetch?: number;
  /**
   * @property {boolean} [autoaccept] Whether received messages should be automatically accepted. Defaults to true.
   */
  autoaccept?: boolean;
  /**
   * @property {object} [source]  The source from which messages are received.
   */
  source: TerminusOptions;
  /**
   * @property {object} [target]  The target of a receiving link is the local identifier
   */
  target?: TerminusOptions;
}

export interface SenderOptions extends LinkOptions {
  /**
   * @property {boolean} [autosettle] Whether sent messages should be automatically settled once the peer settles them. Defaults to true.
   */
  autosettle?: boolean;
  /**
   * @property {object} [target]  - The target to which messages are sent
   */
  target: TerminusOptions;
  /**
   * @property {object} [source]  The source of a sending link is the local identifier
   */
  source?: TerminusOptions;
}
