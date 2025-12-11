import {
  SubmitTaskRequest,
  SubmitTaskResponse,
  TaskResultResponse,
  TaskResult,
  OomolFusionSDKOptions,
  RunOptions,
  ProgressCallback,
  UploadOptions,
} from './types';
import {
  TaskSubmitError,
  TaskTimeoutError,
  TaskFailedError,
  NetworkError,
} from './errors';
import { validateEnvironment } from './utils';
import {
  MultipartUploader,
  SingleFileUploader,
  shouldUseMultipartUpload,
} from './uploader';

/**
 * OOMOL Fusion SDK
 *
 * A universal OOMOL Fusion API client that supports calling any Fusion service
 *
 * @example
 * ```typescript
 * const sdk = new OomolFusionSDK({ token: 'your-token' });
 *
 * // Execute task and wait for result (recommended approach)
 * const result = await sdk.run({
 *   service: 'fal-nano-banana-pro',
 *   inputs: { prompt: 'a cute kitten' }
 * });
 *
 * // For more fine-grained control: submit task without waiting
 * const { sessionID } = await sdk.submit({
 *   service: 'fal-nano-banana-pro',
 *   inputs: { prompt: 'a puppy' }
 * });
 * // Query result later
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

    // Validate runtime environment
    validateEnvironment();
  }

  /**
   * Execute task and wait for result (recommended method)
   *
   * This is the most commonly used method, submit task and wait for completion in one call
   *
   * @example
   * ```typescript
   * // Basic usage
   * const result = await sdk.run({
   *   service: 'fal-nano-banana-pro',
   *   inputs: {
   *     prompt: "a cute kitten",
   *     aspect_ratio: "1:1",
   *     resolution: "2K"
   *   }
   * });
   *
   * // With progress callback
   * const result = await sdk.run(
   *   {
   *     service: 'fal-nano-banana-pro',
   *     inputs: { prompt: "a kitten" }
   *   },
   *   {
   *     onProgress: (progress) => {
   *       console.log(`Progress: ${progress}%`);
   *     }
   *   }
   * );
   * ```
   */
  async run<T = any>(request: SubmitTaskRequest, options?: RunOptions): Promise<TaskResult<T>> {
    const submitResponse = await this.submitTask(request);

    if (!submitResponse.success) {
      throw new TaskSubmitError('Task submission failed');
    }

    const result = await this.waitForResult<T>(
      submitResponse.sessionID,
      request.service,
      options?.onProgress
    );
    return result;
  }

  /**
   * Submit task only, without waiting for result
   *
   * Suitable for scenarios where you need to batch submit multiple tasks or want asynchronous processing
   *
   * @example
   * ```typescript
   * // Batch submission
   * const tasks = await Promise.all([
   *   sdk.submit({ service: 'fal-nano-banana-pro', inputs: { prompt: 'kitten' } }),
   *   sdk.submit({ service: 'fal-nano-banana-pro', inputs: { prompt: 'puppy' } }),
   * ]);
   *
   * // Query results later
   * const results = await Promise.all(
   *   tasks.map(({ sessionID }) => sdk.waitFor('fal-nano-banana-pro', sessionID))
   * );
   * ```
   */
  async submit(request: SubmitTaskRequest): Promise<SubmitTaskResponse> {
    return this.submitTask(request);
  }

  /**
   * Wait for task with specified sessionID to complete
   *
   * Used in conjunction with submit() to wait for previously submitted tasks
   *
   * @example
   * ```typescript
   * const { sessionID } = await sdk.submit({
   *   service: 'fal-nano-banana-pro',
   *   inputs: { prompt: '...' }
   * });
   *
   * // Do other things...
   *
   * // Wait for result later
   * const result = await sdk.waitFor('fal-nano-banana-pro', sessionID, {
   *   onProgress: (progress) => console.log(`Progress: ${progress}%`)
   * });
   * ```
   */
  async waitFor<T = any>(service: string, sessionID: string, options?: RunOptions): Promise<TaskResult<T>> {
    return this.waitForResult<T>(sessionID, service, options?.onProgress);
  }

  /**
   * Get task status directly (without waiting)
   *
   * Used for manual task status polling, not recommended, use run() or waitFor() instead
   *
   * @example
   * ```typescript
   * const status = await sdk.getTaskStatus('fal-nano-banana-pro', sessionID);
   * if (status.state === 'completed') {
   *   console.log(status.data);
   * } else if (status.state === 'processing') {
   *   console.log('Task processing...');
   * }
   * ```
   */
  async getTaskStatus<T = any>(service: string, sessionID: string): Promise<TaskResultResponse<T>> {
    return this.checkTaskStatus<T>(sessionID, service);
  }

  /**
   * Upload file
   *
   * Automatically selects single file upload or multipart upload based on file size
   *
   * @example
   * ```typescript
   * // Browser environment
   * const file = document.querySelector('input[type="file"]').files[0];
   * const downloadUrl = await sdk.uploadFile(file, {
   *   onProgress: (progress) => {
   *     if (typeof progress === 'number') {
   *       console.log(`Upload progress: ${progress}%`);
   *     } else {
   *       console.log(`Uploaded: ${progress.uploadedChunks}/${progress.totalChunks} chunks`);
   *     }
   *   }
   * });
   *
   * // Node.js environment
   * import fs from 'fs';
   * const fileBuffer = fs.readFileSync('path/to/file.jpg');
   * const file = new Blob([fileBuffer], { type: 'image/jpeg' });
   * const downloadUrl = await sdk.uploadFile(file, 'image.jpg');
   * ```
   */
  async uploadFile(
    file: Blob | Buffer,
    fileNameOrOptions?: string | UploadOptions,
    options?: UploadOptions
  ): Promise<string> {
    let fileName: string;
    let uploadOptions: UploadOptions | undefined;

    // Handle parameter overload
    if (typeof fileNameOrOptions === 'string') {
      fileName = fileNameOrOptions;
      uploadOptions = options;
    } else {
      // If no file name provided, try to get from File object
      if (file instanceof File) {
        fileName = file.name;
      } else {
        fileName = 'file.bin';
      }
      uploadOptions = fileNameOrOptions;
    }

    // If it's a Buffer, convert to Blob
    let blob: Blob;
    if (Buffer.isBuffer(file)) {
      blob = new Blob([new Uint8Array(file)], { type: 'application/octet-stream' });
    } else {
      blob = file;
    }

    const multipartThreshold = uploadOptions?.multipartThreshold || 5 * 1024 * 1024;

    if (shouldUseMultipartUpload(blob.size, multipartThreshold)) {
      // Use multipart upload for large files
      const uploader = new MultipartUploader(
        blob,
        fileName,
        this.baseUrl,
        this.token,
        uploadOptions
      );
      const result = await uploader.upload();
      return result.downloadURL;
    } else {
      // Use single file upload for small files
      const uploader = new SingleFileUploader(
        blob,
        fileName,
        this.baseUrl,
        this.token,
        uploadOptions
      );
      return await uploader.upload();
    }
  }

  /**
   * Submit task (internal method)
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
          `Task submission failed: ${errorText}`,
          response.status,
          errorText
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof TaskSubmitError) {
        throw error;
      }
      throw new NetworkError('Network request failed', error as Error);
    }
  }

  /**
   * Wait for task completion (internal automatic polling)
   */
  private async waitForResult<T = any>(
    sessionID: string,
    service: string,
    onProgress?: ProgressCallback
  ): Promise<TaskResult<T>> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const poll = async () => {
        // Check if timeout
        if (Date.now() - startTime > this.timeout) {
          const error = new TaskTimeoutError(sessionID, service, this.timeout);
          reject(error);
          return;
        }

        try {
          const result = await this.checkTaskStatus<T>(sessionID, service);

          // Emit progress callback
          if (onProgress && result.progress !== undefined) {
            onProgress(result.progress);
          }

          if (result.state === 'completed') {
            if (!result.data) {
              throw new TaskFailedError('Task completed but no data returned', sessionID, service, result.state);
            }

            const finalResult: TaskResult<T> = {
              data: result.data,
              sessionID,
              service,
            };

            // Ensure progress is 100% when completed
            if (onProgress) {
              onProgress(100);
            }

            resolve(finalResult);
          } else if (result.state === 'failed' || result.state === 'error') {
            const error = new TaskFailedError(
              result.error || `Task failed: ${result.state}`,
              sessionID,
              service,
              result.state
            );
            reject(error);
          } else {
            // Task still processing, continue polling
            setTimeout(poll, this.pollingInterval);
          }
        } catch (error) {
          reject(error);
        }
      };

      // Start polling
      poll();
    });
  }

  /**
   * Check task status (internal method)
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
        throw new NetworkError(`Failed to get task status: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof NetworkError) {
        throw error;
      }
      throw new NetworkError('Network request failed', error as Error);
    }
  }
}

export default OomolFusionSDK;

// Export all types
export * from './types';
export * from './errors';
export * from './utils';
export * from './uploader';
