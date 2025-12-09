/**
 * 任务状态
 */
export type TaskState = 'pending' | 'processing' | 'completed' | 'failed' | 'error';

/**
 * 任务提交请求参数
 */
export interface SubmitTaskRequest {
  /** 服务名称,例如: 'fal-nano-banana-pro' */
  service: string;
  /** 任务输入参数(动态类型,根据不同服务而变化) */
  inputs: Record<string, any>;
}

/**
 * 任务提交响应
 */
export interface SubmitTaskResponse {
  /** 会话ID */
  sessionID: string;
  /** 提交是否成功 */
  success: boolean;
}

/**
 * 任务结果响应
 */
export interface TaskResultResponse<T = any> {
  /** 任务状态 */
  state: TaskState;
  /** 任务数据(动态类型,根据不同服务而变化) */
  data?: T;
  /** 错误信息 */
  error?: string;
  /** 进度百分比 (0-100) */
  progress?: number;
}

/**
 * 任务执行结果
 */
export interface TaskResult<T = any> {
  /** 任务结果数据 */
  data: T;
  /** 会话ID */
  sessionID: string;
  /** 服务名称 */
  service: string;
}

/**
 * 进度回调函数
 */
export type ProgressCallback = (progress: number) => void;

/**
 * 运行选项
 */
export interface RunOptions {
  /** 进度回调函数 */
  onProgress?: ProgressCallback;
}

/**
 * SDK 配置选项
 */
export interface OomolFusionSDKOptions {
  /** OOMOL 令牌 */
  token: string;
  /** API 基础URL,默认: https://fusion-api.oomol.com/v1 */
  baseUrl?: string;
  /** 轮询间隔(毫秒),默认: 2000 */
  pollingInterval?: number;
  /** 超时时间(毫秒),默认: 300000 (5分钟) */
  timeout?: number;
}
