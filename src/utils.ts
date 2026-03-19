import type { QueryParams } from "./types.js";

export function buildUrl(
  baseUrl: string,
  path: string,
  query?: QueryParams,
): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(normalizedPath, ensureTrailingSlash(baseUrl));

  if (query) {
    for (const [key, rawValue] of Object.entries(query)) {
      if (rawValue === undefined || rawValue === null) {
        continue;
      }

      if (Array.isArray(rawValue)) {
        for (const value of rawValue) {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        }
        continue;
      }

      url.searchParams.set(key, String(rawValue));
    }
  }

  return url.toString();
}

export function interpolatePath(
  template: string,
  params: Record<string, string>,
): string {
  return template.replace(/\{([^}]+)\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined ? `{${key}}` : encodeURIComponent(value);
  });
}

export function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

export async function readJsonOrText(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (!signal) {
    await new Promise((resolve) => setTimeout(resolve, ms));
    return;
  }

  if (signal.aborted) {
    throw signal.reason ?? new Error("Request aborted");
  }

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      reject(signal.reason ?? new Error("Request aborted"));
    };

    signal.addEventListener("abort", onAbort, { once: true });
  });
}
