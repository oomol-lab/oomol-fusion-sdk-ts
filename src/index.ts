import {
  SubmitTaskRequest,
  SubmitTaskResponse,
  TaskResultResponse,
  TaskResult,
  OomolFusionSDKOptions,
  RunOptions,
  ProgressCallback,
} from './types';
import {
  TaskSubmitError,
  TaskTimeoutError,
  TaskFailedError,
  NetworkError,
} from './errors';
import { validateEnvironment } from './utils';

/**
 * OOMOL Fusion SDK
 *
 * 通用的 OOMOL Fusion API 客户端,支持调用任意 Fusion 服务
 *
 * @example
 * ```typescript
 * const sdk = new OomolFusionSDK({ token: 'your-token' });
 *
 * // 执行任务并等待结果(推荐方式)
 * const result = await sdk.run({
 *   service: 'fal-nano-banana-pro',
 *   inputs: { prompt: '一只可爱的小猫' }
 * });
 *
 * // 如需更细粒度的控制:提交任务但不等待
 * const { sessionID } = await sdk.submit({
 *   service: 'fal-nano-banana-pro',
 *   inputs: { prompt: '一只小狗' }
 * });
 * // 稍后查询结果
 * const result2 = await sdk.waitFor('fal-nano-banana-pro', sessionID);
 * ```
 */
export class OomolFusionSDK {
  private token: string;
  private baseUrl: string;
  private pollingInterval: number;
  private timeout: number;

  constructor(options: OomolFusionSDKOptions) {
    this.token = options.token;
    this.baseUrl = options.baseUrl || 'https://fusion-api.oomol.com/v1';
    this.pollingInterval = options.pollingInterval || 2000;
    this.timeout = options.timeout || 300000;

    // 验证运行时环境
    validateEnvironment();
  }

  /**
   * 执行任务并等待结果(推荐使用)
   *
   * 这是最常用的方法,一次调用即可提交任务并等待完成
   *
   * @example
   * ```typescript
   * // 基础用法
   * const result = await sdk.run({
   *   service: 'fal-nano-banana-pro',
   *   inputs: {
   *     prompt: "一只可爱的小猫",
   *     aspect_ratio: "1:1",
   *     resolution: "2K"
   *   }
   * });
   *
   * // 带进度回调
   * const result = await sdk.run(
   *   {
   *     service: 'fal-nano-banana-pro',
   *     inputs: { prompt: "一只小猫" }
   *   },
   *   {
   *     onProgress: (progress) => {
   *       console.log(`进度: ${progress}%`);
   *     }
   *   }
   * );
   * ```
   */
  async run<T = any>(request: SubmitTaskRequest, options?: RunOptions): Promise<TaskResult<T>> {
    const submitResponse = await this.submitTask(request);

    if (!submitResponse.success) {
      throw new TaskSubmitError('任务提交失败');
    }

    const result = await this.waitForResult<T>(
      submitResponse.sessionID,
      request.service,
      options?.onProgress
    );
    return result;
  }

  /**
   * 仅提交任务,不等待结果
   *
   * 适用于需要批量提交多个任务,或者想要异步处理的场景
   *
   * @example
   * ```typescript
   * // 批量提交
   * const tasks = await Promise.all([
   *   sdk.submit({ service: 'fal-nano-banana-pro', inputs: { prompt: '小猫' } }),
   *   sdk.submit({ service: 'fal-nano-banana-pro', inputs: { prompt: '小狗' } }),
   * ]);
   *
   * // 稍后查询结果
   * const results = await Promise.all(
   *   tasks.map(({ sessionID }) => sdk.waitFor('fal-nano-banana-pro', sessionID))
   * );
   * ```
   */
  async submit(request: SubmitTaskRequest): Promise<SubmitTaskResponse> {
    return this.submitTask(request);
  }

  /**
   * 等待指定 sessionID 的任务完成
   *
   * 与 submit() 配合使用,用于等待之前提交的任务
   *
   * @example
   * ```typescript
   * const { sessionID } = await sdk.submit({
   *   service: 'fal-nano-banana-pro',
   *   inputs: { prompt: '...' }
   * });
   *
   * // 做其他事情...
   *
   * // 稍后等待结果
   * const result = await sdk.waitFor('fal-nano-banana-pro', sessionID, {
   *   onProgress: (progress) => console.log(`进度: ${progress}%`)
   * });
   * ```
   */
  async waitFor<T = any>(service: string, sessionID: string, options?: RunOptions): Promise<TaskResult<T>> {
    return this.waitForResult<T>(sessionID, service, options?.onProgress);
  }

  /**
   * 直接获取任务状态(不等待)
   *
   * 用于手动轮询任务状态,不推荐使用,建议使用 run() 或 waitFor()
   *
   * @example
   * ```typescript
   * const status = await sdk.getTaskStatus('fal-nano-banana-pro', sessionID);
   * if (status.state === 'completed') {
   *   console.log(status.data);
   * } else if (status.state === 'processing') {
   *   console.log('任务处理中...');
   * }
   * ```
   */
  async getTaskStatus<T = any>(service: string, sessionID: string): Promise<TaskResultResponse<T>> {
    return this.checkTaskStatus<T>(sessionID, service);
  }

  /**
   * 提交任务(内部方法)
   */
  private async submitTask(request: SubmitTaskRequest): Promise<SubmitTaskResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${request.service}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request.inputs),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new TaskSubmitError(
          `任务提交失败: ${errorText}`,
          response.status,
          errorText
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof TaskSubmitError) {
        throw error;
      }
      throw new NetworkError('网络请求失败', error as Error);
    }
  }

  /**
   * 等待任务完成(内部自动轮询)
   */
  private async waitForResult<T = any>(
    sessionID: string,
    service: string,
    onProgress?: ProgressCallback
  ): Promise<TaskResult<T>> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const poll = async () => {
        // 检查是否超时
        if (Date.now() - startTime > this.timeout) {
          const error = new TaskTimeoutError(sessionID, service, this.timeout);
          reject(error);
          return;
        }

        try {
          const result = await this.checkTaskStatus<T>(sessionID, service);

          // 发出进度回调
          if (onProgress && result.progress !== undefined) {
            onProgress(result.progress);
          }

          if (result.state === 'completed') {
            if (!result.data) {
              throw new TaskFailedError('任务完成但没有返回数据', sessionID, service, result.state);
            }

            const finalResult: TaskResult<T> = {
              data: result.data,
              sessionID,
              service,
            };

            // 完成时确保进度为 100%
            if (onProgress) {
              onProgress(100);
            }

            resolve(finalResult);
          } else if (result.state === 'failed' || result.state === 'error') {
            const error = new TaskFailedError(
              result.error || `任务失败: ${result.state}`,
              sessionID,
              service,
              result.state
            );
            reject(error);
          } else {
            // 任务仍在处理中,继续轮询
            setTimeout(poll, this.pollingInterval);
          }
        } catch (error) {
          reject(error);
        }
      };

      // 开始轮询
      poll();
    });
  }

  /**
   * 检查任务状态(内部方法)
   */
  private async checkTaskStatus<T = any>(sessionID: string, service: string): Promise<TaskResultResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}/${service}/result/${sessionID}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new NetworkError(`获取任务状态失败: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof NetworkError) {
        throw error;
      }
      throw new NetworkError('网络请求失败', error as Error);
    }
  }
}

export default OomolFusionSDK;

// 导出所有类型
export * from './types';
export * from './errors';
export * from './utils';
