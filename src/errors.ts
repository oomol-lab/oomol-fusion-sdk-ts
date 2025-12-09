/**
 * SDK 基础错误类
 */
export class OomolFusionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OomolFusionError';
    Object.setPrototypeOf(this, OomolFusionError.prototype);
  }
}

/**
 * 任务提交错误
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
 * 任务超时错误
 */
export class TaskTimeoutError extends OomolFusionError {
  constructor(
    public sessionID: string,
    public service: string,
    public timeout: number
  ) {
    super(`任务超时: ${sessionID} (超时时间: ${timeout}ms)`);
    this.name = 'TaskTimeoutError';
    Object.setPrototypeOf(this, TaskTimeoutError.prototype);
  }
}

/**
 * 任务失败错误
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
 * 网络请求错误
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
