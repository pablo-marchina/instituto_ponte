type RetryOptions = {
  retries?: number;
  backoffMs?: number;
  shouldRetry?: (error: unknown) => boolean;
};

type ResilientFetchOptions = RetryOptions & {
  timeoutMs?: number;
  shouldRetryStatus?: (status: number) => boolean;
};

type CircuitBreakerOptions = {
  failureThreshold?: number;
  resetTimeoutMs?: number;
};

const transientErrorCodes = new Set([
  "ETIMEDOUT",
  "ECONNRESET",
  "ECONNREFUSED",
  "EAI_AGAIN",
  "ENETUNREACH",
]);

export const numberFromEnv = (
  environment: NodeJS.ProcessEnv,
  name: string,
  fallback: number,
) => {
  const value = Number(environment[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
};

export const isTransientError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code && transientErrorCodes.has(code)) return true;

    const message = error.message.toLowerCase();
    return error.name === "AbortError"
      || message.includes("timeout")
      || message.includes("timed out")
      || message.includes("fetch failed")
      || message.includes("network");
  }

  return false;
};

const defaultShouldRetryStatus = (status: number) =>
  status === 408 || status === 429 || status >= 500;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const withRetry = async <T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> => {
  const retries = options.retries ?? 2;
  const backoffMs = options.backoffMs ?? 100;
  const shouldRetry = options.shouldRetry ?? isTransientError;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt >= retries || !shouldRetry(error)) throw error;
      await wait(backoffMs * 2 ** attempt);
    }
  }

  throw lastError;
};

export const fetchWithTimeout = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 5_000,
) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  init.signal?.addEventListener("abort", () => controller.abort(), { once: true });

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
};

export const resilientFetch = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: ResilientFetchOptions = {},
) => {
  const retries = options.retries ?? 2;
  const backoffMs = options.backoffMs ?? 100;
  const shouldRetry = options.shouldRetry ?? isTransientError;
  const shouldRetryStatus = options.shouldRetryStatus ?? defaultShouldRetryStatus;

  let lastResponse: Response | undefined;
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchWithTimeout(input, init, options.timeoutMs ?? 5_000);
      lastResponse = response;
      if (!shouldRetryStatus(response.status) || attempt >= retries) {
        return response;
      }
    } catch (error) {
      lastError = error;
      if (attempt >= retries || !shouldRetry(error)) throw error;
    }

    await wait(backoffMs * 2 ** attempt);
  }

  if (lastError) throw lastError;
  return lastResponse!;
};

export class CircuitBreaker {
  private failures = 0;
  private openedAt = 0;
  private state: "closed" | "open" | "half-open" = "closed";

  constructor(private readonly options: CircuitBreakerOptions = {}) {}

  getState() {
    if (this.state === "open" && this.canTryHalfOpen()) {
      return "half-open";
    }
    return this.state;
  }

  async execute<T>(operation: () => Promise<T>, fallback?: () => T | Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (!this.canTryHalfOpen()) {
        if (fallback) return fallback();
        throw new Error("Circuit breaker is open.");
      }
      this.state = "half-open";
    }

    try {
      const result = await operation();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      if (fallback && this.getState() === "open") return fallback();
      throw error;
    }
  }

  private canTryHalfOpen() {
    const resetTimeoutMs = this.options.resetTimeoutMs ?? 30_000;
    return Date.now() - this.openedAt >= resetTimeoutMs;
  }

  private recordSuccess() {
    this.failures = 0;
    this.openedAt = 0;
    this.state = "closed";
  }

  private recordFailure() {
    this.failures += 1;
    const failureThreshold = this.options.failureThreshold ?? 3;
    if (this.failures >= failureThreshold) {
      this.state = "open";
      this.openedAt = Date.now();
    }
  }
}
