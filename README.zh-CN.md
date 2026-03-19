# oomol-fusion-sdk

Fusion API 的 TypeScript SDK。

这个包围绕 Fusion API 里两种稳定接口形态设计：

- 异步任务型接口：`submit -> state/result`
- 动作型接口：`/action/{name}`

同时它还提供：

- 按服务分组的快捷调用，例如 `client.doubaoTts.runData(...)`
- 自动生成的原始 OpenAPI 类型
- 面向 AI/agent 的文档和统一错误模型

## 安装

```bash
npm install oomol-fusion-sdk
```

运行要求：

- Node.js 18+
- 需要全局 `fetch`，或者在 client options 里传入自定义实现

## 初始化

```ts
import { FusionClient } from "oomol-fusion-sdk";

const client = new FusionClient({
  apiKey: process.env.FUSION_API_KEY,
});
```

支持的初始化参数：

- `apiKey?: string`
- `token?: string`
- `baseUrl?: string`
- `fetch?: typeof fetch`
- `defaultHeaders?: Record<string, string>`
- `pollIntervalMs?: number`
- `timeoutMs?: number`

带 `baseUrl` 的示例：

```ts
const client = new FusionClient({
  apiKey: process.env.FUSION_API_KEY,
  baseUrl: "https://fusion-api.oomol.com",
  pollIntervalMs: 2000,
  timeoutMs: 300000,
});
```

默认值：

- `baseUrl`: `https://fusion-api.oomol.com`
- `pollIntervalMs`: `2000`
- `timeoutMs`: `300000`

## 推荐调用方式

如果没有特殊原因，建议按下面的规则使用：

- 任务型接口优先用 `runData()`
- 需要拆成提交和等待时，用 `submit()` + `waitData()`
- action 接口优先用 `client.<service>.<action>()`
- SDK 还没建模的新接口，用 `client.request(...)`

## 快速开始

任务型示例：

```ts
const audio = await client.doubaoTts.runData({
  text: "Hello from Fusion SDK",
  voice: "zh_female_vv_uranus_bigtts",
});

console.log(audio);
```

action 示例：

```ts
const page = await client.jinaReader.read({
  URL: "https://example.com/article",
  format: "markdown",
});

console.log(page.data);
```

## 任务接口

所有异步任务型服务都支持同一套方法：

- `submit(payload)`
- `state(sessionID)`
- `result(sessionID)`
- `wait(sessionID, options)`
- `run(payload, options)`
- `waitData(sessionID, options)`
- `runData(payload, options)`

示例：

```ts
const { sessionID } = await client.pdfTransformMarkdown.submit({
  pdfURL: "https://example.com/book.pdf",
});

const markdown = await client.pdfTransformMarkdown.waitData(sessionID);
console.log(markdown);
```

### `run()` 和 `runData()` 的区别

- `run()` 返回任务完成时的完整响应结构
- `runData()` 直接返回结果载荷

你们的 Fusion API 完成态结果并不完全一致。有些接口返回：

```ts
{ success, state, data }
```

有些接口直接返回结果对象。

SDK 的 `waitData()` 和 `runData()` 已经把这两种情况统一处理好了，所以大多数场景优先用它们。

## 内置服务快捷入口

内置任务服务：

- `client.doubaoTts`
- `client.doubaoStt`
- `client.oomolTts`
- `client.falRemoveBackground`
- `client.falFluxProKontext`
- `client.falAuraSr`
- `client.falSora2ImageToVideo`
- `client.falSora2TextToVideo`
- `client.falNanoBanana2`
- `client.falNanoBanana`
- `client.imageTranslate`
- `client.mangaZipTranslate`
- `client.qwenMtImage`
- `client.wanxImage`
- `client.pdfTransformEpub`
- `client.pdfTransformMarkdown`
- `client.falNanoBananaPro`
- `client.wanxKf2vVideo`
- `client.cphoneNanoBanana`

内置 action 分组：

- `client.customFinancialFundamentalReport`
- `client.doubaoTextToImageSeedream`
- `client.textToEpubIllustrate`
- `client.jinaReader`
- `client.tinifyPngShrink`
- `client.fileUpload`
- `client.qwenImageEditPlus`
- `client.qwenDocTurbo`

