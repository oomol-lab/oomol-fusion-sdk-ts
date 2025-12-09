# OOMOL Fusion SDK

[中文文档](./README.zh-CN.md)

An elegant TypeScript/JavaScript SDK for interacting with the OOMOL Fusion API. A **universal Fusion service client** that supports calling any Fusion service. **No manual polling required** - the SDK handles all asynchronous operations internally.

## ✨ Features

- 🌐 **Universal Service Support**: Call any OOMOL Fusion service
- 🚀 **Simple & Easy**: Modern async/await API following JavaScript best practices
- 🔄 **Auto Polling**: No manual polling needed, SDK handles it internally
- 📊 **Real-time Progress**: Progress callbacks to track task status
- 🎯 **TypeScript Support**: Full type definitions
- 🛡️ **Robust Error Handling**: Multiple custom error types for precise error handling
- ⏱️ **Cancellable Tasks**: Cancel ongoing tasks anytime
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

#### `cancel(sessionID)`

Cancel an ongoing task.

```typescript
sdk.cancel(sessionID);
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

### Error Handling

```typescript
import { TaskTimeoutError, TaskFailedError } from 'oomol-fusion-sdk';

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
- `TaskCancelledError` - Task was cancelled
- `TaskFailedError` - Task execution failed
- `NetworkError` - Network request failed

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
