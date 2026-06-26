import { afterEach, describe, expect, it, jest } from "@jest/globals";
import {
  CircuitBreaker,
  fetchWithTimeout,
  isTransientError,
  numberFromEnv,
  resilientFetch,
  withRetry,
} from "../../helpers/resilience.js";

describe("resilience helpers - unitario", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("deve ler numeros de env com fallback seguro", () => {
    expect(numberFromEnv({ TIMEOUT: "250" } as NodeJS.ProcessEnv, "TIMEOUT", 100)).toBe(250);
    expect(numberFromEnv({ TIMEOUT: "-1" } as NodeJS.ProcessEnv, "TIMEOUT", 100)).toBe(100);
    expect(numberFromEnv({ TIMEOUT: "abc" } as NodeJS.ProcessEnv, "TIMEOUT", 100)).toBe(100);
  });

  it("deve classificar erros transitorios de rede e timeout", () => {
    const codeError = new Error("socket") as NodeJS.ErrnoException;
    codeError.code = "ECONNRESET";

    expect(isTransientError(codeError)).toBe(true);
    expect(isTransientError(new Error("request timeout"))).toBe(true);
    expect(isTransientError(new Error("fetch failed"))).toBe(true);
    expect(isTransientError(new Error("validacao invalida"))).toBe(false);
    expect(isTransientError("erro")).toBe(false);
  });

  it("deve repetir operacao transitoria com backoff", async () => {
    const operation = jest.fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("fetch failed"))
      .mockResolvedValue("ok");

    await expect(withRetry(operation, { retries: 1, backoffMs: 0 })).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("nao deve repetir erro nao transitorio", async () => {
    const operation = jest.fn<() => Promise<string>>()
      .mockRejectedValue(new Error("regra de negocio"));

    await expect(withRetry(operation, { retries: 3, backoffMs: 0 })).rejects.toThrow("regra de negocio");
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("deve adicionar AbortSignal no fetch com timeout", async () => {
    const fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true, status: 200 } as Response);

    await expect(fetchWithTimeout("https://api.local", { method: "GET" }, 100)).resolves.toMatchObject({
      ok: true,
      status: 200,
    });
    expect(fetchMock).toHaveBeenCalledWith("https://api.local", expect.objectContaining({
      method: "GET",
      signal: expect.any(AbortSignal),
    }));
  });

  it("deve repetir fetch em status HTTP transitorio", async () => {
    const fetchMock = jest.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({ ok: false, status: 503 } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200 } as Response);

    await expect(resilientFetch("https://api.local", {}, { retries: 1, backoffMs: 0 })).resolves.toMatchObject({
      status: 200,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("deve repetir fetch em excecao transitoria", async () => {
    const fetchMock = jest.spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new Error("fetch failed"))
      .mockResolvedValueOnce({ ok: true, status: 200 } as Response);

    await expect(resilientFetch("https://api.local", {}, { retries: 1, backoffMs: 0 })).resolves.toMatchObject({
      status: 200,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("deve abrir, usar fallback e recuperar circuit breaker no half-open", async () => {
    const dateSpy = jest.spyOn(Date, "now");
    dateSpy.mockReturnValue(1_000);
    const breaker = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 100 });

    await expect(breaker.execute(
      () => Promise.reject(new Error("fetch failed")),
      () => "fallback",
    )).resolves.toBe("fallback");
    expect(breaker.getState()).toBe("open");

    await expect(breaker.execute(
      () => Promise.resolve("nao executa"),
      () => "aberto",
    )).resolves.toBe("aberto");

    dateSpy.mockReturnValue(1_200);
    expect(breaker.getState()).toBe("half-open");
    await expect(breaker.execute(() => Promise.resolve("ok"))).resolves.toBe("ok");
    expect(breaker.getState()).toBe("closed");

    dateSpy.mockRestore();
  });

  it("deve lancar quando circuit breaker aberto nao tem fallback", async () => {
    const dateSpy = jest.spyOn(Date, "now").mockReturnValue(1_000);
    const breaker = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 100 });

    await expect(breaker.execute(() => Promise.reject(new Error("falha")))).rejects.toThrow("falha");
    await expect(breaker.execute(() => Promise.resolve("ok"))).rejects.toThrow("Circuit breaker is open.");

    dateSpy.mockRestore();
  });
});
