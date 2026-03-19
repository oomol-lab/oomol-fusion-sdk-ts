import { FusionApiError, FusionError } from "./errors.js";

export type FusionErrorCode =
  | "HTTP_ERROR"
  | "TASK_NOT_FOUND"
  | "TASK_TIMEOUT"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";

export interface FusionErrorShape {
  code: FusionErrorCode;
  message: string;
  status?: number;
  retryable: boolean;
  details?: unknown;
}

export class OomolFusionSdkError extends FusionError {
  readonly code: FusionErrorCode;
  readonly status?: number;
  readonly retryable: boolean;
  readonly details?: unknown;

  constructor(shape: FusionErrorShape) {
    super(shape.message);
    this.code = shape.code;
    this.status = shape.status;
    this.retryable = shape.retryable;
    this.details = shape.details;
  }

  toJSON(): FusionErrorShape {
    return {
      code: this.code,
      message: this.message,
      status: this.status,
      retryable: this.retryable,
      details: this.details,
    };
  }

  static fromUnknown(error: unknown): OomolFusionSdkError {
    if (error instanceof OomolFusionSdkError) {
      return error;
    }

    if (error instanceof FusionApiError) {
      const retryable =
        error.status >= 500 || error.status === 408 || error.status === 429;

      return new OomolFusionSdkError({
        code: "HTTP_ERROR",
        message: error.message,
        status: error.status,
        retryable,
        details: {
          path: error.path,
          body: error.body,
        },
      });
    }

    if (error instanceof Error) {
      const lowerMessage = error.message.toLowerCase();
      const looksNetworkRelated =
        lowerMessage.includes("network") ||
        lowerMessage.includes("fetch") ||
        lowerMessage.includes("aborted") ||
        lowerMessage.includes("timed out");

      return new OomolFusionSdkError({
        code: looksNetworkRelated ? "NETWORK_ERROR" : "UNKNOWN_ERROR",
        message: error.message,
        retryable: looksNetworkRelated,
        details: error,
      });
    }

    return new OomolFusionSdkError({
      code: "UNKNOWN_ERROR",
      message: "Unknown SDK error",
      retryable: false,
      details: error,
    });
  }
}
