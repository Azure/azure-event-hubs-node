import { EventEmitter } from "events";
import { EventData } from "./eventData";
import * as Constants from "./util/constants";

/**
 * Instantiate a new receiver from the AMQP `Receiver`. Used by `EventHubClient`.
 *
 * @param {any} session - The amqp session on which the amqp receiver link was created.
 * @param {any} receiver - The amqp receiver link.
 * @constructor
 */
export class EventHubReceiver extends EventEmitter {
  private _receiver: any;
  private _session: any;

  constructor(session: any, receiver: any) {
    super();
    this._session = session;
    this._receiver = receiver;

    const onMessage = (context: any) => {
      const evData = EventData.fromAmqpMessage(context.message);
      this.emit(Constants.message, evData);
    };

    this.on("newListener", (event) => {
      if (event === Constants.message) {
        if (this._session && this._receiver) {
          this._receiver.on(Constants.message, onMessage);
        }
      }
    });

    this.on("removeListener", (event) => {
      if (event === Constants.message) {
        if (!this._session && this._receiver) {
          this._receiver.on(Constants.message, onMessage);
        }
      }
    });
  }

  async close(): Promise<void> {
    await this._receiver.detach();
    this.removeAllListeners();
    this._receiver = undefined;
    this._session = undefined;
  }
}
