import type {
  CphoneNanoBananaSubmit as OpenApiCphoneNanoBananaSubmit,
  DoubaoSTTSubmit as OpenApiDoubaoSTTSubmit,
  DoubaoTextToImageSeedreamActionGeneratePostRequest,
  DoubaoTTSSubmit as OpenApiDoubaoTTSSubmit,
  FalAuraSrSubmit as OpenApiFalAuraSrSubmit,
  FalFluxProKontextSubmit as OpenApiFalFluxProKontextSubmit,
  FalNanoBanana2Submit as OpenApiFalNanoBanana2Submit,
  FalNanoBananaProSubmit as OpenApiFalNanoBananaProSubmit,
  FalNanoBananaSubmit as OpenApiFalNanoBananaSubmit,
  FalRemoveBackgroundResult as OpenApiFalRemoveBackgroundResult,
  FalRemoveBackgroundSubmit as OpenApiFalRemoveBackgroundSubmit,
  FalSora2ImageToVideoSubmit as OpenApiFalSora2ImageToVideoSubmit,
  FalSora2TextToVideoSubmit as OpenApiFalSora2TextToVideoSubmit,
  FileUploadAbortMultipartRequest as OpenApiFileUploadAbortMultipartRequest,
  FileUploadBaseRequest as OpenApiFileUploadBaseRequest,
  FileUploadCompleteMultipartRequest as OpenApiFileUploadCompleteMultipartRequest,
  FileUploadCreateMultipartRequest as OpenApiFileUploadCreateMultipartRequest,
  FileUploadPresignedUrlsRequest as OpenApiFileUploadPresignedUrlsRequest,
  ImageTranslateResultSessionID200Response,
  ImageTranslateSubmit as OpenApiImageTranslateSubmit,
  JinaReaderReadURLRequest as OpenApiJinaReaderReadURLRequest,
  JinaReaderSearchContentRequest as OpenApiJinaReaderSearchContentRequest,
  MangaZipTranslateResultSessionID200Response,
  MangaZipTranslateSubmit as OpenApiMangaZipTranslateSubmit,
  PDFTransformEpubSubmit as OpenApiPDFTransformEpubSubmit,
  PDFTransformMarkdownSubmit as OpenApiPDFTransformMarkdownSubmit,
  QwenDocTurboRequest as OpenApiQwenDocTurboRequest,
  QwenImageEditPlusRequest as OpenApiQwenImageEditPlusRequest,
  QwenMtImageSubmit as OpenApiQwenMtImageSubmit,
  TextToAudioSubmit as OpenApiTextToAudioSubmit,
  TextToEpubIllustrateActionGeneratePostRequest,
  TinifyPNGShrinkRequest as OpenApiTinifyPNGShrinkRequest,
  WanxImageSubmitPostRequest,
  WanxKf2vVideoSubmit as OpenApiWanxKf2vVideoSubmit,
} from "./generated/openapi-types.js";
import type {
  ActionEndpointConfig,
  ActionResponse,
  CompletedTaskResultResponse,
  CompletedTaskStateResponse,
  QueryParams,
} from "./types.js";
import {
  GENERATED_ACTION_ENDPOINTS,
  GENERATED_TASK_SERVICES,
} from "./generated/endpoints.js";

export type TranslatorLanguageCode =
  OpenApiImageTranslateSubmit["config"]["translator"]["target_lang"];

export type DoubaoTTSSubmit = OpenApiDoubaoTTSSubmit;
export type DoubaoSTTSubmit = OpenApiDoubaoSTTSubmit;
export type TextToAudioSubmit = OpenApiTextToAudioSubmit;
export type FalRemoveBackgroundSubmit = OpenApiFalRemoveBackgroundSubmit;
export type FalRemoveBackgroundImage = OpenApiFalRemoveBackgroundResult;
export type FalRemoveBackgroundCompletedResponse =
  OpenApiFalRemoveBackgroundResult;
export type FalFluxProKontextSubmit = OpenApiFalFluxProKontextSubmit;
export type FalAuraSrSubmit = OpenApiFalAuraSrSubmit;
export type FalSora2ImageToVideoSubmit = OpenApiFalSora2ImageToVideoSubmit;
export type FalSora2TextToVideoSubmit = OpenApiFalSora2TextToVideoSubmit;
export type FalNanoBanana2Submit = OpenApiFalNanoBanana2Submit;
export type FalNanoBananaSubmit = OpenApiFalNanoBananaSubmit;
export type ImageTranslateInput = OpenApiImageTranslateSubmit["image"];
export type ImageTranslateTranslatorConfig =
  OpenApiImageTranslateSubmit["config"]["translator"];
export type ImageTranslateSubmit = OpenApiImageTranslateSubmit;

