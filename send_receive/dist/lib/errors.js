"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Error is thrown when an argument has a value that is out of the admissible range.
 *
 * @augments {Error}
 */
class ArgumentOutOfRangeError extends Error {
    constructor(message) {
        super(message);
        this.condition = "com.microsoft:argument-out-of-range";
        this.name = "ArgumentOutOfRangeError";
        this.message = message;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ArgumentOutOfRangeError = ArgumentOutOfRangeError;
/**
 * Error is thrown when the Event Hub is not found on the namespace.
 *
 * @augments {Error}
 */
class MessagingEntityNotFoundError extends Error {
    constructor(message) {
        super(message);
        this.condition = "amqp:not-found";
        this.name = "MessagingEntityNotFoundError";
        this.condition = "amqp:not-found";
        this.message = message;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.MessagingEntityNotFoundError = MessagingEntityNotFoundError;
/**
 * Error is thrown when an internal server error occured. You may have found a bug?
 *
 * @augments {Error}
 */
class InternalServerError extends Error {
    constructor(message) {
        super(message);
        this.condition = "amqp:internal-error";
        this.name = "InternalServerError";
        this.message = message;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.InternalServerError = InternalServerError;
/**
 * Error is thrown when a feature is not implemented yet but the placeholder is present.
 *
 * @augments {Error}
 */
class NotImplementedError extends Error {
    constructor(message) {
        super(message);
        this.condition = "amqp:not-implemented";
        this.name = "NotImplementedError";
        this.message = message;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.NotImplementedError = NotImplementedError;
/**
 * Error is thrown when an operation is attempted but is not allowed.
 *
 * @augments {Error}
 */
class InvalidOperationError extends Error {
    constructor(message) {
        super(message);
        this.condition = "amqp:not-allowed";
        this.name = "InvalidOperationError";
        this.message = message;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.InvalidOperationError = InvalidOperationError;
/**
 * Error is thrown when the connection parameters are wrong and the server refused the connection.
 *
 * @augments {Error}
 */
class UnauthorizedError extends Error {
    constructor(message) {
        super(message);
        this.condition = "amqp:unauthorized-access";
        this.name = "UnauthorizedError";
        this.message = message;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.UnauthorizedError = UnauthorizedError;
/**
 * Error is thrown the the Azure Event Hub quota has been exceeded.
 * Quotas are reset periodically, this operation will have to wait until then.
 * The messaging entity has reached its maximum allowable size.
 * This can happen if the maximum number of receivers (which is 5) has already
 * been opened on a per-consumer group level.
 * @augments {Error}
 */
class QuotaExceededError extends Error {
    constructor(message) {
        super(message);
        this.condition = "amqp:resource-limit-exceeded";
        this.name = "QuotaExceededError";
        this.message = message;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.QuotaExceededError = QuotaExceededError;
/**
 * Error is thrown when the message sent is too large: the maximum size is 256Kb.
 *
 * @augments {Error}
 */
class MessageTooLargeError extends Error {
    constructor(message) {
        super(message);
        this.condition = "amqp:link:message-size-exceeded";
        this.name = "MessageTooLargeError";
        this.message = message;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.MessageTooLargeError = MessageTooLargeError;
/**
 * Error is thrown when data could not be decoded.
 *
 * @augments {Error}
 */
class DecodeError extends Error {
    constructor(message) {
        super(message);
        this.condition = "amqp:decode-error";
        this.name = "DecodeError";
        this.message = message;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.DecodeError = DecodeError;
/**
 * Error is thrown when two or more instances connect to the same partition
 * with different epoch values.
 *
 * @augments {Error}
 */
class ReceiverDisconnectedError extends Error {
    constructor(message) {
        super(message);
        this.condition = "amqp:link:stolen";
        this.name = "ReceiverDisconnectedError";
        this.message = message;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ReceiverDisconnectedError = ReceiverDisconnectedError;
/**
 * Error is thrown when the service is unavailable. The operation should be retried.
 *
 * @augments {Error}
 */
class ServiceUnavailableError extends Error {
    constructor(message) {
        super(message);
        this.condition = "com.microsoft:timeout";
        this.name = "ServiceUnavailableError";
        this.message = message;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
/**
 * Error is thrown when a condition that should have been met in order to execute an operation was not.
 *
 * @augments {Error}
 */
class PreconditionFailedError extends Error {
    constructor(condition, message) {
        super(message);
        this.name = "PreconditionFailedError";
        this.message = message;
        this.condition = condition;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.PreconditionFailedError = PreconditionFailedError;
/**
 * Error is thrown when an invalid field was passed in a frame body, and the operation could not proceed.
 *
 * @augments {Error}
 */
class InvalidFieldError extends Error {
    constructor(message) {
        super(message);
        this.condition = "amqp:invalid-field";
        this.name = "InvalidFieldError";
        this.message = message;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.InvalidFieldError = InvalidFieldError;
/**
 * Error is thrown when the address provided cannot be resolved to a terminus at the current container
 *
 * @augments {Error}
 */
class LinkRedirectError extends Error {
    constructor(message) {
        super(message);
        this.condition = "amqp:link:redirect";
        this.name = "LinkRedirectError";
        this.message = message;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.LinkRedirectError = LinkRedirectError;
/**
 * Error is thrown when an operator intervened to detach for some reason.
 *
 * @augments {Error}
 */
class DetachForcedError extends Error {
    constructor(message) {
        super(message);
        this.condition = "amqp:link:detach-forced";
        this.name = "DetachForcedError";
        this.message = message;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.DetachForcedError = DetachForcedError;
/**
 * Error is thrown when the peer sent more message transfers than currently allowed on the link.
 *
 * @augments {Error}
 */
class TransferLimitExceededError extends Error {
    constructor(message) {
        super(message);
        this.condition = "amqp:link:transfer-limit-exceeded";
        this.name = "TransferLimitExceededError";
        this.message = message;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.TransferLimitExceededError = TransferLimitExceededError;
/**
 * Error is thrown when the peer violated incoming window for the session.
 *
 * @augments {Error}
 */
class SessionWindowViolationError extends Error {
    constructor(message) {
        super(message);
        this.condition = "amqp:session:window-violation";
        this.name = "SessionWindowViolationError";
        this.message = message;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.SessionWindowViolationError = SessionWindowViolationError;
/**
 * Error is thrown when input was received for a link that was detached with an error.
 *
 * @augments {Error}
 */
class ErrantLinkError extends Error {
    constructor(message) {
        super(message);
        this.condition = "amqp:session:errant-link";
        this.name = "SessionWindowViolationError";
        this.message = message;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ErrantLinkError = ErrantLinkError;
/**
 * Error is thrown when an attach was received using a handle that is already in use for an attached link.
 *
 * @augments {Error}
 */
class HanldeInUseError extends Error {
    constructor(message) {
        super(message);
        this.condition = "amqp:session:handle-in-use";
        this.name = "HanldeInUseError";
        this.message = message;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.HanldeInUseError = HanldeInUseError;
/**
 * Error is thrown when A frame (other than attach) was received referencing a handle which is not
 * currently in use of an attached link.
 *
 * @augments {Error}
 */
class UnattachedHandleError extends Error {
    constructor(message) {
        super(message);
        this.condition = "amqp:session:unattached-handle";
        this.name = "UnattachedHandleError";
        this.message = message;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.UnattachedHandleError = UnattachedHandleError;
/**
 * Translates the AQMP error received at the protocol layer into an EventHub JS Error.
 *
 * @param {AmqpError} err The amqp error that was received.
 * @returns {Error} eventHubError object.
 */
function translate(err) {
    const condition = err.condition;
    let error = err;
    if (condition) {
        switch (condition) {
            case "amqp:internal-error":
                error = new InternalServerError(err.description);
                break;
            case "amqp:link:message-size-exceeded":
                error = new MessageTooLargeError(err.description);
                break;
            case "amqp:not-found":
                error = new MessagingEntityNotFoundError(err.description);
                break;
            case "amqp:not-implemented":
                error = new NotImplementedError(err.description);
                break;
            case "amqp:not-allowed":
                error = new InvalidOperationError(err.description);
                break;
            case "amqp:resource-limit-exceeded":
                error = new QuotaExceededError(err.description);
                break;
            case "amqp:unauthorized-access":
                error = new UnauthorizedError(err.description);
                break;
            case "com.microsoft:timeout":
                error = new ServiceUnavailableError(err.description);
                break;
            case "com.microsoft:precondition-failed":
                error = new PreconditionFailedError("com.microsoft:precondition-failed", err.description);
                break;
            case "amqp:precondition-failed":
                error = new PreconditionFailedError("amqp:precondition-failed", err.description);
                break;
            case "amqp:link:stolen":
                error = new ReceiverDisconnectedError(err.description);
                break;
            case "amqp:decode-error":
                error = new DecodeError(err.description);
                break;
            case "com.microsoft:argument-out-of-range":
                error = new ArgumentOutOfRangeError(err.description);
                break;
            case "amqp:invalid-field":
                error = new InvalidFieldError(err.description);
                break;
            case "amqp:link:redirect":
                error = new LinkRedirectError(err.description);
                break;
            case "amqp:link:detach-forced":
                error = new DetachForcedError(err.description);
                break;
            case "amqp:session:window-violation":
                error = new SessionWindowViolationError(err.description);
                break;
            case "amqp:session:errant-link":
                error = new ErrantLinkError(err.description);
                break;
            case "amqp:session:handle-in-use":
                error = new HanldeInUseError(err.description);
                break;
            case "amqp:session:unattached-handle":
                error = new UnattachedHandleError(err.description);
                break;
            default:
                error = new Error(err.description);
        }
    }
    return error;
}
exports.translate = translate;
//# sourceMappingURL=errors.js.map