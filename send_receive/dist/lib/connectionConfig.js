"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./util/utils");
var ConnectionConfig;
(function (ConnectionConfig) {
    /**
     * Creates the connection config.
     * @param {string} connectionString - The event hub connection string
     * @param {string} [path]           - The name/path of the entity (hub name) to which the connection needs to happen
     */
    function create(connectionString, path) {
        const parsedCS = utils_1.parseConnectionString(connectionString);
        if (!path && !parsedCS.EntityPath) {
            throw new Error(`Either provide "path" or the "connectionString": "${connectionString}", must contain EntityPath="<path-to-the-entity>".`);
        }
        const result = {
            connectionString: connectionString,
            endpoint: parsedCS.Endpoint,
            host: (parsedCS.Endpoint.match('sb://([^/]*)') || [])[1],
            entityPath: path || parsedCS.EntityPath,
            sharedAccessKeyName: parsedCS.SharedAccessKeyName,
            sharedAccessKey: parsedCS.SharedAccessKey
        };
        return result;
    }
    ConnectionConfig.create = create;
})(ConnectionConfig = exports.ConnectionConfig || (exports.ConnectionConfig = {}));
//# sourceMappingURL=connectionConfig.js.map