import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiClientError,
  CircuitBreaker,
  apiRequest,
  apiRequestWithMeta,
  apiUpload,
  isRetryableMethod,
  isRetryableStatus,
  retryDelay,
} from "./apiClient";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("api resilience policies", () => {
  it("repete apenas metodos seguros ou com chave idempotente", () => {
    expect(isRetryableMethod("GET", new Headers())).toBe(true);
    expect(isRetryableMethod("PUT", new Headers())).toBe(true);
    expect(isRetryableMethod("POST", new Headers())).toBe(false);
    expect(isRetryableMethod("POST", new Headers({ "Idempotency-Key": "key" }))).toBe(true);
  });

  it("classifica status transitorios e aplica backoff com jitter", () => {
    expect(isRetryableStatus(429)).toBe(true);
    expect(isRetryableStatus(503)).toBe(true);
    expect(isRetryableStatus(400)).toBe(false);
    expect(retryDelay(0, () => 0)).toBe(250);
    expect(retryDelay(1, () => 1)).toBe(601);
  });

  it("abre e recupera o circuit breaker", () => {
    let now = 0;
    const breaker = new CircuitBreaker(2, 30_000, () => now);
    breaker.recordFailure();
    breaker.recordFailure();
    expect(() => breaker.assertAvailable()).toThrow(ApiClientError);
    now = 30_000;
    expect(() => breaker.assertAvailable()).not.toThrow();
    breaker.recordSuccess();
  });

  it("faz request com headers, meta e retry para falha transitoria", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
            error: { code: "UNAVAILABLE", message: "Tente novamente" },
          }),
          { status: 503 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: { ok: true },
            meta: { page: 1, limit: 10, total: 1 },
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      apiRequestWithMeta<{ ok: boolean }>("/health", {
        method: "GET",
        role: "professor",
        token: "token-123",
      }),
    ).resolves.toEqual({
      data: { ok: true },
      meta: { page: 1, limit: 10, total: 1 },
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, init] = fetchMock.mock.calls[0];
    const headers = init?.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer token-123");
    expect(headers.get("x-user-role")).toBe("professor");
  });

  it("serializa JSON, retorna 204 e envia FormData sem content-type manual", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: { id: "file-1" } }), {
          status: 201,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      apiRequest<void>("/sem-conteudo", {
        method: "POST",
        body: JSON.stringify({ ativo: true }),
      }),
    ).resolves.toBeUndefined();

    const formData = new FormData();
    formData.set("arquivo", new File(["ok"], "ok.txt", { type: "text/plain" }));
    await expect(apiUpload<{ id: string }>("/upload", formData)).resolves.toEqual({
      id: "file-1",
    });

    const jsonHeaders = fetchMock.mock.calls[0][1]?.headers as Headers;
    expect(jsonHeaders.get("Content-Type")).toBe("application/json");
    const uploadHeaders = fetchMock.mock.calls[1][1]?.headers as Headers;
    expect(uploadHeaders.has("Content-Type")).toBe(false);
  });

  it("notifica sessao expirada e preserva detalhes do erro HTTP", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "AUTH_EXPIRED",
            message: "Sessao expirada",
            details: { reason: "jwt" },
          },
        }),
        { status: 401 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const listener = vi.fn();
    window.addEventListener("corrije-ai:auth-session-expired", listener);

    await expect(apiRequest("/privado", { token: "token-123" })).rejects.toMatchObject({
      status: 401,
      code: "AUTH_EXPIRED",
      details: { reason: "jwt" },
    });
    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener("corrije-ai:auth-session-expired", listener);
  });
});
