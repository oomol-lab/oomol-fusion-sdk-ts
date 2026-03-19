# oomol-fusion-sdk AI Usage

This file is optimized for AI agents and code generation tools.

## Preferred Usage

- For async task endpoints, prefer `client.<service>.runData(payload)`.
- If you need submit/wait separation, use `submit()` then `waitData(sessionID)`.
- For action endpoints, prefer grouped methods like `client.jinaReader.read(payload)`.
- Use `client.request()` only for brand new endpoints not yet modeled.

## Initialize

```ts
import { FusionClient } from "oomol-fusion-sdk";

const client = new FusionClient({
  apiKey: process.env.FUSION_API_KEY,
});
```

## Async Task Example

```ts
const image = await client.falRemoveBackground.runData({
  imageURL: "https://example.com/photo.jpg",
});
```

## Action Example

```ts
const page = await client.jinaReader.read({
  URL: "https://example.com/article",
  format: "markdown",
});
```

## Result Handling

- `run()` returns the raw completed response object.
- `runData()` returns the result payload directly.
- Some Fusion task results are wrapped in `{ success, state, data }`.
- Some Fusion task results are direct result objects.
- `runData()` and `waitData()` normalize both forms.

## Error Handling

Normalize unknown errors like this:

```ts
import { OomolFusionSdkError } from "oomol-fusion-sdk";

try {
  const result = await client.doubaoTts.runData({
    text: "hello",
    voice: "zh_female_vv_uranus_bigtts",
  });
} catch (error) {
  const sdkError = OomolFusionSdkError.fromUnknown(error);
  console.error(sdkError.code, sdkError.retryable, sdkError.message);
}
```

## Extend New APIs

Runtime:

```ts
const response = await client.request({
  method: "POST",
  path: "/v1/new-service/submit",
  body: { prompt: "hello" },
});
```

Compile-time:

- Extend `oomol-fusion-sdk/types`
- Or import generated raw types from `oomol-fusion-sdk/openapi-types`

## Regenerate SDK Artifacts

```bash
npm run check
```
