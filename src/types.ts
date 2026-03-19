export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type QueryPrimitive = string | number | boolean | null | undefined;
export type QueryValue = QueryPrimitive | ReadonlyArray<QueryPrimitive>;
export type QueryParams = Record<string, QueryValue>;

export type HeaderMap = Record<string, string>;

export interface SubmitResponse {
  success: true;
  sessionID: string;
}

export interface ErrorResponse {
  error: string;
}

export interface ActionResponse<TData = Record<string, unknown>> {
  success: true;
  data: TData;
}

export interface ProcessingTaskResponse {
  success: true;
  state: "processing";
  progress: number;
}

export interface NotFoundTaskResponse {
  success: false;
  state: "not_found";
  error: string;
}

export interface CompletedTaskStateResponse {
  success: true;
  state: "completed";
}

export interface CompletedTaskResultResponse<TData = Record<string, unknown>> {
  success: true;
  state: "completed";
  data: TData;
}

export interface FusionClientOptions {
  apiKey?: string;
  token?: string;
  baseUrl?: string;
  fetch?: typeof fetch;
  defaultHeaders?: HeaderMap;
  pollIntervalMs?: number;
  timeoutMs?: number;
}

export interface RawRequestOptions<TBody = unknown, TQuery extends QueryParams = QueryParams> {
  path: string;
  method?: HttpMethod;
  query?: TQuery;
  body?: TBody;
  headers?: HeaderMap;
  signal?: AbortSignal;
}

export interface RequestOptions {
  headers?: HeaderMap;
  signal?: AbortSignal;
}

export interface TaskWaitOptions extends RequestOptions {
  pollIntervalMs?: number;
  timeoutMs?: number;
  onProgress?: (progress: number, response: ProcessingTaskResponse) => void;
}

export interface ActionCallOptions extends RequestOptions {
  method?: HttpMethod;
}

export interface TaskEndpointConfig {
  service: string;
  submitPath?: string;
  statePath?: string;
  resultPath?: string;
}

export interface ActionEndpointConfig<TKey extends string = string> {
  key: TKey;
  method: HttpMethod;
  path?: string;
}

export interface FusionTaskDefinitions {}

export interface FusionActionDefinitions {}

interface DefaultTaskDefinition {
  submit: Record<string, unknown>;
  completed: CompletedTaskResultResponse<Record<string, unknown>>;
  stateCompleted: CompletedTaskStateResponse;
}

interface DefaultActionDefinition {
  method: "POST";
  request: Record<string, unknown> | QueryParams | undefined;
  response: ActionResponse<Record<string, unknown>>;
}

type ResolveTaskDefinition<TService extends string> =
  TService extends Extract<keyof FusionTaskDefinitions, string>
    ? FusionTaskDefinitions[TService]
    : DefaultTaskDefinition;

type ResolveActionDefinition<TKey extends string> =
  TKey extends Extract<keyof FusionActionDefinitions, string>
    ? FusionActionDefinitions[TKey]
    : DefaultActionDefinition;

export type KnownTaskService = Extract<keyof FusionTaskDefinitions, string>;
export type KnownActionKey = Extract<keyof FusionActionDefinitions, string>;

export type TaskSubmitInput<TService extends string> =
  ResolveTaskDefinition<TService>["submit"];

export type TaskCompletedResponse<TService extends string> =
  ResolveTaskDefinition<TService>["completed"];

export type TaskStateCompletedResponseOf<TService extends string> =
  ResolveTaskDefinition<TService>["stateCompleted"];

export type TaskResultResponse<TService extends string> =
  | TaskCompletedResponse<TService>
  | ProcessingTaskResponse
  | NotFoundTaskResponse;

export type TaskStateResponse<TService extends string> =
  | TaskStateCompletedResponseOf<TService>
  | ProcessingTaskResponse
  | NotFoundTaskResponse;

export type TaskOutput<TService extends string> =
  TaskCompletedResponse<TService> extends { data: infer TData }
    ? TData
    : TaskCompletedResponse<TService>;

export type ActionMethod<TKey extends string> =
  ResolveActionDefinition<TKey>["method"];

export type ActionRequest<TKey extends string> =
  ResolveActionDefinition<TKey> extends { request: infer TRequest }
    ? TRequest
    : undefined;

export type ActionResponsePayload<TKey extends string> =
  ResolveActionDefinition<TKey>["response"];