export type ImageTranslateResultData = ImageTranslateResultSessionID200Response;

export type ImageTranslateCompletedResponse = ImageTranslateResultData;

export type MangaZipTranslateSubmit = OpenApiMangaZipTranslateSubmit;

export type MangaZipTranslateResultData =
  MangaZipTranslateResultSessionID200Response;

export type MangaZipTranslateCompletedResponse = MangaZipTranslateResultData;

export type JinaReaderReadURLRequest = OpenApiJinaReaderReadURLRequest;
export type JinaReaderSearchContentRequest =
  OpenApiJinaReaderSearchContentRequest;
export type TinifyPNGShrinkRequest = OpenApiTinifyPNGShrinkRequest;
export type QwenMtImageSubmit = OpenApiQwenMtImageSubmit;
export type FileUploadBaseRequest = OpenApiFileUploadBaseRequest;
export type FileUploadCreateMultipartRequest =
  OpenApiFileUploadCreateMultipartRequest;
export type FileUploadPresignedUrlsRequest =
  OpenApiFileUploadPresignedUrlsRequest;
export type FileUploadCompleteMultipartRequest =
  OpenApiFileUploadCompleteMultipartRequest;
export type FileUploadPart =
  OpenApiFileUploadCompleteMultipartRequest["parts"][number];
export type FileUploadAbortMultipartRequest =
  OpenApiFileUploadAbortMultipartRequest;
export type PDFTransformEpubSubmit = OpenApiPDFTransformEpubSubmit;
export type PDFTransformMarkdownSubmit = OpenApiPDFTransformMarkdownSubmit;
export type FalNanoBananaProSubmit = OpenApiFalNanoBananaProSubmit;
export type QwenImageEditPlusRequest = OpenApiQwenImageEditPlusRequest;
export type QwenDocTurboRequest = OpenApiQwenDocTurboRequest;
export type WanxKf2vVideoSubmit = OpenApiWanxKf2vVideoSubmit;
export type CphoneNanoBananaSubmit = OpenApiCphoneNanoBananaSubmit;

export type DoubaoTextToImageSeedreamGenerateRequest =
  DoubaoTextToImageSeedreamActionGeneratePostRequest;

export type TextToEpubIllustrateGenerateRequest =
  TextToEpubIllustrateActionGeneratePostRequest;

export type WanxImageSubmit = WanxImageSubmitPostRequest;

export type GenericActionRequest = QueryParams;

declare module "./types.js" {
  interface FusionTaskDefinitions {
    "doubao-tts": {
      submit: DoubaoTTSSubmit;
      completed: CompletedTaskResultResponse<Record<string, unknown>>;
      stateCompleted: CompletedTaskStateResponse;
    };
    "doubao-stt": {
      submit: DoubaoSTTSubmit;
      completed: CompletedTaskResultResponse<Record<string, unknown>>;
      stateCompleted: CompletedTaskStateResponse;
    };
    "oomol-tts": {
      submit: TextToAudioSubmit;
      completed: CompletedTaskResultResponse<Record<string, unknown>>;
      stateCompleted: CompletedTaskStateResponse;
    };
    "fal-remove-background": {
      submit: FalRemoveBackgroundSubmit;
      completed: FalRemoveBackgroundCompletedResponse;
      stateCompleted: CompletedTaskStateResponse;
    };
    "fal-flux-pro-kontext": {
      submit: FalFluxProKontextSubmit;
      completed: CompletedTaskResultResponse<Record<string, unknown>>;
      stateCompleted: CompletedTaskStateResponse;
    };
    "fal-aura-sr": {
      submit: FalAuraSrSubmit;
      completed: CompletedTaskResultResponse<Record<string, unknown>>;
      stateCompleted: CompletedTaskStateResponse;
    };
    "fal-sora2-image-to-video": {
      submit: FalSora2ImageToVideoSubmit;
      completed: CompletedTaskResultResponse<Record<string, unknown>>;
      stateCompleted: CompletedTaskStateResponse;
    };
    "fal-sora2-text-to-video": {
      submit: FalSora2TextToVideoSubmit;
      completed: CompletedTaskResultResponse<Record<string, unknown>>;
      stateCompleted: CompletedTaskStateResponse;
    };
    "fal-nano-banana-2": {
      submit: FalNanoBanana2Submit;
      completed: CompletedTaskResultResponse<Record<string, unknown>>;
      stateCompleted: CompletedTaskStateResponse;
    };
    "fal-nano-banana": {
      submit: FalNanoBananaSubmit;
      completed: CompletedTaskResultResponse<Record<string, unknown>>;
      stateCompleted: CompletedTaskStateResponse;
    };
    "image-translate": {
      submit: ImageTranslateSubmit;
      completed: ImageTranslateCompletedResponse;
      stateCompleted: CompletedTaskStateResponse;
    };
    "manga-zip-translate": {
      submit: MangaZipTranslateSubmit;
      completed: MangaZipTranslateCompletedResponse;
      stateCompleted: CompletedTaskStateResponse;
    };
    "qwen-mt-image": {
      submit: QwenMtImageSubmit;
      completed: CompletedTaskResultResponse<Record<string, unknown>>;
      stateCompleted: CompletedTaskStateResponse;
    };
    "wanx-image": {
      submit: WanxImageSubmit;
      completed: CompletedTaskResultResponse<Record<string, unknown>>;
      stateCompleted: CompletedTaskStateResponse;
    };
    "pdf-transform-epub": {
      submit: PDFTransformEpubSubmit;
      completed: CompletedTaskResultResponse<Record<string, unknown>>;
      stateCompleted: CompletedTaskStateResponse;
    };
    "pdf-transform-markdown": {
      submit: PDFTransformMarkdownSubmit;
      completed: CompletedTaskResultResponse<Record<string, unknown>>;
      stateCompleted: CompletedTaskStateResponse;
    };
    "fal-nano-banana-pro": {
      submit: FalNanoBananaProSubmit;
      completed: CompletedTaskResultResponse<Record<string, unknown>>;
      stateCompleted: CompletedTaskStateResponse;
    };
    "wanx-kf2v-video": {
      submit: WanxKf2vVideoSubmit;
      completed: CompletedTaskResultResponse<Record<string, unknown>>;
      stateCompleted: CompletedTaskStateResponse;
    };
    "cphone-nano-banana": {
      submit: CphoneNanoBananaSubmit;
      completed: CompletedTaskResultResponse<Record<string, unknown>>;
      stateCompleted: CompletedTaskStateResponse;
    };
  }

