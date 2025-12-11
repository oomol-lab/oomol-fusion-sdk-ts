# OOMOL Fusion SDK

[English](./README.md) | 中文

一个优雅的 TypeScript/JavaScript SDK,用于与 OOMOL Fusion API 交互。**通用的 Fusion 服务客户端**,支持调用任意 Fusion 服务。**无需手动轮询**,SDK 内部自动处理所有异步操作。

## ✨ 特性

- 🌐 **通用服务支持**:可调用任意 OOMOL Fusion 服务
- 🚀 **简单易用**:使用 async/await,符合现代 JavaScript 最佳实践
- 🔄 **自动轮询**:无需手动轮询,SDK 内部自动处理
- 📊 **实时进度**:支持进度回调,实时了解任务进度
- 📤 **文件上传**:智能文件上传,大文件自动使用分段上传
- 🎯 **TypeScript 支持**:完整的类型定义
- 🛡️ **完善错误处理**:包含多种自定义错误类型,精确处理异常
- 🔧 **高度可配置**:自定义轮询间隔、超时时间等
- 🌍 **环境检测**:自动检测运行环境并提供兼容性警告
- 🧪 **测试覆盖**:包含完整的测试用例

## 📦 安装

```bash
npm install oomol-fusion-sdk
```

## 🚀 快速开始

```typescript
import OomolFusionSDK from 'oomol-fusion-sdk';

const sdk = new OomolFusionSDK({
  token: process.env.OOMOL_TOKEN,
});

// 执行任务并等待结果
const result = await sdk.run({
  service: 'fal-nano-banana-pro',
  inputs: {
    prompt: '一只可爱的小猫咪',
    aspect_ratio: '1:1',
    resolution: '2K'
  }
});

console.log(result.data);
```

## 📖 API 文档

### 构造函数

```typescript
const sdk = new OomolFusionSDK(options);
```

**选项:**

| 参数 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| `token` | `string` | ✅ | - | OOMOL 认证令牌 |
| `baseUrl` | `string` | ❌ | `https://fusion-api.oomol.com/v1` | API 基础 URL |
| `pollingInterval` | `number` | ❌ | `2000` | 轮询间隔(毫秒) |
| `timeout` | `number` | ❌ | `300000` | 超时时间(毫秒,5分钟) |

### 核心方法

#### `run(request, options?)` - 推荐使用

执行任务并等待结果。这是最常用的方法。

```typescript
// 基础用法
const result = await sdk.run({
  service: 'fal-nano-banana-pro',
  inputs: {
    prompt: '一只小猫',
    aspect_ratio: '1:1'
  }
});

// 带进度回调
const result = await sdk.run(
  {
    service: 'fal-nano-banana-pro',
    inputs: { prompt: '一只小猫' }
  },
  {
    onProgress: (progress) => {
      console.log(`进度: ${progress}%`);
      // 更新 UI 进度条
    }
  }
);
```

#### `submit(request)` - 高级用法

仅提交任务,不等待结果。适用于批量提交场景。

```typescript
const { sessionID } = await sdk.submit({
  service: 'fal-nano-banana-pro',
  inputs: { prompt: '一只小狗' }
});
```

#### `waitFor(service, sessionID, options?)` - 高级用法

等待指定任务完成。与 `submit()` 配合使用。

```typescript
const result = await sdk.waitFor('fal-nano-banana-pro', sessionID, {
  onProgress: (progress) => console.log(`进度: ${progress}%`)
});
```

#### `uploadFile(file, fileName?, options?)` - 文件上传

上传文件,大文件(>5MB)自动使用分段上传。

```typescript
// 浏览器环境
const file = document.querySelector('input[type="file"]').files[0];
const downloadUrl = await sdk.uploadFile(file, {
  onProgress: (progress) => {
    if (typeof progress === 'number') {
      console.log(`上传进度: ${progress}%`);
    } else {
      console.log(`已上传: ${progress.uploadedChunks}/${progress.totalChunks} 分片`);
    }
  }
});

// Node.js 环境
import fs from 'fs';
const fileBuffer = fs.readFileSync('image.jpg');
const downloadUrl = await sdk.uploadFile(fileBuffer, 'image.jpg');
```

## 💡 使用示例

### 基础用法

