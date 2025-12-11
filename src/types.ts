/**
 * Task state
 */
export type TaskState = 'pending' | 'processing' | 'completed' | 'failed' | 'error';

/**
 * Task submission request parameters
 */
export interface SubmitTaskRequest {
  /** Service name, e.g.: 'fal-nano-banana-pro' */
  service: string;
  /** Task input parameters (dynamic type, varies by service) */
  inputs: Record<string, any>;
}

/**
 * Task submission response
 */
export interface SubmitTaskResponse {
  /** Session ID */
  sessionID: string;
  /** Whether submission was successful */
  success: boolean;
}

/**
 * Task result response
 */
export interface TaskResultResponse<T = any> {
  /** Task state */
  state: TaskState;
  /** Task data (dynamic type, varies by service) */
  data?: T;
  /** Error message */
  error?: string;
  /** Progress percentage (0-100) */
  progress?: number;
}

/**
 * Task execution result
 */
export interface TaskResult<T = any> {
  /** Task result data */
  data: T;
  /** Session ID */
  sessionID: string;
  /** Service name */
  service: string;
}

/**
 * Progress callback function
 */
export type ProgressCallback = (progress: number) => void;

/**
 * Run options
 */
export interface RunOptions {
  /** Progress callback function */
  onProgress?: ProgressCallback;
}

/**
 * SDK configuration options
 */
export interface OomolFusionSDKOptions {
  /** OOMOL token */
  token: string;
  /** API base URL, default: https://fusion-api.oomol.com/v1 */
  baseUrl?: string;
  /** Polling interval (milliseconds), default: 2000 */
  pollingInterval?: number;
  /** Timeout (milliseconds), default: 300000 (5 minutes) */
  timeout?: number;
}

/**
 * File chunk interface
 */
export interface FileChunk {
  /** Chunk index (starting from 1) */
  index: number;
  /** Chunk start position */
  start: number;
  /** Chunk end position */
  end: number;
  /** Chunk size */
  size: number;
  /** Chunk data */
  data: ArrayBuffer;
}

/**
 * Upload progress information
 */
export interface UploadProgress {
  /** Uploaded bytes */
  uploadedBytes: number;
  /** Total bytes */
  totalBytes: number;
  /** Upload percentage (0-100) */
  percentage: number;
  /** Uploaded chunks */
  uploadedChunks: number;
  /** Total chunks */
  totalChunks: number;
}

/**
 * Multipart upload result
 */
export interface MultipartUploadResult {
  /** File download URL */
  downloadURL: string;
  /** Upload ID */
  uploadID: string;
  /** File key */
  key: string;
}

/**
 * Presigned URL response
 */
export interface PresignedUrlResponse {
  /** Part number */
  partNumber: number;
  /** Upload URL */
  uploadURL: string;
}

/**
 * Create multipart upload response
 */
export interface CreateMultipartUploadResponse {
  data: {
    /** Upload ID */
    uploadID: string;
    /** File key */
    key: string;
    /** Part size */
    partSize: number;
  };
}

/**
 * Generate presigned URLs response
 */
export interface GeneratePresignedUrlsResponse {
  data: PresignedUrlResponse[];
}

/**
 * Complete multipart upload response
 */
export interface CompleteMultipartUploadResponse {
  data: {
    /** File download URL */
    downloadURL: string;
  };
}

/**
 * Single file upload initialization response
 */
export interface InitUploadResponse {
  data: {
    /** Upload URL */
    uploadURL: string;
    /** Download URL */
    downloadURL: string;
    /** Form fields */
    fields: Record<string, string>;
  };
}

/**
 * Upload progress callback function
 */
export type UploadProgressCallback = (progress: UploadProgress | number) => void;

/**
 * Upload options
 */
export interface UploadOptions {
  /** Progress callback function */
  onProgress?: UploadProgressCallback;
  /** Maximum concurrent uploads, default: 3 */
  maxConcurrentUploads?: number;
  /** Multipart upload threshold (bytes), default: 5MB */
  multipartThreshold?: number;
  /** Upload retry count on failure, default: 3 */
  retries?: number;
}
