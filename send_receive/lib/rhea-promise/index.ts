
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

    function onClose(err: any): void  {
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

    function onOpen(context: any): void  {
      session.removeListener('session_open', onOpen);
      session.removeListener('session_close', onClose);
      resolve(session);
    }

    function onClose(err: any): void  {
      session.removeListener('session_open', onOpen);
      session.removeListener('session_close', onClose);
      reject(err);
    }

    session.once('session_open', onOpen);
    session.once('session_close', onClose);

    session.begin();
  });
}

export async function createSender(session: any, path: string, options?: any): Promise<any> {
  if (!options) options = {};
  if (!options.target) options.target = {};
  options.target.address = path;

  return new Promise((resolve, reject) => {
    const sender = session.attach_sender(path, options);

    function onOpen(context: any): void  {
      sender.removeListener('sendable', onOpen);
      sender.removeListener('sender_close', onClose);
      resolve(sender);
    }

    function onClose(err: any): void  {
      sender.removeListener('sendable', onOpen);
      sender.removeListener('sender_close', onClose);
      reject(err);
    }

    sender.once('sendable', onOpen);
    sender.once('sender_close', onClose);
  });
}

export async function createReceiver(session: any, path: string, options?: any): Promise<any> {
  if (!options) options = {};
  if (!options.source) options.source = {};
  options.source.address = path;

  return new Promise((resolve, reject) => {
    const receiver = session.attach_receiver(options);

    function onOpen(context: any): void  {
      receiver.removeListener('receiver_open', onOpen);
      receiver.removeListener('receiver_close', onClose);
      resolve(receiver);
    }

    function onClose(err: any): void  {
      receiver.removeListener('receiver_open', onOpen);
      receiver.removeListener('receiver_close', onClose);
      reject(err);
    }

    receiver.once('receiver_open', onOpen);
    receiver.once('receiver_close', onClose);
  });
}

export interface ParsedConnectionString {
  Endpoint: string;
  SharedAccessKeyName: string;
  SharedAccessKey: string;
  EntityPath?: string;
  [x: string]: any;
}

export interface ConnectionOptions {
  transport?: string;
  host: string;
  hostname: string;
  port: number;
  reconnect_limit?: number;
  username: string;
  password?: string;
}

export function parseConnectionString(connectionString: string): ParsedConnectionString {
  return connectionString.split(';').reduce((acc, part) => {
    const splitIndex = part.indexOf('=');
    return {
      ...acc,
      [part.substring(0, splitIndex)]: part.substring(splitIndex + 1)
    };
  }, {} as any);
}

