import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { buildApp } from "../app.js";
import { pool } from "../database/pool.js";

const TEST_PREFIX = "tema-test";

let app: ReturnType<typeof buildApp>;
let professorToken: string;
let coordenadorToken: string;
let materiaId: string;

const cleanup = async () => {
  await pool.query(
    'DELETE FROM "tema" WHERE "materia_id" IN (SELECT "id" FROM "materia" WHERE "codigo" LIKE $1)',
    [`${TEST_PREFIX}%`],
  );
  await pool.query('DELETE FROM "materia" WHERE "codigo" LIKE $1', [`${TEST_PREFIX}%`]);
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
  professorToken = `Bearer test-professor:${suffix}`;
  coordenadorToken = `Bearer test-coordenador:${suffix}`;

  const mat = await pool.query<{ id: string }>(
    `INSERT INTO "materia" ("nome", "codigo") VALUES ($1, $2) RETURNING "id"`,
    [`Matéria Tema ${suffix}`, `${TEST_PREFIX}-${suffix}`],
  );
  materiaId = mat.rows[0].id;
});

describe("TemaController - integração", () => {
  it("deve criar tema quando nome e materiaId são válidos", async () => {
    const response = await request(app.server)
      .post("/api/v1/temas")
      .set("Authorization", coordenadorToken)
      .send({ nome: "Álgebra", materiaId });

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.nome).toBe("Álgebra");
    expect(response.body.data.materiaId).toBe(materiaId);
    expect(response.body.data.id).toBeDefined();
  });

  it("deve rejeitar com 422 tema sem nome", async () => {
    const response = await request(app.server)
      .post("/api/v1/temas")
      .set("Authorization", coordenadorToken)
      .send({ materiaId });

    expect(response.statusCode).toBe(422);
  });

  it("deve rejeitar com 422 tema quando materiaId não existe", async () => {
    const response = await request(app.server)
      .post("/api/v1/temas")
      .set("Authorization", coordenadorToken)
      .send({ nome: "Tema Inválido", materiaId: randomUUID() });

    expect(response.statusCode).toBe(422);
    expect(response.body.error.code).toBe("BUSINESS_RULE_ERROR");
  });

  it("deve rejeitar com 409 tema com nome duplicado na mesma matéria", async () => {
    await request(app.server)
      .post("/api/v1/temas")
      .set("Authorization", coordenadorToken)
      .send({ nome: "Geometria", materiaId });

    const response = await request(app.server)
      .post("/api/v1/temas")
      .set("Authorization", coordenadorToken)
      .send({ nome: "Geometria", materiaId });

    expect(response.statusCode).toBe(409);
    expect(response.body.error.code).toBe("CONFLICT");
  });

  it("deve listar temas cadastrados quando autenticado", async () => {
    await request(app.server)
      .post("/api/v1/temas")
      .set("Authorization", coordenadorToken)
      .send({ nome: "Tema A", materiaId });
    await request(app.server)
      .post("/api/v1/temas")
      .set("Authorization", coordenadorToken)
      .send({ nome: "Tema B", materiaId });

    const response = await request(app.server)
      .get("/api/v1/temas")
      .set("Authorization", professorToken);

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it("deve buscar tema por id quando o id existe", async () => {
    const created = await request(app.server)
      .post("/api/v1/temas")
      .set("Authorization", coordenadorToken)
      .send({ nome: "Trigonometria", materiaId });

    const id = created.body.data.id;
    const response = await request(app.server)
      .get(`/api/v1/temas/${id}`)
      .set("Authorization", professorToken);

    expect(response.statusCode).toBe(200);
    expect(response.body.data.nome).toBe("Trigonometria");
  });

  it("deve retornar 404 quando tema não existe", async () => {
    const response = await request(app.server)
      .get(`/api/v1/temas/${randomUUID()}`)
      .set("Authorization", professorToken);

    expect(response.statusCode).toBe(404);
  });

  it("deve atualizar nome do tema quando dados são válidos", async () => {
    const created = await request(app.server)
      .post("/api/v1/temas")
      .set("Authorization", coordenadorToken)
      .send({ nome: "Cálculo", materiaId });

    const id = created.body.data.id;
    const response = await request(app.server)
      .put(`/api/v1/temas/${id}`)
      .set("Authorization", coordenadorToken)
      .send({ nome: "Cálculo Avançado" });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.nome).toBe("Cálculo Avançado");
  });

  it("deve remover tema e retornar 204, com GET subsequente retornando 404", async () => {
    const created = await request(app.server)
      .post("/api/v1/temas")
      .set("Authorization", coordenadorToken)
      .send({ nome: "Estatística", materiaId });

    const id = created.body.data.id;
    const response = await request(app.server)
      .delete(`/api/v1/temas/${id}`)
      .set("Authorization", coordenadorToken);

    expect(response.statusCode).toBe(204);

    const check = await request(app.server)
      .get(`/api/v1/temas/${id}`)
      .set("Authorization", professorToken);
    expect(check.statusCode).toBe(404);
  });
});
