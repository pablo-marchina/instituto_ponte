import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { buildApp } from "../app.js";
import { pool } from "../database/pool.js";

const TEST_PREFIX = "infra-auth-test";

describe("API - integração", () => {
  const app = buildApp();

  app.get("/api/v1/__test/internal-error", async () => {
    throw new Error("Falha interna simulada.");
  });

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await pool.query('DELETE FROM "professor" WHERE "email" LIKE $1', [`${TEST_PREFIX}%`]);
    await pool.query('DELETE FROM "coordenador" WHERE "email" LIKE $1', [`${TEST_PREFIX}%`]);
    await app.close();
    await pool.end();
  });

  it("deve responder health check com status ok no prefixo /api/v1/health", async () => {
    const response = await request(app.server).get("/api/v1/health");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        status: "ok",
        service: "corrije-ai-api",
      },
    });
  });

  it("deve responder health/db com database ok quando o banco está conectado", async () => {
    const response = await request(app.server).get("/api/v1/health/db");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        database: "ok",
      },
    });

    const result = await pool.query("SELECT 1 AS ok");
    expect(result.rows[0]).toEqual({ ok: 1 });
  });

  it("deve retornar 404 padronizado com corpo NOT_FOUND para rota inexistente", async () => {
    const response = await request(app.server).get("/api/v1/rota-inexistente");

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Rota não encontrada.",
        details: [],
      },
    });
  });

  it("deve retornar 500 padronizado com corpo INTERNAL_ERROR para erro interno não esperado", async () => {
    const response = await request(app.server).get("/api/v1/__test/internal-error");

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Erro interno não esperado.",
        details: [],
      },
    });
  });

  it("deve retornar 422 com VALIDATION_ERROR no callback OAuth sem code obrigatório", async () => {
    const response = await request(app.server).get("/api/v1/auth/google/callback");

    expect(response.statusCode).toBe(422);
    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
      },
    });
  });

  it("deve iniciar OAuth Google retornando URL de redirecionamento", async () => {
    const response = await request(app.server).get("/api/v1/auth/google");

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        redirectUrl: expect.stringContaining("https://accounts.google.com/o/oauth2/v2/auth?"),
      },
    });
  });

  it("deve concluir callback OAuth em modo teste quando e-mail está autorizado", async () => {
    const suffix = randomUUID();
    const coordenador = await pool.query<{ id: string }>(
      'INSERT INTO "coordenador" ("nome", "email") VALUES ($1, $2) RETURNING "id"',
      ["Coordenador Auth", `${TEST_PREFIX}-coord-${suffix}@example.com`],
    );
    const email = `${TEST_PREFIX}-prof-${suffix}@example.com`;
    const professor = await pool.query<{ id: string }>(
      'INSERT INTO "professor" ("coordenador_id", "nome", "email") VALUES ($1, $2, $3) RETURNING "id"',
      [coordenador.rows[0].id, "Professor Auth", email],
    );

    const response = await request(app.server)
      .get("/api/v1/auth/google/callback")
      .query({ code: email });

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        usuario: {
          id: professor.rows[0].id,
          nome: "Professor Auth",
          email,
          perfil: "professor",
        },
        redirectTo: "/professor",
      },
    });
    expect(response.body.data.accessToken).toContain(`test-professor:${professor.rows[0].id}`);
  });

  it("deve retornar 422 para GET /provas/:id com id inválido (não UUID)", async () => {
    const response = await request(app.server)
      .get("/api/v1/provas/id-invalido")
      .set("Authorization", "Bearer test-professor:11111111-1111-4111-8111-111111111111");

    expect(response.statusCode).toBe(422);
    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
      },
    });
  });

  it("deve retornar 422 para GET /questoes/:id com id inválido (não UUID)", async () => {
    const response = await request(app.server)
      .get("/api/v1/questoes/id-invalido")
      .set("Authorization", "Bearer test-professor:11111111-1111-4111-8111-111111111111");

    expect(response.statusCode).toBe(422);
    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
      },
    });
  });

  it("deve retornar 422 para query de provas com status inválido (não enum)", async () => {
    const response = await request(app.server)
      .get("/api/v1/provas?status=invalido")
      .set("Authorization", "Bearer test-professor:11111111-1111-4111-8111-111111111111");

    expect(response.statusCode).toBe(422);
    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
      },
    });
  });

  it("deve bloquear rota protegida com 401 quando não há token de autenticação", async () => {
    const response = await request(app.server).get("/api/v1/auth/me");

    expect(response.statusCode).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: "UNAUTHORIZED",
      },
    });
  });

  it("deve aceitar usuário local via token test-professor Bearer em modo teste", async () => {
    const response = await request(app.server)
      .get("/api/v1/auth/me")
      .set(
        "Authorization",
        "Bearer test-professor:11111111-1111-4111-8111-111111111111:professor@local.test:Professor Local",
      );

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        id: "11111111-1111-4111-8111-111111111111",
        nome: "Professor Local",
        email: "professor@local.test",
        perfil: "professor",
      },
    });
  });

  it("deve encerrar sessão autenticada", async () => {
    const response = await request(app.server)
      .post("/api/v1/auth/logout")
      .set(
        "Authorization",
        "Bearer test-professor:11111111-1111-4111-8111-111111111111:professor@local.test:Professor Local",
      );

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        message: "Sessão encerrada com sucesso.",
      },
    });
  });
});
