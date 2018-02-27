import { EventEmitter } from "events";
import { EventData } from "./eventData"
/**
 * Instantiate a new receiver from the AMQP `Receiver`. Used by `EventHubClient`.
 * 
 * @param {any} receiver - The amqp receiver link.
 * @constructor
 */
export class EventHubReceiver extends EventEmitter {
  private _receiver: any;

  constructor(receiver: any) {
    super();
    const self = this;
    self._receiver = receiver;

    function onMessage(context: any) {
      var evData = EventData.fromAmqpMessage(context.message);
      self.emit('message', evData);
    }

    self.on('newListener', function (event) {
      if (event === 'message') {
        self._receiver.on('message', onMessage);
      }
    });

    self.on('removeListener', function (event) {
      if (event === 'message') {
        self._receiver.on('message', onMessage);
      }
    });
  }

  async close() {
    var self = this;
    return self._receiver.detach().then(function () {
      self.removeAllListeners();
      self._receiver = null;
    });
  }
}