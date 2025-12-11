# OOMOL Fusion SDK

[中文文档](./README.zh-CN.md)

An elegant TypeScript/JavaScript SDK for interacting with the OOMOL Fusion API. A **universal Fusion service client** that supports calling any Fusion service. **No manual polling required** - the SDK handles all asynchronous operations internally.

## ✨ Features

- 🌐 **Universal Service Support**: Call any OOMOL Fusion service
- 🚀 **Simple & Easy**: Modern async/await API following JavaScript best practices
- 🔄 **Auto Polling**: No manual polling needed, SDK handles it internally
- 📊 **Real-time Progress**: Progress callbacks to track task status
- 📤 **File Upload**: Smart file upload with automatic multipart support for large files
- 🎯 **TypeScript Support**: Full type definitions
- 🛡️ **Robust Error Handling**: Multiple custom error types for precise error handling
- 🔧 **Highly Configurable**: Customize polling interval, timeout, and more
- 🌍 **Environment Detection**: Auto-detects runtime environment with compatibility warnings
- 🧪 **Test Coverage**: Comprehensive test suite

## 📦 Installation

```bash
npm install oomol-fusion-sdk
```

## 🚀 Quick Start

```typescript
import OomolFusionSDK from 'oomol-fusion-sdk';

const sdk = new OomolFusionSDK({
  token: process.env.OOMOL_TOKEN,
});

// Run a task and wait for the result
const result = await sdk.run({
  service: 'fal-nano-banana-pro',
  inputs: {
    prompt: 'A cute little cat',
    aspect_ratio: '1:1',
    resolution: '2K'
  }
});

console.log(result.data);
```

## 📖 API Reference

### Constructor

```typescript
const sdk = new OomolFusionSDK(options);
```

**Options:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `token` | `string` | ✅ | - | OOMOL authentication token |
| `baseUrl` | `string` | ❌ | `https://fusion-api.oomol.com/v1` | API base URL |
| `pollingInterval` | `number` | ❌ | `2000` | Polling interval (milliseconds) |
| `timeout` | `number` | ❌ | `300000` | Timeout (milliseconds, 5 minutes) |

### Core Methods

#### `run(request, options?)` - Recommended

Execute a task and wait for the result. This is the most commonly used method.

```typescript
// Basic usage
const result = await sdk.run({
  service: 'fal-nano-banana-pro',
  inputs: {
    prompt: 'A cute cat',
    aspect_ratio: '1:1'
  }
});

// With progress callback
const result = await sdk.run(
  {
    service: 'fal-nano-banana-pro',
    inputs: { prompt: 'A cute cat' }
  },
  {
    onProgress: (progress) => {
      console.log(`Progress: ${progress}%`);
      // Update your progress bar UI
    }
  }
);
```

#### `submit(request)` - Advanced

Submit a task without waiting for the result. Useful for batch submissions.

```typescript
const { sessionID } = await sdk.submit({
  service: 'fal-nano-banana-pro',
  inputs: { prompt: 'A cute dog' }
});
```

#### `waitFor(service, sessionID, options?)` - Advanced

Wait for a specific task to complete. Use with `submit()`.

```typescript
const result = await sdk.waitFor('fal-nano-banana-pro', sessionID, {
  onProgress: (progress) => console.log(`Progress: ${progress}%`)
});
```

#### `uploadFile(file, fileName?, options?)` - File Upload

Upload files with automatic multipart support for large files (>5MB).

```typescript
// Browser environment
const file = document.querySelector('input[type="file"]').files[0];
const downloadUrl = await sdk.uploadFile(file, {
  onProgress: (progress) => {
    if (typeof progress === 'number') {
      console.log(`Upload progress: ${progress}%`);
    } else {
      console.log(`Uploaded: ${progress.uploadedChunks}/${progress.totalChunks} chunks`);
    }
  }
});

// Node.js environment
import fs from 'fs';
const fileBuffer = fs.readFileSync('image.jpg');
const downloadUrl = await sdk.uploadFile(fileBuffer, 'image.jpg');
```

## 💡 Usage Examples

### Basic Usage

```typescript
const sdk = new OomolFusionSDK({
  token: process.env.OOMOL_TOKEN,
});

const result = await sdk.run({
  service: 'fal-nano-banana-pro',
  inputs: {
    prompt: 'A cute little cat yawning in the sunlight',
    aspect_ratio: '1:1',
    resolution: '2K',
  }
});

console.log(result.data);
```