## Action 接口

action 接口既可以通过分组方法调用，也可以通过原始 key 调用。

分组方式：

```ts
const response = await client.qwenDocTurbo.analyze({
  text: "Product A costs 100 USD.",
  instruction: "Extract the product name and price.",
});
```

原始 key 方式：

```ts
const response = await client.action("jina-reader/search", {
  content: "Fusion API SDK",
  jsonResponse: true,
});
```

## 原始请求兜底

当后端新增了接口，但 SDK 还没更新时，可以直接用 `request()`：

```ts
const response = await client.request({
  method: "POST",
  path: "/v1/new-service/submit",
  body: {
    prompt: "hello",
  },
});
```

## 运行时扩展

如果新接口仍然符合标准任务模式：

```ts
client.registerTask("new-service");

const result = await client.task("new-service").runData({
  prompt: "hello",
});
```

如果要注册一个自定义 action 接口：

```ts
client.registerAction({
  key: "custom-service/custom-action",
  method: "POST",
  path: "/v1/custom-service/action/custom-action",
});
```

## 错误处理

SDK 提供了统一的、对 AI 更友好的错误类型：

```ts
import { OomolFusionSdkError } from "oomol-fusion-sdk";

try {
  const result = await client.doubaoTts.runData({
    text: "hello",
    voice: "zh_female_vv_uranus_bigtts",
  });
} catch (error) {
  const sdkError = OomolFusionSdkError.fromUnknown(error);

  console.log(sdkError.code);
  console.log(sdkError.message);
  console.log(sdkError.status);
  console.log(sdkError.retryable);
  console.log(sdkError.details);
}
```

统一后的字段：

- `code`
- `message`
- `status`
- `retryable`
- `details`

## 包导出

主 SDK：

```ts
import { FusionClient, OomolFusionSdkError } from "oomol-fusion-sdk";
```

自动生成的原始 OpenAPI 类型：

```ts
import type { WanxImageSubmitPostRequest } from "oomol-fusion-sdk/openapi-types";
```

类型扩展目标：

```ts
declare module "oomol-fusion-sdk/types" {
  interface FusionTaskDefinitions {
    "new-service": {
      submit: { prompt: string };
      completed: { success: true; state: "completed"; data: { output: string } };
      stateCompleted: { success: true; state: "completed" };
    };
  }
}
```

## 类型扩展

如果你希望在 SDK 内置别名还没补上之前，就先获得编译期类型提示：

```ts
import type {
  ActionResponse,
  CompletedTaskResultResponse,
  CompletedTaskStateResponse,
} from "oomol-fusion-sdk";

declare module "oomol-fusion-sdk/types" {
  interface FusionTaskDefinitions {
    "new-service": {
      submit: {
        prompt: string;
        mode?: "fast" | "quality";
      };
      completed: CompletedTaskResultResponse<{ downloadURL: string }>;
      stateCompleted: CompletedTaskStateResponse;
    };
  }

  interface FusionActionDefinitions {
    "new-service/preview": {
      method: "POST";
      request: {
        prompt: string;
      };
      response: ActionResponse<{ previewURL: string }>;
    };
  }
}
```

## 代码生成

SDK 只有一个规范源：

- `openapi.full.snapshot.json`

自动生成的文件：

- `src/services.ts`
- `src/generated/endpoints.ts`
- `src/generated/openapi-types.ts`

常用命令：

```bash
npm run generate
npm run check
```

- `npm run generate`：重新生成服务快捷入口、原始 OpenAPI 类型并构建
- `npm run check`：执行生成、构建和 compile-only 类型校验

## AI 文档

包内还提供了几份更适合 AI/agent 直接读取的文档：

- `README.ai.md`
- `CAPABILITIES.md`
- `AGENT_GUIDE.md`

## 开发说明

- 当前版本号是 `2.0.0`
- 内置服务快捷入口来自 OpenAPI 快照自动生成
- 自动生成的原始 OpenAPI 类型通过单独子路径暴露
