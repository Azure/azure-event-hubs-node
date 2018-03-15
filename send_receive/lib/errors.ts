// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { AmqpError } from "../lib/rhea-promise";
/**
 * Error is thrown when an argument has a value that is out of the admissible range.
 *
 * @augments {Error}
 */
export class ArgumentOutOfRangeError extends Error {
  condition: string = "com.microsoft:argument-out-of-range";
  constructor(message?: string) {
    super(message);
    this.name = "ArgumentOutOfRangeError";
    this.message = message as string;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error is thrown when the Event Hub is not found on the namespace.
 *
 * @augments {Error}
 */
export class MessagingEntityNotFoundError extends Error {
  condition: string = "amqp:not-found";
  constructor(message?: string) {
    super(message);
    this.name = "MessagingEntityNotFoundError";
    this.condition = "amqp:not-found";
    this.message = message as string;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error is thrown when an internal server error occured. You may have found a bug?
 *
 * @augments {Error}
 */
export class InternalServerError extends Error {
  condition: string = "amqp:internal-error";
  constructor(message?: string) {
    super(message);
    this.name = "InternalServerError";
    this.message = message as string;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error is thrown when a feature is not implemented yet but the placeholder is present.
 *
 * @augments {Error}
 */
export class NotImplementedError extends Error {
  condition: string = "amqp:not-implemented";
  constructor(message?: string) {
    super(message);
    this.name = "NotImplementedError";
    this.message = message as string;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error is thrown when an operation is attempted but is not allowed.
 *
 * @augments {Error}
 */
export class InvalidOperationError extends Error {
  condition: string = "amqp:not-allowed";
  constructor(message?: string) {
    super(message);
    this.name = "InvalidOperationError";
    this.message = message as string;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error is thrown when the connection parameters are wrong and the server refused the connection.
 *
 * @augments {Error}
 */
export class UnauthorizedError extends Error {
  condition: string = "amqp:unauthorized-access";
  constructor(message?: string) {
    super(message);
    this.name = "UnauthorizedError";
    this.message = message as string;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error is thrown the the Azure Event Hub quota has been exceeded.
 * Quotas are reset periodically, this operation will have to wait until then.
 * The messaging entity has reached its maximum allowable size.
 * This can happen if the maximum number of receivers (which is 5) has already
 * been opened on a per-consumer group level.
 * @augments {Error}
 */
export class QuotaExceededError extends Error {
  condition: string = "amqp:resource-limit-exceeded";
  constructor(message?: string) {
    super(message);
    this.name = "QuotaExceededError";
    this.message = message as string;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error is thrown when the message sent is too large: the maximum size is 256Kb.
 *
 * @augments {Error}
 */
export class MessageTooLargeError extends Error {
  condition: string = "amqp:link:message-size-exceeded";
  constructor(message?: string) {
    super(message);
    this.name = "MessageTooLargeError";
    this.message = message as string;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error is thrown when data could not be decoded.
 *
 * @augments {Error}
 */
export class DecodeError extends Error {
  condition: string = "amqp:decode-error";
  constructor(message?: string) {
    super(message);
    this.name = "DecodeError";
    this.message = message as string;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error is thrown when two or more instances connect to the same partition
 * with different epoch values.
 *
 * @augments {Error}
 */
export class ReceiverDisconnectedError extends Error {
  condition: string = "amqp:link:stolen";
  constructor(message?: string) {
    super(message);
    this.name = "ReceiverDisconnectedError";
    this.message = message as string;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error is thrown when the service is unavailable. The operation should be retried.
 *
 * @augments {Error}
 */
export class ServiceUnavailableError extends Error {
  condition: string = "com.microsoft:timeout";
  constructor(message?: string) {
    super(message);
    this.name = "ServiceUnavailableError";
    this.message = message as string;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error is thrown when a condition that should have been met in order to execute an operation was not.
 *
 * @augments {Error}
 */
export class PreconditionFailedError extends Error {
  condition: "com.microsoft:precondition-failed" | "amqp:precondition-failed";
  constructor(condition: "com.microsoft:precondition-failed" | "amqp:precondition-failed", message?: string) {
    super(message);
    this.name = "PreconditionFailedError";
    this.message = message as string;
    this.condition = condition;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error is thrown when an invalid field was passed in a frame body, and the operation could not proceed.
 *
 * @augments {Error}
 */
export class InvalidFieldError extends Error {
  condition: string = "amqp:invalid-field";
  constructor(message?: string) {
    super(message);
    this.name = "InvalidFieldError";
    this.message = message as string;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error is thrown when the address provided cannot be resolved to a terminus at the current container
 *
 * @augments {Error}
 */
export class LinkRedirectError extends Error {
  condition: string = "amqp:link:redirect";
  constructor(message?: string) {
    super(message);
    this.name = "LinkRedirectError";
    this.message = message as string;
    Error.captureStackTrace(this, this.constructor);
  }
}
/**
 * Error is thrown when an operator intervened to detach for some reason.
 *
 * @augments {Error}
 */
export class DetachForcedError extends Error {
  condition: string = "amqp:link:detach-forced";
  constructor(message?: string) {
    super(message);
    this.name = "DetachForcedError";
    this.message = message as string;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error is thrown when the peer sent more message transfers than currently allowed on the link.
 *
 * @augments {Error}
 */
export class TransferLimitExceededError extends Error {
  condition: string = "amqp:link:transfer-limit-exceeded";
  constructor(message?: string) {
    super(message);
    this.name = "TransferLimitExceededError";
    this.message = message as string;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error is thrown when the peer violated incoming window for the session.
 *
 * @augments {Error}
 */
export class SessionWindowViolationError extends Error {
  condition: string = "amqp:session:window-violation";
  constructor(message?: string) {
    super(message);
    this.name = "SessionWindowViolationError";
    this.message = message as string;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error is thrown when input was received for a link that was detached with an error.
 *
 * @augments {Error}
 */
export class ErrantLinkError extends Error {
  condition: string = "amqp:session:errant-link";
  constructor(message?: string) {
    super(message);
    this.name = "SessionWindowViolationError";
    this.message = message as string;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error is thrown when an attach was received using a handle that is already in use for an attached link.
 *
 * @augments {Error}
 */
export class HanldeInUseError extends Error {
  condition: string = "amqp:session:handle-in-use";
  constructor(message?: string) {
    super(message);
    this.name = "HanldeInUseError";
    this.message = message as string;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error is thrown when A frame (other than attach) was received referencing a handle which is not
 * currently in use of an attached link.
 *
 * @augments {Error}
 */
export class UnattachedHandleError extends Error {
  condition: string = "amqp:session:unattached-handle";
  constructor(message?: string) {
    super(message);
    this.name = "UnattachedHandleError";
    this.message = message as string;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Translates the AQMP error received at the protocol layer into an EventHub JS Error.
 *
 * @param {AmqpError} err The amqp error that was received.
 * @returns {Error} eventHubError object.
 */
export function translate(err: AmqpError): Error {
  const condition = err.condition;
  let error: Error = err;
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
