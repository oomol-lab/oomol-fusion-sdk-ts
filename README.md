# oomol-fusion-sdk

TypeScript SDK for Fusion API task and action endpoints.

This package is designed around the two stable shapes in Fusion API:

- async task endpoints: `submit -> state/result`
- action endpoints: `/action/{name}`

It also includes:

- grouped service shortcuts such as `client.doubaoTts.runData(...)`
- generated raw OpenAPI types
- AI-oriented docs and normalized error handling

## Install

```bash
npm install oomol-fusion-sdk
```

Requirements:

- Node.js 18+
- global `fetch` available, or provide one in client options

## Initialize

```ts
import { FusionClient } from "oomol-fusion-sdk";

const client = new FusionClient({
  apiKey: process.env.FUSION_API_KEY,
});
```

Available client options:

- `apiKey?: string`
- `token?: string`
- `baseUrl?: string`
- `fetch?: typeof fetch`
- `defaultHeaders?: Record<string, string>`
- `pollIntervalMs?: number`
- `timeoutMs?: number`

Example with custom `baseUrl`:

```ts
const client = new FusionClient({
  apiKey: process.env.FUSION_API_KEY,
  baseUrl: "https://fusion-api.oomol.com",
  pollIntervalMs: 2000,
  timeoutMs: 300000,
});
```

Default values:

- `baseUrl`: `https://fusion-api.oomol.com`
- `pollIntervalMs`: `2000`
- `timeoutMs`: `300000`

## Recommended Usage

Use these defaults unless you have a specific reason not to:

- task endpoints: prefer `runData()`
- split task control: use `submit()` then `waitData()`
- action endpoints: prefer grouped methods like `client.jinaReader.read(...)`
- unmodeled future endpoints: use `client.request(...)`

## Quick Start

Task example:

```ts
const audio = await client.doubaoTts.runData({
  text: "Hello from Fusion SDK",
  voice: "zh_female_vv_uranus_bigtts",
});

console.log(audio);
```

Action example:

```ts
const page = await client.jinaReader.read({
  URL: "https://example.com/article",
  format: "markdown",
});

console.log(page.data);
```

## Task APIs

Every async task service supports the same workflow methods:

- `submit(payload)`
- `state(sessionID)`
- `result(sessionID)`
- `wait(sessionID, options)`
- `run(payload, options)`
- `waitData(sessionID, options)`
- `runData(payload, options)`

Example:

```ts
const { sessionID } = await client.pdfTransformMarkdown.submit({
  pdfURL: "https://example.com/book.pdf",
});

const markdown = await client.pdfTransformMarkdown.waitData(sessionID);
console.log(markdown);
```

### `run()` vs `runData()`

- `run()` returns the completed response shape
- `runData()` returns the result payload directly

Fusion API completion responses are not perfectly uniform across all services. Some endpoints return:

```ts
{ success, state, data }
```

Some return the completed object directly.

`waitData()` and `runData()` normalize both cases and are the preferred choice for most callers.

## Built-in Service Shortcuts

Built-in task services:

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

Built-in action groups:

- `client.customFinancialFundamentalReport`
- `client.doubaoTextToImageSeedream`
- `client.textToEpubIllustrate`
- `client.jinaReader`
- `client.tinifyPngShrink`
- `client.fileUpload`
- `client.qwenImageEditPlus`
- `client.qwenDocTurbo`

## Action APIs

You can call action endpoints either by grouped shortcut or by raw action key.

Grouped shortcut:

```ts
const response = await client.qwenDocTurbo.analyze({
  text: "Product A costs 100 USD.",
  instruction: "Extract the product name and price.",
});
```

Raw action key:

```ts
const response = await client.action("jina-reader/search", {
  content: "Fusion API SDK",
  jsonResponse: true,
});
```

## Raw Request Escape Hatch

Use `request()` when the backend adds a new endpoint before the SDK model is updated:

```ts
const response = await client.request({
  method: "POST",
  path: "/v1/new-service/submit",
  body: {
    prompt: "hello",
  },
});
```

## Runtime Extension

If a new endpoint still matches the standard task shape:

```ts
client.registerTask("new-service");

const result = await client.task("new-service").runData({
  prompt: "hello",
});
```

If you need to register a custom action endpoint:

```ts
client.registerAction({
  key: "custom-service/custom-action",
  method: "POST",
  path: "/v1/custom-service/action/custom-action",
});
```

## Error Handling

The SDK exports a normalized AI-friendly error type:

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

Normalized fields:

- `code`
- `message`
- `status`
- `retryable`
- `details`

## Package Exports

Main SDK:

```ts
import { FusionClient, OomolFusionSdkError } from "oomol-fusion-sdk";
```

Generated raw OpenAPI types:

```ts
import type { WanxImageSubmitPostRequest } from "oomol-fusion-sdk/openapi-types";
```

Type augmentation target:

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

## Typed Extension

If you want compile-time types for new APIs before the SDK adds built-in aliases:

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

## Code Generation

The SDK uses one canonical OpenAPI snapshot:

- `openapi.full.snapshot.json`

Generated files:

- `src/services.ts`
- `src/generated/endpoints.ts`
- `src/generated/openapi-types.ts`

Useful commands:

```bash
npm run generate
npm run check
```

- `npm run generate`: regenerate service shortcuts, generated types, and build output
- `npm run check`: run generation, build, and compile-only type verification

## AI Docs

Additional AI-oriented docs included in the package:

- `README.ai.md`
- `CAPABILITIES.md`
- `AGENT_GUIDE.md`

## Development Notes

- This package is currently versioned as `2.0.0`
- Built-in grouped services are generated from the OpenAPI snapshot
- Generated raw OpenAPI types are intentionally exposed as a separate import path
