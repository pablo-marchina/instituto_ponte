import { notifySessionExpired } from "../features/auth/auth.events";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://pablo-marchina.github.io/instituto_ponte/api/v1";
const DEFAULT_TIMEOUT_MS = 8_000;
const MAX_RETRIES = 2;
const CIRCUIT_FAILURE_THRESHOLD = 5;
const CIRCUIT_OPEN_MS = 30_000;

type ApiSuccess<T> = { success: true; data: T; meta?: unknown };
type ApiFailure = { success: false; error: { code: string; message: string; details?: unknown } };
type ClientOptions = RequestInit & { role?: string; token?: string; timeoutMs?: number };

export type ApiMeta = { page?: number; limit?: number; total?: number };
export type PaginatedResult<T> = { data: T[]; meta?: ApiMeta };

export class ApiClientError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class CircuitBreaker {
  private failures = 0;
  private openedAt: number | null = null;
  private readonly threshold: number;
  private readonly openMs: number;
  private readonly now: () => number;

  constructor(
    threshold = CIRCUIT_FAILURE_THRESHOLD,
    openMs = CIRCUIT_OPEN_MS,
    now = () => Date.now(),
  ) {
    this.threshold = threshold;
    this.openMs = openMs;
    this.now = now;
  }

  assertAvailable() {
    if (this.openedAt === null) return;
    if (this.now() - this.openedAt >= this.openMs) {
      this.openedAt = null;
      this.failures = 0;
      return;
    }
    throw new ApiClientError("Servidor temporariamente indisponível.", 503, "CIRCUIT_OPEN");
  }

  recordSuccess() {
    this.failures = 0;
    this.openedAt = null;
  }

  recordFailure() {
    this.failures += 1;
    if (this.failures >= this.threshold) this.openedAt = this.now();
  }
}

const circuitBreaker = new CircuitBreaker();

export const isRetryableMethod = (method: string, headers: Headers): boolean =>
  ["GET", "HEAD", "OPTIONS", "PUT"].includes(method) || headers.has("Idempotency-Key");

export const isRetryableStatus = (status: number): boolean =>
  status === 408 || status === 425 || status === 429 || (status >= 500 && status <= 504);

export const retryDelay = (attempt: number, random = Math.random): number =>
  250 * 2 ** attempt + Math.floor(random() * 101);

const delay = (milliseconds: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, milliseconds);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
    }, { once: true });
  });

const createRequestSignal = (source: AbortSignal | null | undefined, timeoutMs: number) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new DOMException("Timeout", "TimeoutError")), timeoutMs);
  const abort = () => controller.abort(source?.reason);
  source?.addEventListener("abort", abort, { once: true });
  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeout);
      source?.removeEventListener("abort", abort);
    },
  };
};

const buildHeaders = (options: ClientOptions) => {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (options.token) headers.set("Authorization", `Bearer ${options.token}`);
  if (options.role) headers.set("x-user-role", options.role);
  return headers;
};

const shouldNotifySessionExpired = (status: number, token?: string) => status === 401 && Boolean(token);

async function fetchResilient(path: string, options: ClientOptions): Promise<Response> {
  const headers = buildHeaders(options);
  const method = (options.method ?? "GET").toUpperCase();
  const canRetry = isRetryableMethod(method, headers);

  for (let attempt = 0; ; attempt += 1) {
    circuitBreaker.assertAvailable();
    const requestSignal = createRequestSignal(options.signal, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, { ...options, method, headers, signal: requestSignal.signal });
      if (response.ok || !isRetryableStatus(response.status)) circuitBreaker.recordSuccess();
      else circuitBreaker.recordFailure();

      if (!response.ok && canRetry && isRetryableStatus(response.status) && attempt < MAX_RETRIES) {
        await delay(retryDelay(attempt), options.signal ?? undefined);
        continue;
      }
      return response;
    } catch (error) {
      if (options.signal?.aborted) throw error;
      circuitBreaker.recordFailure();
      if (!canRetry || attempt >= MAX_RETRIES) {
        if (error instanceof DOMException && error.name === "TimeoutError") {
          throw new ApiClientError("Tempo limite de comunicação excedido.", 408, "REQUEST_TIMEOUT");
        }
        throw error;
      }
      await delay(retryDelay(attempt), options.signal ?? undefined);
    } finally {
      requestSignal.cleanup();
    }
  }
}

async function parseResponse<T>(response: Response, token?: string): Promise<ApiSuccess<T>> {
  if (response.status === 204) return { success: true, data: undefined as T };
  const payload = (await response.json().catch(() => null)) as ApiSuccess<T> | ApiFailure | null;
  if (!response.ok || !payload?.success) {
    const error = payload && !payload.success ? payload.error : undefined;
    if (shouldNotifySessionExpired(response.status, token)) notifySessionExpired();
    throw new ApiClientError(
      error?.message ?? "Falha na comunicação com o servidor.",
      response.status,
      error?.code,
      error?.details,
    );
  }
  return payload;
}

export async function apiRequest<T>(path: string, options: ClientOptions = {}): Promise<T> {
  const payload = await parseResponse<T>(await fetchResilient(path, options), options.token);
  return payload.data;
}

export async function apiRequestWithMeta<T>(path: string, options: ClientOptions = {}) {
  const payload = await parseResponse<T>(await fetchResilient(path, options), options.token);
  return { data: payload.data, meta: payload.meta as ApiMeta | undefined };
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  options: { role?: string; token?: string; signal?: AbortSignal } = {},
): Promise<T> {
  return apiRequest<T>(path, { ...options, method: "POST", body: formData });
}
