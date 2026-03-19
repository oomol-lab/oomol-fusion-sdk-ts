export class FusionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class FusionApiError extends FusionError {
  readonly status: number;
  readonly path: string;
  readonly body: unknown;

  constructor(message: string, status: number, path: string, body: unknown) {
    super(message);
    this.status = status;
    this.path = path;
    this.body = body;
  }
}

export class FusionTaskTimeoutError extends FusionError {
  readonly service: string;
  readonly sessionID: string;

  constructor(service: string, sessionID: string, timeoutMs: number) {
    super(`Task "${service}" timed out after ${timeoutMs}ms: ${sessionID}`);
    this.service = service;
    this.sessionID = sessionID;
  }
}

export class FusionTaskNotFoundError extends FusionError {
  readonly service: string;
  readonly sessionID: string;

  constructor(service: string, sessionID: string, message?: string) {
    super(message ?? `Task "${service}" was not found: ${sessionID}`);
    this.service = service;
    this.sessionID = sessionID;
  }
}
