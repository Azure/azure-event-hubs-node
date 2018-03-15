import { AmqpError } from "../lib/rhea-promise";
/**
 * Error is thrown when an argument has a value that is out of the admissible range.
 *
 * @augments {Error}
 */
export declare class ArgumentOutOfRangeError extends Error {
    condition: string;
    constructor(message?: string);
}
/**
 * Error is thrown when the Event Hub is not found on the namespace.
 *
 * @augments {Error}
 */
export declare class MessagingEntityNotFoundError extends Error {
    condition: string;
    constructor(message?: string);
}
/**
 * Error is thrown when an internal server error occured. You may have found a bug?
 *
 * @augments {Error}
 */
export declare class InternalServerError extends Error {
    condition: string;
    constructor(message?: string);
}
/**
 * Error is thrown when a feature is not implemented yet but the placeholder is present.
 *
 * @augments {Error}
 */
export declare class NotImplementedError extends Error {
    condition: string;
    constructor(message?: string);
}
/**
 * Error is thrown when an operation is attempted but is not allowed.
 *
 * @augments {Error}
 */
export declare class InvalidOperationError extends Error {
    condition: string;
    constructor(message?: string);
}
/**
 * Error is thrown when the connection parameters are wrong and the server refused the connection.
 *
 * @augments {Error}
 */
export declare class UnauthorizedError extends Error {
    condition: string;
    constructor(message?: string);
}
/**
 * Error is thrown the the Azure Event Hub quota has been exceeded.
 * Quotas are reset periodically, this operation will have to wait until then.
 * The messaging entity has reached its maximum allowable size.
 * This can happen if the maximum number of receivers (which is 5) has already
 * been opened on a per-consumer group level.
 * @augments {Error}
 */
export declare class QuotaExceededError extends Error {
    condition: string;
    constructor(message?: string);
}
/**
 * Error is thrown when the message sent is too large: the maximum size is 256Kb.
 *
 * @augments {Error}
 */
export declare class MessageTooLargeError extends Error {
    condition: string;
    constructor(message?: string);
}
/**
 * Error is thrown when data could not be decoded.
 *
 * @augments {Error}
 */
export declare class DecodeError extends Error {
    condition: string;
    constructor(message?: string);
}
/**
 * Error is thrown when two or more instances connect to the same partition
 * with different epoch values.
 *
 * @augments {Error}
 */
export declare class ReceiverDisconnectedError extends Error {
    condition: string;
    constructor(message?: string);
}
/**
 * Error is thrown when the service is unavailable. The operation should be retried.
 *
 * @augments {Error}
 */
export declare class ServiceUnavailableError extends Error {
    condition: string;
    constructor(message?: string);
}
/**
 * Error is thrown when a condition that should have been met in order to execute an operation was not.
 *
 * @augments {Error}
 */
export declare class PreconditionFailedError extends Error {
    condition: "com.microsoft:precondition-failed" | "amqp:precondition-failed";
    constructor(condition: "com.microsoft:precondition-failed" | "amqp:precondition-failed", message?: string);
}
/**
 * Error is thrown when an invalid field was passed in a frame body, and the operation could not proceed.
 *
 * @augments {Error}
 */
export declare class InvalidFieldError extends Error {
    condition: string;
    constructor(message?: string);
}
/**
 * Error is thrown when the address provided cannot be resolved to a terminus at the current container
 *
 * @augments {Error}
 */
export declare class LinkRedirectError extends Error {
    condition: string;
    constructor(message?: string);
}
/**
 * Error is thrown when an operator intervened to detach for some reason.
 *
 * @augments {Error}
 */
export declare class DetachForcedError extends Error {
    condition: string;
    constructor(message?: string);
}
/**
 * Error is thrown when the peer sent more message transfers than currently allowed on the link.
 *
 * @augments {Error}
 */
export declare class TransferLimitExceededError extends Error {
    condition: string;
    constructor(message?: string);
}
/**
 * Error is thrown when the peer violated incoming window for the session.
 *
 * @augments {Error}
 */
export declare class SessionWindowViolationError extends Error {
    condition: string;
    constructor(message?: string);
}
/**
 * Error is thrown when input was received for a link that was detached with an error.
 *
 * @augments {Error}
 */
export declare class ErrantLinkError extends Error {
    condition: string;
    constructor(message?: string);
}
/**
 * Error is thrown when an attach was received using a handle that is already in use for an attached link.
 *
 * @augments {Error}
 */
export declare class HanldeInUseError extends Error {
    condition: string;
    constructor(message?: string);
}
/**
 * Error is thrown when A frame (other than attach) was received referencing a handle which is not
 * currently in use of an attached link.
 *
 * @augments {Error}
 */
export declare class UnattachedHandleError extends Error {
    condition: string;
    constructor(message?: string);
}
/**
 * Translates the AQMP error received at the protocol layer into an EventHub JS Error.
 *
 * @param {AmqpError} err The amqp error that was received.
 * @returns {Error} eventHubError object.
 */
export declare function translate(err: AmqpError): Error;