  interface FusionActionDefinitions {
    "custom-financial-fundamental-report/report-list": {
      method: "GET";
      request: GenericActionRequest;
      response: ActionResponse<Record<string, unknown>>;
    };
    "custom-financial-fundamental-report/report": {
      method: "GET";
      request: GenericActionRequest;
      response: ActionResponse<Record<string, unknown>>;
    };
    "custom-financial-fundamental-report/predefined-questions": {
      method: "GET";
      request: GenericActionRequest;
      response: ActionResponse<Record<string, unknown>>;
    };
    "doubao-text-to-image-seedream/generate": {
      method: "POST";
      request: DoubaoTextToImageSeedreamGenerateRequest;
      response: ActionResponse<Record<string, unknown>>;
    };
    "text-to-epub-illustrate/generate": {
      method: "POST";
      request: TextToEpubIllustrateGenerateRequest;
      response: ActionResponse<Record<string, unknown>>;
    };
    "jina-reader/read": {
      method: "POST";
      request: JinaReaderReadURLRequest;
      response: ActionResponse<Record<string, unknown>>;
    };
    "jina-reader/search": {
      method: "POST";
      request: JinaReaderSearchContentRequest;
      response: ActionResponse<Record<string, unknown>>;
    };
    "tinify-png-shrink/compress": {
      method: "POST";
      request: TinifyPNGShrinkRequest;
      response: ActionResponse<Record<string, unknown>>;
    };
    "file-upload/generate-presigned-url": {
      method: "POST";
      request: FileUploadBaseRequest;
      response: ActionResponse<Record<string, unknown>>;
    };
    "file-upload/create-multipart-upload": {
      method: "POST";
      request: FileUploadCreateMultipartRequest;
      response: ActionResponse<Record<string, unknown>>;
    };
    "file-upload/generate-presigned-urls": {
      method: "POST";
      request: FileUploadPresignedUrlsRequest;
      response: ActionResponse<Record<string, unknown>>;
    };
    "file-upload/complete-multipart-upload": {
      method: "POST";
      request: FileUploadCompleteMultipartRequest;
      response: ActionResponse<Record<string, unknown>>;
    };
    "file-upload/abort-multipart-upload": {
      method: "POST";
      request: FileUploadAbortMultipartRequest;
      response: ActionResponse<Record<string, unknown>>;
    };
    "qwen-image-edit-plus/edit": {
      method: "POST";
      request: QwenImageEditPlusRequest;
      response: ActionResponse<Record<string, unknown>>;
    };
    "qwen-doc-turbo/analyze": {
      method: "POST";
      request: QwenDocTurboRequest;
      response: ActionResponse<Record<string, unknown>>;
    };
  }
}

export const BUILTIN_TASK_SERVICES = GENERATED_TASK_SERVICES;

export const BUILTIN_ACTION_ENDPOINTS: ReadonlyArray<ActionEndpointConfig> =
  GENERATED_ACTION_ENDPOINTS;
