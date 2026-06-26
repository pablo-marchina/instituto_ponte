import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import type { FastifyRequest, FastifyReply } from "fastify";

const mockQuery = jest.fn<any>();
jest.unstable_mockModule("../../database/pool.js", () => ({
  pool: { query: mockQuery },
}));

const mockJwtVerify = jest.fn<any>();
const mockDecodeProtectedHeader = jest.fn<any>();
const mockCreateRemoteJWKSet = jest.fn<any>();
jest.unstable_mockModule("jose", () => ({
  createRemoteJWKSet: mockCreateRemoteJWKSet,
  decodeProtectedHeader: mockDecodeProtectedHeader,
  jwtVerify: mockJwtVerify,
}));

type AuthModule = typeof import("../../middlewares/auth.js");
let auth: AuthModule;

beforeEach(async () => {
  jest.resetModules();
  mockQuery.mockReset();
  mockJwtVerify.mockReset();
  mockDecodeProtectedHeader.mockReset();
  mockCreateRemoteJWKSet.mockReset();
  mockDecodeProtectedHeader.mockReturnValue({ alg: "HS256" });
  mockCreateRemoteJWKSet.mockReturnValue(jest.fn());
  process.env.SUPABASE_JWT_SECRET = "test-secret";
  process.env.SUPABASE_URL = "https://test.supabase.co";
  auth = await import("../../middlewares/auth.js");
});

const makeRequest = (overrides: Record<string, unknown> = {}) =>
  ({
    headers: {},
    ...overrides,
  }) as unknown as FastifyRequest;

const makeReply = () =>
  ({}) as unknown as FastifyReply;

describe("middlewares/auth - unitário", () => {
describe("parseTestToken via requireAuth em modo teste", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "test";
  });

  it("deve aceitar token professor válido com email e nome", async () => {
    const req = makeRequest({
      headers: {
        authorization:
          "Bearer test-professor:uuid-123:prof@test.com:Professor Um",
      },
    });
    await auth.requireAuth(req, makeReply());
    expect(req.user).toBeDefined();
    expect(req.user!.id).toBe("uuid-123");
    expect(req.user!.perfil).toBe("professor");
    expect(req.user!.email).toBe("prof@test.com");
    expect(req.user!.nome).toBe("Professor Um");
  });

  it("deve aceitar token coordenador sem email/nome usando defaults", async () => {
    const req = makeRequest({
      headers: {
        authorization: "Bearer test-coordenador:uuid-456",
      },
    });
    await auth.requireAuth(req, makeReply());
    expect(req.user).toBeDefined();
    expect(req.user!.id).toBe("uuid-456");
    expect(req.user!.perfil).toBe("coordenador");
    expect(req.user!.email).toBe("uuid-456@local.test");
    expect(req.user!.nome).toBe("Usuário Local");
  });

  it("deve aceitar x-user-role e x-user-id em modo teste", async () => {
    const req = makeRequest({
      headers: {
        "x-user-role": "coordenador",
        "x-user-id": "coord-id",
        "x-user-email": "coord@test.com",
        "x-user-name": "Coordenador Teste",
      },
    });
    await auth.requireAuth(req, makeReply());
    expect(req.user).toBeDefined();
    expect(req.user!.id).toBe("coord-id");
    expect(req.user!.perfil).toBe("coordenador");
    expect(req.user!.email).toBe("coord@test.com");
    expect(req.user!.nome).toBe("Coordenador Teste");
  });

  it("deve usar defaults para email/nome quando x-user-email/x-user-name ausentes", async () => {
    const req = makeRequest({
      headers: {
        "x-user-role": "professor",
        "x-user-id": "prof-id",
      },
    });
    await auth.requireAuth(req, makeReply());
    expect(req.user!.email).toBe("prof-id@local.test");
    expect(req.user!.nome).toBe("Usuário Local");
  });

  it("deve rejeitar token mock com prefixo inválido validando JWT real", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.AUTH_MODE;

    mockJwtVerify.mockRejectedValue(new Error("JWT inválido"));

    const req = makeRequest({
      headers: {
        authorization: "Bearer token-invalido-qualquer",
      },
    });
    await expect(auth.requireAuth(req, makeReply())).rejects.toThrow(
      "Token de autenticação inválido",
    );
  });
});

