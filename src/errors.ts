/**
 * SDK base error class
 */
export class OomolFusionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OomolFusionError';
    Object.setPrototypeOf(this, OomolFusionError.prototype);
  }
}

/**
 * Task submission error
 */
export class TaskSubmitError extends OomolFusionError {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'TaskSubmitError';
    Object.setPrototypeOf(this, TaskSubmitError.prototype);
  }
}

/**
 * Task timeout error
 */
export class TaskTimeoutError extends OomolFusionError {
  constructor(
    public sessionID: string,
    public service: string,
    public timeout: number
  ) {
    super(`Task timeout: ${sessionID} (timeout: ${timeout}ms)`);
    this.name = 'TaskTimeoutError';
    Object.setPrototypeOf(this, TaskTimeoutError.prototype);
  }
}

/**
 * Task failed error
 */
export class TaskFailedError extends OomolFusionError {
  constructor(
    message: string,
    public sessionID: string,
    public service: string,
    public state: string
  ) {
    super(message);
    this.name = 'TaskFailedError';
    Object.setPrototypeOf(this, TaskFailedError.prototype);
  }
}

/**
 * Network request error
 */
export class NetworkError extends OomolFusionError {
  constructor(
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * File upload error
 */
export class FileUploadError extends OomolFusionError {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'FileUploadError';
    Object.setPrototypeOf(this, FileUploadError.prototype);
  }
}

/**
 * File size exceeds limit error
 */
export class FileTooLargeError extends FileUploadError {
  constructor(
    public fileSize: number,
    public maxSize: number
  ) {
    super(`File size exceeds limit: ${(fileSize / 1024 / 1024).toFixed(2)}MB (max: ${(maxSize / 1024 / 1024).toFixed(2)}MB)`);
    this.name = 'FileTooLargeError';
    Object.setPrototypeOf(this, FileTooLargeError.prototype);
  }
}
