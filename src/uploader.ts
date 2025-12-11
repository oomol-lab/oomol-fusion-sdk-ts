import {
  FileChunk,
  UploadProgress,
  MultipartUploadResult,
  PresignedUrlResponse,
  CreateMultipartUploadResponse,
  GeneratePresignedUrlsResponse,
  CompleteMultipartUploadResponse,
  InitUploadResponse,
  UploadProgressCallback,
  UploadOptions,
} from './types';
import {
  FileUploadError,
  FileTooLargeError,
} from './errors';

/**
 * Multipart upload configuration constants
 */
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const DEFAULT_MAX_CONCURRENT_UPLOADS = 3;
const DEFAULT_MULTIPART_THRESHOLD = 5 * 1024 * 1024; // 5MB
const DEFAULT_RETRIES = 3;

/**
 * Multipart uploader class
 */
export class MultipartUploader {
  private file: Blob;
  private fileName: string;
  private fileSuffix: string;
  private apiBaseUrl: string;
  private authToken: string;
  private onProgress?: UploadProgressCallback;
  private maxConcurrentUploads: number;

  constructor(
    file: Blob,
    fileName: string,
    apiBaseUrl: string,
    authToken: string,
    options?: UploadOptions
  ) {
    this.file = file;
    this.fileName = fileName;
    this.fileSuffix = this.getFileSuffix(fileName);
    this.apiBaseUrl = apiBaseUrl;
    this.authToken = authToken;
    this.onProgress = options?.onProgress;
    this.maxConcurrentUploads = options?.maxConcurrentUploads || DEFAULT_MAX_CONCURRENT_UPLOADS;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new FileTooLargeError(file.size, MAX_FILE_SIZE);
    }
  }

  /**
   * Get file suffix/extension
   */
  private getFileSuffix(fileName: string): string {
    const parts = fileName.split('.');
    const suffix = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';

    // List of file types supported by API
    const supportedTypes = [
      'png', 'jpg', 'jpeg', 'gif', 'webp',
      'mp3', 'mp4',
      'txt', 'epub', 'pdf', 'md',
      'docx', 'xlsx', 'pptx',
      'csv', 'json', 'zip'
    ];

    // Return the suffix if it's in the supported list, otherwise return 'txt' as default
    return supportedTypes.includes(suffix) ? suffix : 'txt';
  }

  /**
   * Send API request
   */
  private async makeRequest(
    endpoint: string,
    body: unknown,
    method = 'POST'
  ): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const response = await fetch(`${this.apiBaseUrl}/${endpoint}`, {
      method,
      headers,
      body: JSON.stringify(body),
    });

    return response;
  }

  /**
   * Slice file into chunks of specified size
   */
  private async sliceFile(chunkSize: number): Promise<FileChunk[]> {
    const chunks: FileChunk[] = [];
    const totalSize = this.file.size;

    for (let i = 0; i < totalSize; i += chunkSize) {
      const start = i;
      const end = Math.min(i + chunkSize, totalSize);
      const size = end - start;

      const blob = this.file.slice(start, end);
      const data = await blob.arrayBuffer();

      chunks.push({
        index: Math.floor(i / chunkSize) + 1,
        start,
        end,
        size,
        data,
      });
    }

    return chunks;
  }

  /**
   * Upload a single chunk
   */
  private async uploadChunk(
    chunk: FileChunk,
    uploadURL: string
  ): Promise<{ partNumber: number; etag: string }> {
    try {
      const response = await fetch(uploadURL, {
        method: 'PUT',
        body: chunk.data,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': chunk.size.toString(),
        },
      });

      if (!response.ok) {
        throw new FileUploadError(
          `Chunk upload failed: ${response.status}`,
          response.status
        );
      }

      const etag = response.headers.get('etag');
      if (!etag) {
        throw new FileUploadError('ETag not returned in upload response');
      }

      return {
        partNumber: chunk.index,
        etag: etag.replace(/"/g, ''),
      };
    } catch (error) {
      throw new FileUploadError(
        `Chunk ${chunk.index} upload failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Upload multiple chunks concurrently
   */
  private async uploadChunksConcurrently(
    chunks: FileChunk[],
    presignedUrls: PresignedUrlResponse[]
  ): Promise<Array<{ partNumber: number; etag: string }>> {
    const results: Array<{ partNumber: number; etag: string }> = [];
    let uploadedBytes = 0;
    const totalBytes = this.file.size;

    const sortedUrls = presignedUrls.sort((a, b) => a.partNumber - b.partNumber);

    for (let i = 0; i < chunks.length; i += this.maxConcurrentUploads) {
      const batch = chunks.slice(i, i + this.maxConcurrentUploads);
      const urlBatch = sortedUrls.slice(i, i + this.maxConcurrentUploads);

      const uploadPromises = batch.map((chunk, index) =>
        this.uploadChunk(chunk, urlBatch[index].uploadURL)
      );

      try {
        const batchResults = await Promise.all(uploadPromises);
        results.push(...batchResults);

        const batchUploadedBytes = batch.reduce((sum, chunk) => sum + chunk.size, 0);
        uploadedBytes += batchUploadedBytes;

        if (this.onProgress) {
          const progress: UploadProgress = {
            uploadedBytes,
            totalBytes,
            percentage: Math.round((uploadedBytes / totalBytes) * 100),
            uploadedChunks: results.length,
            totalChunks: chunks.length,
          };
          this.onProgress(progress);
        }
      } catch (error) {
        throw new FileUploadError(
          `Batch upload failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return results;
  }

  /**
   * Execute multipart upload
   */
  async upload(): Promise<MultipartUploadResult> {
    try {
      // 1. Create multipart upload
      const createResponse = await this.makeRequest(
        'file-upload/action/create-multipart-upload',
        {
          fileSuffix: this.fileSuffix,
          fileSize: this.file.size,
        }
      );

      if (!createResponse.ok) {
        const errorData = (await createResponse.json().catch(() => ({}))) as any;
        throw new FileUploadError(
          `Failed to create multipart upload: ${createResponse.status} - ${errorData.error || 'Unknown error'}`,
          createResponse.status,
          errorData
        );
      }

      const createResponseData: CreateMultipartUploadResponse =
        await createResponse.json();
      const createResult = createResponseData.data;

      // 2. Slice file
      const chunks = await this.sliceFile(createResult.partSize);

      // 3. Generate presigned URLs
      const partNumbers = chunks.map((chunk) => chunk.index);
      const urlsResponse = await this.makeRequest(
        'file-upload/action/generate-presigned-urls',
        {
          uploadID: createResult.uploadID,
          key: createResult.key,
          partNumbers,
        }
      );

      if (!urlsResponse.ok) {
        const errorData = (await urlsResponse.json().catch(() => ({}))) as any;
        throw new FileUploadError(
          `Failed to generate presigned URLs: ${urlsResponse.status} - ${errorData.error || 'Unknown error'}`,
          urlsResponse.status,
          errorData
        );
      }

      const presignedUrlsResponse: GeneratePresignedUrlsResponse =
        await urlsResponse.json();
      const presignedUrls = presignedUrlsResponse.data;

      // 4. Upload chunks
      const uploadedParts = await this.uploadChunksConcurrently(
        chunks,
        presignedUrls
      );

      // 5. Complete upload
      const completeResponse = await this.makeRequest(
        'file-upload/action/complete-multipart-upload',
        {
          uploadID: createResult.uploadID,
          key: createResult.key,
          parts: uploadedParts,
        }
      );

      if (!completeResponse.ok) {
        throw new FileUploadError(
          `Failed to complete upload: ${completeResponse.status}`,
          completeResponse.status
        );
      }

      const completeResponseData: CompleteMultipartUploadResponse =
        await completeResponse.json();
      const completeResult = completeResponseData.data;

      return {
        downloadURL: completeResult.downloadURL,
        uploadID: createResult.uploadID,
        key: createResult.key,
      };
    } catch (error) {
      if (error instanceof FileUploadError || error instanceof FileTooLargeError) {
        throw error;
      }
      throw new FileUploadError(
        `Multipart upload failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

/**
 * Single file uploader
 */
export class SingleFileUploader {
  private file: Blob;
  private fileName: string;
  private fileSuffix: string;
  private apiBaseUrl: string;
  private authToken: string;
  private onProgress?: UploadProgressCallback;
  private retries: number;

  constructor(
    file: Blob,
    fileName: string,
    apiBaseUrl: string,
    authToken: string,
    options?: UploadOptions
  ) {
    this.file = file;
    this.fileName = fileName;
    this.fileSuffix = this.getFileSuffix(fileName);
    this.apiBaseUrl = apiBaseUrl;
    this.authToken = authToken;
    this.onProgress = options?.onProgress;
    this.retries = options?.retries || DEFAULT_RETRIES;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new FileTooLargeError(file.size, MAX_FILE_SIZE);
    }
  }

  /**
   * Get file suffix/extension
   */
  private getFileSuffix(fileName: string): string {
    const parts = fileName.split('.');
    const suffix = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';

    // List of file types supported by API
    const supportedTypes = [
      'png', 'jpg', 'jpeg', 'gif', 'webp',
      'mp3', 'mp4',
      'txt', 'epub', 'pdf', 'md',
      'docx', 'xlsx', 'pptx',
      'csv', 'json', 'zip'
    ];

    // Return the suffix if it's in the supported list, otherwise return 'txt' as default
    return supportedTypes.includes(suffix) ? suffix : 'txt';
  }

  /**
   * Upload file to cloud storage
   */
  private async uploadToCloud(
    uploadUrl: string,
    fields: Record<string, string>
  ): Promise<void> {
    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const formData = new FormData();

        Object.entries(fields).forEach(([key, value]) => {
          formData.append(key, value);
        });

        // Set correct Content-Type based on file suffix
        const contentType = this.getContentType(this.fileSuffix);
        const blob = new Blob([this.file], { type: contentType });
        formData.append('file', blob, this.fileName);

        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new FileUploadError(
            `Upload failed: ${response.status} - ${errorText}`,
            response.status,
            errorText
          );
        }

        if (this.onProgress) {
          this.onProgress(100);
        }
        return;
      } catch (error) {
        if (attempt === this.retries) {
          throw new FileUploadError(
            `File upload failed after ${this.retries} retries: ${error instanceof Error ? error.message : String(error)}`
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  /**
   * Get Content-Type based on file suffix
   */
  private getContentType(suffix: string): string {
    const contentTypes: Record<string, string> = {
      // Images
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'webp': 'image/webp',
      // Audio/Video
      'mp3': 'audio/mpeg',
      'mp4': 'video/mp4',
      // Documents
      'txt': 'text/plain',
      'md': 'text/markdown',
      'pdf': 'application/pdf',
      'epub': 'application/epub+zip',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Data
      'csv': 'text/csv',
      'json': 'application/json',
      'zip': 'application/zip',
    };

    return contentTypes[suffix] || 'application/octet-stream';
  }

  /**
   * Execute single file upload
   */
  async upload(): Promise<string> {
    try {
      // 1. Get presigned upload URL
      const initResponse = await fetch(
        `${this.apiBaseUrl}/file-upload/action/generate-presigned-url`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileSuffix: this.fileSuffix,
          }),
        }
      );

      if (!initResponse.ok) {
        throw new FileUploadError(
          `Failed to initialize upload: ${initResponse.status} ${initResponse.statusText}`,
          initResponse.status
        );
      }

      const initData: InitUploadResponse = await initResponse.json();
      const { uploadURL, downloadURL, fields } = initData.data;

      if (!uploadURL || !downloadURL || !fields) {
        throw new FileUploadError('Invalid API response: missing uploadURL, downloadURL or fields');
      }

      // 2. Upload file to cloud storage
      await this.uploadToCloud(uploadURL, fields);

      return downloadURL;
    } catch (error) {
      if (error instanceof FileUploadError || error instanceof FileTooLargeError) {
        throw error;
      }
      throw new FileUploadError(
        `File upload failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

/**
 * Check if file should use multipart upload
 */
export function shouldUseMultipartUpload(
  fileSize: number,
  threshold: number = DEFAULT_MULTIPART_THRESHOLD
): boolean {
  return fileSize > threshold;
}