### With Progress Callback

```typescript
const result = await sdk.run(
  {
    service: 'fal-nano-banana-pro',
    inputs: { prompt: 'A cute cat' }
  },
  {
    onProgress: (progress) => {
      console.log(`Current progress: ${progress}%`);
      // Update UI, e.g., progress bar
      updateProgressBar(progress);
    }
  }
);
```

### Batch Generation

```typescript
const prompts = ['A cute cat', 'A cute dog', 'A cute rabbit'];

// Submit all tasks in parallel
const submissions = await Promise.all(
  prompts.map(prompt => sdk.submit({
    service: 'fal-nano-banana-pro',
    inputs: { prompt }
  }))
);

// Wait for all results in parallel
const results = await Promise.all(
  submissions.map(({ sessionID }) =>
    sdk.waitFor('fal-nano-banana-pro', sessionID)
  )
);
```

### File Upload

```typescript
// Browser environment - upload from file input
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

const downloadUrl = await sdk.uploadFile(file, {
  onProgress: (progress) => {
    if (typeof progress === 'number') {
      console.log(`Upload progress: ${progress}%`);
      // Update progress bar
      progressBar.value = progress;
    } else {
      console.log(`Uploaded ${progress.uploadedChunks}/${progress.totalChunks} chunks`);
      console.log(`${(progress.uploadedBytes / 1024 / 1024).toFixed(2)}MB / ${(progress.totalBytes / 1024 / 1024).toFixed(2)}MB`);
    }
  }
});

console.log('File uploaded:', downloadUrl);

// Node.js environment - upload from file system
import fs from 'fs';

const fileBuffer = fs.readFileSync('./documents/report.pdf');
const downloadUrl = await sdk.uploadFile(fileBuffer, 'report.pdf', {
  onProgress: (progress) => {
    if (typeof progress === 'number') {
      console.log(`Upload progress: ${progress}%`);
    } else {
      console.log(`Uploaded ${progress.uploadedChunks}/${progress.totalChunks} chunks`);
    }
  },
  multipartThreshold: 10 * 1024 * 1024, // Use multipart for files > 10MB
  maxConcurrentUploads: 5, // Upload 5 chunks concurrently
  retries: 3 // Retry 3 times on failure
});

console.log('File uploaded:', downloadUrl);
```

### Error Handling

```typescript
import {
  TaskTimeoutError,
  TaskFailedError,
  FileUploadError,
  FileTooLargeError
} from 'oomol-fusion-sdk';

try {
  const result = await sdk.run({
    service: 'fal-nano-banana-pro',
    inputs: { prompt: 'Test' }
  });
} catch (error) {
  if (error instanceof TaskTimeoutError) {
    console.error('Task timed out');
  } else if (error instanceof TaskFailedError) {
    console.error('Task failed:', error.message);
  }
}

// File upload error handling
try {
  const downloadUrl = await sdk.uploadFile(largeFile, 'large-file.zip');
} catch (error) {
  if (error instanceof FileTooLargeError) {
    console.error('File is too large:', error.message);
    console.error(`File size: ${error.fileSize}, Max: ${error.maxSize}`);
  } else if (error instanceof FileUploadError) {
    console.error('Upload failed:', error.message);
  }
}
```

### TypeScript Types

```typescript
interface MyServiceData {
  images: { url: string }[];
}

const result = await sdk.run<MyServiceData>({
  service: 'fal-nano-banana-pro',
  inputs: { prompt: 'A cat' }
});

// result.data.images now has full type hints
```

## 🚨 Error Types

The SDK provides a complete error type system:

- `TaskSubmitError` - Task submission failed
- `TaskTimeoutError` - Task timed out
- `TaskFailedError` - Task execution failed
- `NetworkError` - Network request failed
- `FileUploadError` - File upload failed
- `FileTooLargeError` - File size exceeds limit (max 500MB)

## ❓ FAQ

**How to get a Token?**
Visit [OOMOL Website](https://oomol.com) to register and obtain an API Token.

**How to handle timeouts?**
Set the `timeout` option (in milliseconds) in the constructor.

**Can I process multiple tasks in parallel?**
Yes, use `Promise.all` with `submit()` and `waitFor()`.

## 📄 License

MIT

## 🔗 Links

- [OOMOL Website](https://oomol.com)
- [GitHub Repository](https://github.com/oomol-flows/oomol-fusion-sdk)
