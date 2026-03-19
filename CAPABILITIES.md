# Capabilities

## Primary API Shapes

- Async task services: `submit`, `state`, `result`, `wait`, `run`, `waitData`, `runData`
- Action services: grouped methods under `client.<service>.<action>()`
- Raw escape hatch: `client.request()`

## Recommended Call Paths

- Image/audio/video/document generation or conversion: `runData()`
- Long-running workflows needing manual orchestration: `submit()` then `waitData()`
- Synchronous utility endpoints: grouped action methods
- Unmodeled future endpoints: `request()`

## Built-in Task Services

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

## Built-in Action Groups

- `client.customFinancialFundamentalReport`
- `client.doubaoTextToImageSeedream`
- `client.textToEpubIllustrate`
- `client.jinaReader`
- `client.tinifyPngShrink`
- `client.fileUpload`
- `client.qwenImageEditPlus`
- `client.qwenDocTurbo`

## Error Contract

Normalized AI-facing error fields:

- `code`
- `message`
- `status`
- `retryable`
- `details`

Use `OomolFusionSdkError.fromUnknown(error)` to normalize thrown errors.
