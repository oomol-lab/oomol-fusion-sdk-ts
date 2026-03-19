# AGENT_GUIDE

This guide is optimized for coding agents and tool-using LLMs.

## Default Rules

- Initialize with `FusionClient`.
- Prefer grouped service methods over raw path calls.
- For async task endpoints, prefer `runData()`.
- If submit/wait separation is needed, use `submit()` then `waitData()`.
- For action endpoints, prefer `client.<service>.<action>()`.
- Use `client.request()` only when the endpoint is not modeled yet.

## Initialization

```ts
import { FusionClient } from "oomol-fusion-sdk";

const client = new FusionClient({
  apiKey: process.env.FUSION_API_KEY,
});
```

## Preferred Task Pattern

```ts
const result = await client.falRemoveBackground.runData({
  imageURL: "https://example.com/photo.jpg",
});
```

## Preferred Action Pattern

```ts
const result = await client.jinaReader.read({
  URL: "https://example.com/article",
  format: "markdown",
});
```

## When To Use `run()` vs `runData()`

- Use `runData()` by default.
- Use `run()` only if you explicitly need the raw completed response shape.

## Error Handling

Always normalize unknown errors:

```ts
import { OomolFusionSdkError } from "oomol-fusion-sdk";

try {
  const result = await client.doubaoTts.runData({
    text: "hello",
    voice: "zh_female_vv_uranus_bigtts",
  });
} catch (error) {
  const sdkError = OomolFusionSdkError.fromUnknown(error);

  if (sdkError.retryable) {
    // retry or ask for retry
  } else {
    // surface the normalized error
  }
}
```

Normalized fields:

- `code`
- `message`
- `status`
- `retryable`
- `details`

## New Endpoint Strategy

If the backend adds a new endpoint before the SDK updates:

```ts
const response = await client.request({
  method: "POST",
  path: "/v1/new-service/submit",
  body: {
    prompt: "hello",
  },
});
```

If compile-time typing is needed:

- import raw generated types from `oomol-fusion-sdk/openapi-types`
- or augment `oomol-fusion-sdk/types`

## Regeneration

If the OpenAPI snapshot changes:

```bash
npm run check
```

Source of truth:

- `openapi.full.snapshot.json`
