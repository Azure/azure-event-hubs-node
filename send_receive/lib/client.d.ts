// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import Promise = require('bluebird');

import ConnectionConfig = require('./config');
import Receiver = require('./receiver');
import Sender = require('./sender');

declare namespace EventHubClient {
    enum receiverSettleMode {
        autoSettle,
        settleOnDisposition
    }

    interface ReceiverFlowControlPolicy {
        /**
         * Auto or On disposition
         * One of EventHubClient.receiverSettleMode.autoSettle or EventHubClient.receiverSettleMode.settleOnDisposition
         */
        receiverSettleMethod: receiverSettleMode;
        /**
         * Re-crediting policy if not auto-settling
         */
        creditPolicy?: () => void;
        /**
         * Initial number of credits for the receiver if not auto-settling
         */
        creditQuantum?: number;
    }

    interface ReceiverOptions {
        startAfterTime?: Date | number;
        startAfterOffset?: string;
        customFilter?: string;
        flowControlPolicy?: ReceiverFlowControlPolicy;
    }
    type PartitionId = string | number;
}

declare class EventHubClient {
    constructor(config: ConnectionConfig);
    open(): Promise<void>;
    close(): Promise<void>;
    getPartitionIds(): Promise<EventHubClient.PartitionId[]>;

    createReceiver(consumerGroup: string, partitionId: EventHubClient.PartitionId, options?: EventHubClient.ReceiverOptions): Promise<Receiver>;
    createSender(partitionId?: EventHubClient.PartitionId): Promise<Sender>;

    static fromConnectionString(connectionString: string, path?: string): EventHubClient;
}

export = EventHubClient;
