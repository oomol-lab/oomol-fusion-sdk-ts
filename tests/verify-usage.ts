import { FusionClient } from "../src/index.js";
import type {
  FalRemoveBackgroundResult,
  ImageTranslateResultSessionID200Response,
  MangaZipTranslateResultSessionID200Response,
  WanxImageSubmitPostRequest,
} from "../src/generated/openapi-types.js";
import { OomolFusionSdkError } from "../src/api-error.js";

const client = new FusionClient({
  apiKey: "test-token",
});

const removeBackgroundResult: Promise<FalRemoveBackgroundResult> =
  client.falRemoveBackground.runData({
    imageURL: "https://example.com/photo.jpg",
  });

const imageTranslateResult: Promise<ImageTranslateResultSessionID200Response> =
  client.imageTranslate.waitData("session-id");

const mangaTranslateResult: Promise<MangaZipTranslateResultSessionID200Response> =
  client.mangaZipTranslate.runData({
    zip_url: "https://example.com/manga.zip",
    config: {
      translator: {
        target_lang: "ENG",
        oomol_token: "oomol-token",
      },
    },
  });

const wanxSubmitPayload: WanxImageSubmitPostRequest = {
  prompt: "a cat with a hat",
  mode: "image-edit",
};

const wanxRun = client.wanxImage.run(wanxSubmitPayload);
const readerSearch = client.jinaReader.search({
  content: "fusion api",
  jsonResponse: true,
});

void removeBackgroundResult;
void imageTranslateResult;
void mangaTranslateResult;
void wanxRun;
void readerSearch;

const normalized = OomolFusionSdkError.fromUnknown(new Error("network failure"));
const retryable: boolean = normalized.retryable;
void retryable;
