import { OomolFusionSdkError } from "./api-error.js";
import {
  FusionApiError,
  FusionTaskNotFoundError,
  FusionTaskTimeoutError,
} from "./errors.js";
import { BUILTIN_ACTION_ENDPOINTS } from "./registry.js";
import {
  createActionShortcuts,
  createTaskShortcuts,
  type FusionActionShortcutProperties,
  type FusionTaskShortcutProperties,
} from "./services.js";
import type {
  ActionCallOptions,
  ActionEndpointConfig,
  ActionRequest,
  ActionResponsePayload,
  FusionClientOptions,
  HeaderMap,
  HttpMethod,
  ProcessingTaskResponse,
  RawRequestOptions,
  RequestOptions,
  SubmitResponse,
  TaskCompletedResponse,
  TaskOutput,
  TaskEndpointConfig,
  TaskResultResponse,
  TaskStateResponse,
  TaskSubmitInput,
  TaskWaitOptions,
} from "./types.js";
import {
  buildUrl,
  interpolatePath,
  isPlainObject,
  readJsonOrText,
  sleep,
} from "./utils.js";

export class FusionTaskResource<TService extends string> {
  private readonly client: FusionClient;
  readonly service: TService;

  constructor(client: FusionClient, service: TService) {
    this.client = client;
    this.service = service;
  }

  async submit(
    input: TaskSubmitInput<TService>,
    options: RequestOptions = {},
  ): Promise<SubmitResponse> {
    return this.client.request<SubmitResponse, TaskSubmitInput<TService>>({
      method: "POST",
      path: this.client.resolveTaskPath(this.service, "submit"),
      body: input,
      headers: options.headers,
      signal: options.signal,
    });
  }

  async state(
    sessionID: string,
    options: RequestOptions = {},
  ): Promise<TaskStateResponse<TService>> {
    const { body } =
      await this.client.requestExpectedStatuses<TaskStateResponse<TService>>(
        {
          method: "GET",
          path: this.client.resolveTaskPath(this.service, "state", sessionID),
          headers: options.headers,
          signal: options.signal,
        },
        [200, 404],
      );

    return body;
  }

  async result(
    sessionID: string,
    options: RequestOptions = {},
  ): Promise<TaskResultResponse<TService>> {
    const { body } =
      await this.client.requestExpectedStatuses<TaskResultResponse<TService>>(
        {
          method: "GET",
          path: this.client.resolveTaskPath(this.service, "result", sessionID),
          headers: options.headers,
          signal: options.signal,
        },
        [200, 202, 404],
      );

    return body;
  }

  async wait(
    sessionID: string,
    options: TaskWaitOptions = {},
  ): Promise<TaskCompletedResponse<TService>> {
    const timeoutMs = options.timeoutMs ?? this.client.timeoutMs;
    const pollIntervalMs = options.pollIntervalMs ?? this.client.pollIntervalMs;
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      const { status, body } =
        await this.client.requestExpectedStatuses<TaskResultResponse<TService>>(
          {
            method: "GET",
            path: this.client.resolveTaskPath(this.service, "result", sessionID),
            headers: options.headers,
            signal: options.signal,
          },
          [200, 202, 404],
        );

      if (status === 200) {
        return body as TaskCompletedResponse<TService>;
      }

      if (status === 404) {
        const notFound = body as { error?: string };
        throw new FusionTaskNotFoundError(
          this.service,
          sessionID,
          typeof notFound.error === "string" ? notFound.error : undefined,
        );
      }

      const processing = body as ProcessingTaskResponse;
      options.onProgress?.(processing.progress, processing);
      await sleep(pollIntervalMs, options.signal);
    }

