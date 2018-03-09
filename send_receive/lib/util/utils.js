"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function parseConnectionString(connectionString) {
    return connectionString.split(';').reduce((acc, part) => {
        const splitIndex = part.indexOf('=');
        return Object.assign({}, acc, { [part.substring(0, splitIndex)]: part.substring(splitIndex + 1) });
    }, {});
}
exports.parseConnectionString = parseConnectionString;
