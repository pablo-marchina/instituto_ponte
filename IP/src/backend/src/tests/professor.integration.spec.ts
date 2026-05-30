import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { buildApp } from "../app.js";
import { pool } from "../database/pool.js";

const TEST_PREFIX = "prof-crud-test";

let app: ReturnType<typeof buildApp>;
let coordenadorToken: string;
let professorToken: string;
let coordenadorId: string;

const cleanup = async () => {
  await pool.query(
    'DELETE FROM "professor" WHERE "email" LIKE $1',
    [`${TEST_PREFIX}%`],
  );
  await pool.query(
    'DELETE FROM "coordenador" WHERE "email" LIKE $1',
    [`${TEST_PREFIX}%`],
  );
};

beforeAll(async () => {
  app = buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
  await pool.end();
});

beforeEach(async () => {
  await cleanup();
  const suffix = randomUUID();
  const coord = await pool.query<{ id: string }>(
    `INSERT INTO "coordenador" ("nome", "email") VALUES ($1, $2) RETURNING "id"`,
    ["Coord Prof CRUD", `${TEST_PREFIX}-coord-${suffix}@example.com`],
  );
  coordenadorId = coord.rows[0].id;
  coordenadorToken = `Bearer test-coordenador:${coord.rows[0].id}`;
  professorToken = `Bearer test-professor:${randomUUID()}`;
});

describe("ProfessorController - integração", () => {
  it("deve criar professor quando nome, email e coordenadorId são válidos", async () => {
    const response = await request(app.server)
      .post("/api/v1/professores")
      .set("Authorization", coordenadorToken)
      .send({ nome: "João Silva", email: `${TEST_PREFIX}-joao@example.com`, coordenadorId });

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.nome).toBe("João Silva");
    expect(response.body.data.email).toBe(`${TEST_PREFIX}-joao@example.com`);
    expect(response.body.data.coordenadorId).toBe(coordenadorId);
  });

  it("deve rejeitar com 422 criação de professor quando nome está ausente", async () => {
    const response = await request(app.server)
      .post("/api/v1/professores")
      .set("Authorization", coordenadorToken)
      .send({ email: `${TEST_PREFIX}-sem-nome@example.com`, coordenadorId });

    expect(response.statusCode).toBe(422);
  });

  it("deve rejeitar com 409 criação de professor com email já cadastrado", async () => {
    await request(app.server)
      .post("/api/v1/professores")
      .set("Authorization", coordenadorToken)
      .send({ nome: "Primeiro", email: `${TEST_PREFIX}-dup@example.com`, coordenadorId });

    const response = await request(app.server)
      .post("/api/v1/professores")
      .set("Authorization", coordenadorToken)
      .send({ nome: "Segundo", email: `${TEST_PREFIX}-dup@example.com`, coordenadorId });

    expect(response.statusCode).toBe(409);
    expect(response.body.error.code).toBe("CONFLICT");
  });

  it("deve rejeitar com 422 professor quando coordenadorId não existe no banco", async () => {
    const response = await request(app.server)
      .post("/api/v1/professores")
      .set("Authorization", coordenadorToken)
      .send({ nome: "Sem Coord", email: `${TEST_PREFIX}-sem-coord@example.com`, coordenadorId: randomUUID() });

    expect(response.statusCode).toBe(422);
    expect(response.body.error.code).toBe("BUSINESS_RULE_ERROR");
  });

  it("deve retornar 401 quando não autenticado tenta criar professor", async () => {
    const response = await request(app.server)
      .post("/api/v1/professores")
      .send({ nome: "Qualquer", email: `${TEST_PREFIX}-noauth@example.com`, coordenadorId });

    expect(response.statusCode).toBe(401);
  });

  it("deve listar professores cadastrados quando autenticado como coordenador", async () => {
    await request(app.server)
      .post("/api/v1/professores")
      .set("Authorization", coordenadorToken)
      .send({ nome: "Prof A", email: `${TEST_PREFIX}-a@example.com`, coordenadorId });
    await request(app.server)
      .post("/api/v1/professores")
      .set("Authorization", coordenadorToken)
      .send({ nome: "Prof B", email: `${TEST_PREFIX}-b@example.com`, coordenadorId });

    const response = await request(app.server)
      .get("/api/v1/professores")
      .set("Authorization", coordenadorToken);

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it("deve buscar professor por id quando o id existe", async () => {
    const created = await request(app.server)
      .post("/api/v1/professores")
      .set("Authorization", coordenadorToken)
      .send({ nome: "Maria", email: `${TEST_PREFIX}-maria@example.com`, coordenadorId });

    const id = created.body.data.id;
    const response = await request(app.server)
      .get(`/api/v1/professores/${id}`)
      .set("Authorization", coordenadorToken);

    expect(response.statusCode).toBe(200);
    expect(response.body.data.nome).toBe("Maria");
    expect(response.body.data.email).toBe(`${TEST_PREFIX}-maria@example.com`);
  });

  it("deve retornar 404 quando professor não existe", async () => {
    const response = await request(app.server)
      .get(`/api/v1/professores/${randomUUID()}`)
      .set("Authorization", coordenadorToken);

    expect(response.statusCode).toBe(404);
  });

  it("deve atualizar nome do professor quando dados são válidos", async () => {
    const created = await request(app.server)
      .post("/api/v1/professores")
      .set("Authorization", coordenadorToken)
      .send({ nome: "Carlos", email: `${TEST_PREFIX}-carlos@example.com`, coordenadorId });

    const id = created.body.data.id;
    const response = await request(app.server)
      .put(`/api/v1/professores/${id}`)
      .set("Authorization", coordenadorToken)
      .send({ nome: "Carlos Atualizado" });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.nome).toBe("Carlos Atualizado");
  });

  it("deve remover professor e retornar 204, com GET subsequente retornando 404", async () => {
    const created = await request(app.server)
      .post("/api/v1/professores")
      .set("Authorization", coordenadorToken)
      .send({ nome: "Daniel", email: `${TEST_PREFIX}-daniel@example.com`, coordenadorId });

    const id = created.body.data.id;
    const response = await request(app.server)
      .delete(`/api/v1/professores/${id}`)
      .set("Authorization", coordenadorToken);

    expect(response.statusCode).toBe(204);

    const check = await request(app.server)
      .get(`/api/v1/professores/${id}`)
      .set("Authorization", coordenadorToken);
    expect(check.statusCode).toBe(404);
  });
});