    throw new FusionTaskTimeoutError(this.service, sessionID, timeoutMs);
  }

  async run(
    input: TaskSubmitInput<TService>,
    options: TaskWaitOptions = {},
  ): Promise<TaskCompletedResponse<TService>> {
    const { sessionID } = await this.submit(input, options);
    return this.wait(sessionID, options);
  }

  async waitData(
    sessionID: string,
    options: TaskWaitOptions = {},
  ): Promise<TaskOutput<TService>> {
    const response = await this.wait(sessionID, options);
    if (isPlainObject(response) && "data" in response) {
      return response.data as TaskOutput<TService>;
    }
    return response as TaskOutput<TService>;
  }

  async runData(
    input: TaskSubmitInput<TService>,
    options: TaskWaitOptions = {},
  ): Promise<TaskOutput<TService>> {
    const { sessionID } = await this.submit(input, options);
    return this.waitData(sessionID, options);
  }
}

export class FusionActionsClient {
  private readonly client: FusionClient;

  constructor(client: FusionClient) {
    this.client = client;
  }

  register<TKey extends string>(definition: ActionEndpointConfig<TKey>): this {
    this.client.registerAction(definition);
    return this;
  }

  async call<TKey extends string>(
    key: TKey,
    request?: ActionRequest<TKey>,
    options: ActionCallOptions = {},
  ): Promise<ActionResponsePayload<TKey>> {
    const definition = this.client.resolveActionDefinition(key, options.method);
    const path = definition.path ?? this.client.buildActionPathFromKey(key);

    if (definition.method === "GET") {
      const query = isPlainObject(request)
        ? (request as Record<string, string | number | boolean | null | undefined | Array<string | number | boolean | null | undefined>>)
        : undefined;

      return this.client.request<ActionResponsePayload<TKey>>({
        method: "GET",
        path,
        query,
        headers: options.headers,
        signal: options.signal,
      });
    }

    return this.client.request<ActionResponsePayload<TKey>, ActionRequest<TKey>>({
      method: definition.method,
      path,
      body: request,
      headers: options.headers,
      signal: options.signal,
    });
  }

  async callByName<TService extends string, TAction extends string>(
    service: TService,
    action: TAction,
    request?: ActionRequest<`${TService}/${TAction}`>,
    options: ActionCallOptions = {},
  ): Promise<ActionResponsePayload<`${TService}/${TAction}`>> {
    return this.call(`${service}/${action}` as `${TService}/${TAction}`, request, options);
  }
}

export class FusionClient {
  readonly baseUrl: string;
  readonly pollIntervalMs: number;
  readonly timeoutMs: number;

  private readonly fetchFn: typeof fetch;
  private readonly defaultHeaders: HeaderMap;
  private readonly taskRegistry = new Map<string, TaskEndpointConfig>();
  private readonly actionRegistry = new Map<string, ActionEndpointConfig>();

  readonly actions: FusionActionsClient;

  constructor(options: FusionClientOptions = {}) {
    const fetchFn = options.fetch ?? globalThis.fetch;
    if (!fetchFn) {
      throw new Error("A fetch implementation is required.");
    }

    this.baseUrl = options.baseUrl ?? "https://fusion-api.oomol.com";
    this.fetchFn = fetchFn.bind(globalThis);
    this.pollIntervalMs = options.pollIntervalMs ?? 2000;
    this.timeoutMs = options.timeoutMs ?? 300000;
    this.defaultHeaders = { ...(options.defaultHeaders ?? {}) };

    const authToken = options.apiKey ?? options.token;
    if (authToken) {
      this.defaultHeaders.Authorization = authToken.startsWith("Bearer ")
        ? authToken
        : `Bearer ${authToken}`;
    }

    for (const definition of BUILTIN_ACTION_ENDPOINTS) {
      this.actionRegistry.set(definition.key, definition);
    }

    this.actions = new FusionActionsClient(this);
    Object.assign(this, createTaskShortcuts(this), createActionShortcuts(this));
  }

  task<TService extends string>(service: TService): FusionTaskResource<TService> {
    return new FusionTaskResource(this, service);
  }

  registerTask(
    serviceOrDefinition: string | TaskEndpointConfig,
    overrides: Omit<TaskEndpointConfig, "service"> = {},
  ): this {
    const definition =
      typeof serviceOrDefinition === "string"
        ? { service: serviceOrDefinition, ...overrides }
        : serviceOrDefinition;

    this.taskRegistry.set(definition.service, definition);
    return this;
  }

