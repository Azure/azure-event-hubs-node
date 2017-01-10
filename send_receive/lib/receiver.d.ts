// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { EventEmitter } from 'events';
import Promise = require('bluebird');
import { Message } from 'azure-iot-common';

declare namespace EventHubReceiver {
    enum receiverSettleMode {
        autoSettle,
        settleOnDisposition
    }

    type CreditPolicy = () => void;
    const creditPolicies: {
        RefreshAtHalf: CreditPolicy;
        RefreshAtEmpty: CreditPolicy;
        RefreshSettled(treshold: number): CreditPolicy;
        DoNotRefresh: CreditPolicy;
    };

    interface ReceiverFlowControlPolicy {
        /**
         * Auto or On disposition
         * One of EventHubClient.receiverSettleMode.autoSettle or EventHubClient.receiverSettleMode.settleOnDisposition
         */
        receiverSettleMethod: receiverSettleMode;
        /**
         * Re-crediting policy if not auto-settling
         */
        creditPolicy?: CreditPolicy;
        /**
         * Initial number of credits for the receiver if not auto-settling
         */
        creditQuantum?: number;
    }
}

declare class EventHubReceiver extends EventEmitter {
    // TODO: When upgrading to amqp10 v3 use already existing typings
    constructor(amqpReceiverLink: any);
    close(): Promise<void>;

    // List of all the events that the receiver can emmit
    on(type: 'message', func: (message: Message) => void): this;
    on(type: 'errorReceived', func: (err: Error) => void): this;
    // Required last overload, though which shouldn't be called during normal operation
    on(type: string, func: Function): this;

    addCredits(creditsQuantum: number): void;
}

export = EventHubReceiver;
