# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-12-11

### Added

#### File Upload API

New `uploadFile()` method for smart file uploads to OOMOL cloud storage:

```typescript
async uploadFile(
  file: Blob | Buffer,
  fileNameOrOptions?: string | UploadOptions,
  options?: UploadOptions
): Promise<string>
```

**Key Features:**
- 🎯 **Smart Strategy**: Automatically selects single or multipart upload
  - Files < 5MB: Single file upload
  - Files ≥ 5MB: Multipart upload (with concurrency)
- 📊 **Real-time Progress**: Progress callbacks for upload percentage and chunk progress
- 🚀 **Concurrent Upload**: Multipart uploads support concurrency (default: 3)
- 🔄 **Auto Retry**: Automatic retries on failure (default: 3)
- 📦 **File Types**: Supports 17 file types with automatic Content-Type mapping
- 🛡️ **Error Handling**: Comprehensive error handling

**Supported File Types:**
- Images: `png`, `jpg`, `jpeg`, `gif`, `webp`
- Audio/Video: `mp3`, `mp4`
- Documents: `txt`, `md`, `pdf`, `epub`, `docx`, `xlsx`, `pptx`
- Data: `csv`, `json`, `zip`

#### New Types

```typescript
interface UploadOptions {
  onProgress?: UploadProgressCallback;
  maxConcurrentUploads?: number;      // Default: 3
  multipartThreshold?: number;        // Default: 5MB
  retries?: number;                   // Default: 3
}

interface UploadProgress {
  uploadedBytes: number;
  totalBytes: number;
  percentage: number;
  uploadedChunks: number;
  totalChunks: number;
}

type UploadProgressCallback = (progress: UploadProgress | number) => void;
```

#### New Error Classes

- `FileUploadError` - File upload failed
- `FileTooLargeError` - File size exceeds limit (max 500MB)

### Examples

```typescript
// Basic usage
const downloadUrl = await sdk.uploadFile(fileBuffer, 'document.pdf');

// With progress callback
const downloadUrl = await sdk.uploadFile(fileBuffer, 'video.mp4', {
  onProgress: (progress) => {
    if (typeof progress === 'number') {
      console.log(`Upload progress: ${progress}%`);
    } else {
      console.log(`Uploaded ${progress.uploadedChunks}/${progress.totalChunks} chunks`);
    }
  }
});

// Custom configuration
const downloadUrl = await sdk.uploadFile(fileBuffer, 'large-file.zip', {
  multipartThreshold: 10 * 1024 * 1024,  // 10MB threshold
  maxConcurrentUploads: 5,                // 5 concurrent uploads
  retries: 3                              // Retry 3 times
});
```

---

## [1.0.0] - 2024-12-09

### Added

- ✨ Initial release
- 🌐 Support for calling any OOMOL Fusion service
- 🚀 Simple async/await API
- 🔄 Automatic polling mechanism
- 🎯 Full TypeScript support
- 🛡️ Comprehensive error handling
- 🔧 Highly configurable (polling interval, timeout, etc.)

### API Methods

- `run()` - Execute task and wait for result (recommended)
- `submit()` - Submit task without waiting
- `waitFor()` - Wait for specific task to complete
- `getTaskStatus()` - Get task status

### Error Types

- `TaskSubmitError` - Task submission error
- `TaskTimeoutError` - Task timeout error
- `TaskFailedError` - Task execution failed
- `NetworkError` - Network request error