  registerAction<TKey extends string>(definition: ActionEndpointConfig<TKey>): this {
    this.actionRegistry.set(definition.key, definition);
    return this;
  }

  resolveTaskPath(
    service: string,
    kind: "submit" | "state" | "result",
    sessionID?: string,
  ): string {
    const definition = this.taskRegistry.get(service);
    const template =
      kind === "submit"
        ? definition?.submitPath ?? "/v1/{service}/submit"
        : kind === "state"
          ? definition?.statePath ?? "/v1/{service}/state/{sessionID}"
          : definition?.resultPath ?? "/v1/{service}/result/{sessionID}";

    return interpolatePath(template, {
      service,
      sessionID: sessionID ?? "",
    });
  }

  buildActionPathFromKey(key: string): string {
    const [service, ...rest] = key.split("/");
    if (!service || rest.length === 0) {
      throw new Error(`Invalid action key "${key}". Expected "service/action".`);
    }

    return `/v1/${service}/action/${rest.join("/")}`;
  }

  resolveActionDefinition(
    key: string,
    fallbackMethod?: HttpMethod,
  ): ActionEndpointConfig {
    return (
      this.actionRegistry.get(key) ?? {
        key,
        method: fallbackMethod ?? "POST",
      }
    );
  }

  async action<TKey extends string>(
    key: TKey,
    request?: ActionRequest<TKey>,
    options: ActionCallOptions = {},
  ): Promise<ActionResponsePayload<TKey>> {
    return this.actions.call(key, request, options);
  }

  async request<TResponse, TBody = unknown>({
    path,
    method = "GET",
    query,
    body,
    headers,
    signal,
  }: RawRequestOptions<TBody>): Promise<TResponse> {
    try {
      const response = await this.requestRaw({
        path,
        method,
        query,
        body,
        headers,
        signal,
      });

      if (!response.ok) {
        throw await this.buildApiError(response, path);
      }

      return this.readResponseBody<TResponse>(response);
    } catch (error) {
      throw OomolFusionSdkError.fromUnknown(error);
    }
  }

  async requestExpectedStatuses<TResponse, TBody = unknown>(
    {
      path,
      method = "GET",
      query,
      body,
      headers,
      signal,
    }: RawRequestOptions<TBody>,
    expectedStatuses: number[],
  ): Promise<{ status: number; body: TResponse }> {
    try {
      const response = await this.requestRaw({
        path,
        method,
        query,
        body,
        headers,
        signal,
      });

      if (!expectedStatuses.includes(response.status)) {
        throw await this.buildApiError(response, path);
      }

      const parsed = await this.readResponseBody<TResponse>(response);
      return {
        status: response.status,
        body: parsed,
      };
    } catch (error) {
      throw OomolFusionSdkError.fromUnknown(error);
    }
  }

  private async requestRaw<TBody = unknown>({
    path,
    method = "GET",
    query,
    body,
    headers,
    signal,
  }: RawRequestOptions<TBody>): Promise<Response> {
    const mergedHeaders: HeaderMap = {
      ...this.defaultHeaders,
      ...(headers ?? {}),
    };

    const init: RequestInit = {
      method,
      headers: mergedHeaders,
      signal,
    };

    if (body !== undefined && method !== "GET") {
      mergedHeaders["Content-Type"] =
        mergedHeaders["Content-Type"] ?? "application/json";
      init.body = JSON.stringify(body);
    }

    const url = buildUrl(this.baseUrl, path, query);
    return this.fetchFn(url, init);
  }

  private async buildApiError(
    response: Response,
    path: string,
  ): Promise<FusionApiError> {
    const body = await readJsonOrText(response);
    const message =
      isPlainObject(body) && typeof body.error === "string"
        ? body.error
        : `HTTP ${response.status} ${response.statusText}`;

    return new FusionApiError(message, response.status, path, body);
  }

  private async readResponseBody<T>(response: Response): Promise<T> {
    return (await readJsonOrText(response)) as T;
  }
}

export interface FusionClient
  extends FusionTaskShortcutProperties,
    FusionActionShortcutProperties {}