```typescript
const sdk = new OomolFusionSDK({
  token: process.env.OOMOL_TOKEN,
});

const result = await sdk.run({
  service: 'fal-nano-banana-pro',
  inputs: {
    prompt: '一只可爱的小猫咪在阳光下打哈欠',
    aspect_ratio: '1:1',
    resolution: '2K',
  }
});

console.log(result.data);
```

### 带进度回调

```typescript
const result = await sdk.run(
  {
    service: 'fal-nano-banana-pro',
    inputs: { prompt: '一只小猫' }
  },
  {
    onProgress: (progress) => {
      console.log(`当前进度: ${progress}%`);
      // 更新 UI,例如进度条
      updateProgressBar(progress);
    }
  }
);
```

### 批量生成

```typescript
const prompts = ['一只小猫', '一只小狗', '一只小兔子'];

// 并行提交所有任务
const submissions = await Promise.all(
  prompts.map(prompt => sdk.submit({
    service: 'fal-nano-banana-pro',
    inputs: { prompt }
  }))
);

// 并行等待所有结果
const results = await Promise.all(
  submissions.map(({ sessionID }) =>
    sdk.waitFor('fal-nano-banana-pro', sessionID)
  )
);
```

### 文件上传

```typescript
// 浏览器环境 - 从文件输入上传
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

const downloadUrl = await sdk.uploadFile(file, {
  onProgress: (progress) => {
    if (typeof progress === 'number') {
      console.log(`上传进度: ${progress}%`);
      // 更新进度条
      progressBar.value = progress;
    } else {
      console.log(`已上传 ${progress.uploadedChunks}/${progress.totalChunks} 分片`);
      console.log(`${(progress.uploadedBytes / 1024 / 1024).toFixed(2)}MB / ${(progress.totalBytes / 1024 / 1024).toFixed(2)}MB`);
    }
  }
});

console.log('文件已上传:', downloadUrl);

// Node.js 环境 - 从文件系统上传
import fs from 'fs';

const fileBuffer = fs.readFileSync('./documents/report.pdf');
const downloadUrl = await sdk.uploadFile(fileBuffer, 'report.pdf', {
  onProgress: (progress) => {
    if (typeof progress === 'number') {
      console.log(`上传进度: ${progress}%`);
    } else {
      console.log(`已上传 ${progress.uploadedChunks}/${progress.totalChunks} 分片`);
    }
  },
  multipartThreshold: 10 * 1024 * 1024, // 文件大于 10MB 时使用分段上传
  maxConcurrentUploads: 5, // 并发上传 5 个分片
  retries: 3 // 失败时重试 3 次
});

console.log('文件已上传:', downloadUrl);
```

### 错误处理

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
    inputs: { prompt: '测试' }
  });
} catch (error) {
  if (error instanceof TaskTimeoutError) {
    console.error('任务超时');
  } else if (error instanceof TaskFailedError) {
    console.error('任务失败:', error.message);
  }
}

// 文件上传错误处理
try {
  const downloadUrl = await sdk.uploadFile(largeFile, 'large-file.zip');
} catch (error) {
  if (error instanceof FileTooLargeError) {
    console.error('文件太大:', error.message);
    console.error(`文件大小: ${error.fileSize}, 最大: ${error.maxSize}`);
  } else if (error instanceof FileUploadError) {
    console.error('上传失败:', error.message);
  }
}
```

### TypeScript 类型

```typescript
interface MyServiceData {
  images: { url: string }[];
}

const result = await sdk.run<MyServiceData>({
  service: 'fal-nano-banana-pro',
  inputs: { prompt: '小猫' }
});

// result.data.images 现在有完整类型提示
```

## 🚨 错误类型

SDK 提供了完整的错误类型系统:

- `TaskSubmitError` - 任务提交失败
- `TaskTimeoutError` - 任务超时
- `TaskFailedError` - 任务执行失败
- `NetworkError` - 网络请求失败
- `FileUploadError` - 文件上传失败
- `FileTooLargeError` - 文件大小超出限制(最大 500MB)

## ❓ 常见问题

**如何获取 Token?**
访问 [OOMOL 官网](https://oomol.com) 注册并获取 API Token。

**如何处理超时?**
在构造函数中设置 `timeout` 选项(毫秒)。

**可以并行处理多个任务吗?**
可以,使用 `Promise.all` 配合 `submit()` 和 `waitFor()`。

## 📄 许可证

MIT

## 🔗 相关链接

- [OOMOL 官网](https://oomol.com)
- [GitHub 仓库](https://github.com/oomol-flows/oomol-fusion-sdk)
