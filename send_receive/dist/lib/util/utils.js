"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.
Object.defineProperty(exports, "__esModule", { value: true });
const AsyncLock = require("async-lock");
function parseConnectionString(connectionString) {
    return connectionString.split(';').reduce((acc, part) => {
        const splitIndex = part.indexOf('=');
        return Object.assign({}, acc, { [part.substring(0, splitIndex)]: part.substring(splitIndex + 1) });
    }, {});
}
exports.parseConnectionString = parseConnectionString;
/**
 * Gets a new instance of the async lock with desired settings.
 * @param {AsyncLockOptions} [options] The async lock options.
 */
function getNewAsyncLock(options) {
    return new AsyncLock(options);
}
exports.getNewAsyncLock = getNewAsyncLock;
/**
 * @constant {AsyncLock} defaultLock The async lock instance with default settings.
 */
exports.defaultLock = new AsyncLock();
//# sourceMappingURL=utils.js.map