describe("requireAuth em modo produção com JWT real", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "production";
    delete process.env.AUTH_MODE;
    process.env.SUPABASE_JWT_SECRET = "real-secret";
  });

  it("deve lançar 401 quando authorization ausente", async () => {
    const req = makeRequest();
    await expect(auth.requireAuth(req, makeReply())).rejects.toThrow(
      "Token de autenticação não fornecido.",
    );
  });

  it("deve lançar erro claro quando SUPABASE_JWT_SECRET não está configurado", async () => {
    delete process.env.SUPABASE_JWT_SECRET;

    const req = makeRequest({
      headers: { authorization: "Bearer jwt-valido-no-front" },
    });
    await expect(auth.requireAuth(req, makeReply())).rejects.toThrow(
      "SUPABASE_JWT_SECRET não configurado no backend.",
    );
  });

  it("deve lançar 401 quando token é vazio", async () => {
    const req = makeRequest({
      headers: { authorization: "Bearer " },
    });
    await expect(auth.requireAuth(req, makeReply())).rejects.toThrow(
      "Token de autenticação vazio.",
    );
  });

  it("deve lançar 401 quando JWT é inválido", async () => {
    mockJwtVerify.mockRejectedValue(new Error("invalid signature"));

    const req = makeRequest({
      headers: { authorization: "Bearer jwt-invalido" },
    });
    await expect(auth.requireAuth(req, makeReply())).rejects.toThrow(
      "Token de autenticação inválido",
    );
  });

  it("deve lançar 401 quando JWT não tem sub", async () => {
    mockJwtVerify.mockResolvedValue({ payload: {} });

    const req = makeRequest({
      headers: { authorization: "Bearer jwt-sem-sub" },
    });
    await expect(auth.requireAuth(req, makeReply())).rejects.toThrow(
      "Token inválido: sem identificador de usuário.",
    );
  });

  it("deve lançar 401 quando JWT está expirado", async () => {
    const expiredTimestamp = Math.floor(Date.now() / 1000) - 3600;
    mockJwtVerify.mockResolvedValue({
      payload: { sub: "user-1", exp: expiredTimestamp },
    });

    const req = makeRequest({
      headers: { authorization: "Bearer jwt-expirado" },
    });
    await expect(auth.requireAuth(req, makeReply())).rejects.toThrow(
      "Token expirado.",
    );
  });

  it("deve buscar usuário por auth_user_id quando sub existe", async () => {
    mockJwtVerify.mockResolvedValue({
      payload: { sub: "auth-user-1", email: "user@test.com" },
    });
    mockQuery.mockResolvedValue({
      rows: [
        {
          id: "prof-1",
          nome: "Professor",
          email: "user@test.com",
          perfil: "professor",
        },
      ],
    });

    const req = makeRequest({
      headers: { authorization: "Bearer jwt-valido" },
    });
    await auth.requireAuth(req, makeReply());
    expect(req.user).toBeDefined();
    expect(req.user!.id).toBe("prof-1");
    expect(req.user!.perfil).toBe("professor");
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("auth_user_id"),
      ["auth-user-1"],
    );
  });

  it("deve validar JWT assimétrico do Supabase usando JWKS", async () => {
    delete process.env.SUPABASE_JWT_SECRET;
    mockDecodeProtectedHeader.mockReturnValue({ alg: "RS256" });
    mockJwtVerify.mockResolvedValue({
      payload: { sub: "auth-user-rs", email: "rs@test.com" },
    });
    mockQuery.mockResolvedValue({
      rows: [
        {
          id: "coord-rs",
          nome: "Coordenador RS",
          email: "rs@test.com",
          perfil: "coordenador",
        },
      ],
    });

    const req = makeRequest({
      headers: { authorization: "Bearer jwt-assimetrico" },
    });
    await auth.requireAuth(req, makeReply());

    expect(req.user!.id).toBe("coord-rs");
    expect(mockCreateRemoteJWKSet).toHaveBeenCalledWith(
      new URL("https://test.supabase.co/auth/v1/.well-known/jwks.json"),
    );
  });

  it("deve buscar por email quando auth_user_id não encontra", async () => {
    mockJwtVerify.mockResolvedValue({
      payload: { sub: "auth-user-2", email: "fallback@test.com" },
    });
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "coord-1",
            nome: "Coordenador",
            email: "fallback@test.com",
            perfil: "coordenador",
          },
        ],
      });

    const req = makeRequest({
      headers: { authorization: "Bearer jwt-valido" },
    });
    await auth.requireAuth(req, makeReply());
    expect(req.user!.id).toBe("coord-1");
    expect(req.user!.perfil).toBe("coordenador");
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("email"),
      ["fallback@test.com"],
    );
  });

  it("deve lançar 403 quando usuário não encontrado no banco", async () => {
    mockJwtVerify.mockResolvedValue({
      payload: { sub: "unknown-user", email: "unknown@test.com" },
    });
    mockQuery.mockResolvedValue({ rows: [] });
    mockQuery.mockResolvedValue({ rows: [] });

    const req = makeRequest({
      headers: { authorization: "Bearer jwt-valido" },
    });
    await expect(auth.requireAuth(req, makeReply())).rejects.toThrow(
      "Usuário não encontrado",
    );
  });
});

describe("requireRole", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "test";
  });

  it("deve permitir acesso quando role corresponde", async () => {
    const req = makeRequest({
      headers: {
        authorization:
          "Bearer test-professor:uuid:email@test.com:Nome",
      },
    });
    const handler = auth.requireRole("professor");
    await handler(req, makeReply());
    expect(req.user).toBeDefined();
  });

  it("deve lançar 403 quando role não corresponde", async () => {
    const req = makeRequest({
      headers: {
        authorization:
          "Bearer test-professor:uuid:email@test.com:Nome",
      },
    });
    const handler = auth.requireRole("coordenador");
    await expect(handler(req, makeReply())).rejects.toThrow(
      "Usuário sem permissão para esta ação.",
    );
  });
});
});
