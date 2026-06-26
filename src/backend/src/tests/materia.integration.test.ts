import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { buildApp } from "../app.js";
import { pool } from "../database/pool.js";

const TEST_PREFIX = "materia-test";

let app: ReturnType<typeof buildApp>;
let professorToken: string;
let coordenadorToken: string;

const cleanup = async () => {
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
});

describe("MateriaController - integração", () => {
  it("deve criar matéria quando nome e código são válidos", async () => {
    const response = await request(app.server)
      .post("/api/v1/materias")
      .set("Authorization", coordenadorToken)
      .send({ nome: `${TEST_PREFIX}-Matemática`, codigo: `${TEST_PREFIX}-mat` });

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.nome).toBe(`${TEST_PREFIX}-Matemática`);
    expect(response.body.data.codigo).toBe(`${TEST_PREFIX}-mat`);
    expect(response.body.data.id).toBeDefined();
  });

  it("deve rejeitar com 422 matéria sem nome", async () => {
    const response = await request(app.server)
      .post("/api/v1/materias")
      .set("Authorization", coordenadorToken)
      .send({ codigo: `${TEST_PREFIX}-sem-nome` });

    expect(response.statusCode).toBe(422);
    expect(response.body.success).toBe(false);
  });

  it("deve rejeitar com 409 matéria com nome duplicado", async () => {
    await request(app.server)
      .post("/api/v1/materias")
      .set("Authorization", coordenadorToken)
      .send({ nome: `${TEST_PREFIX}-Duplicada`, codigo: `${TEST_PREFIX}-dup` });

    const response = await request(app.server)
      .post("/api/v1/materias")
      .set("Authorization", coordenadorToken)
      .send({ nome: `${TEST_PREFIX}-Duplicada` });

    expect(response.statusCode).toBe(409);
    expect(response.body.error.code).toBe("CONFLICT");
  });

  it("deve listar matérias cadastradas quando autenticado", async () => {
    await request(app.server)
      .post("/api/v1/materias")
      .set("Authorization", coordenadorToken)
      .send({ nome: `${TEST_PREFIX}-Matemática lista`, codigo: `${TEST_PREFIX}-lista` });
    await request(app.server)
      .post("/api/v1/materias")
      .set("Authorization", coordenadorToken)
      .send({ nome: `${TEST_PREFIX}-Português lista`, codigo: `${TEST_PREFIX}-lista-2` });

    const response = await request(app.server)
      .get("/api/v1/materias")
      .set("Authorization", coordenadorToken);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it("deve rejeitar com 401 listagem sem token de autenticação", async () => {
    const response = await request(app.server).get("/api/v1/materias");
    expect(response.statusCode).toBe(401);
  });

  it("deve buscar matéria por id quando o id existe", async () => {
    const nome = `${TEST_PREFIX}-Física busca`;
    const created = await request(app.server)
      .post("/api/v1/materias")
      .set("Authorization", coordenadorToken)
      .send({ nome, codigo: `${TEST_PREFIX}-busca` });

    const id = created.body.data.id;
    const response = await request(app.server)
      .get(`/api/v1/materias/${id}`)
      .set("Authorization", professorToken);

    expect(response.statusCode).toBe(200);
    expect(response.body.data.nome).toBe(nome);
    expect(response.body.data.id).toBe(id);
  });

  it("deve retornar 404 quando matéria não existe", async () => {
    const response = await request(app.server)
      .get(`/api/v1/materias/${randomUUID()}`)
      .set("Authorization", professorToken);

    expect(response.statusCode).toBe(404);
  });

  it("deve atualizar nome e código da matéria quando dados são válidos", async () => {
    const nomeAtualizado = `${TEST_PREFIX}-Química Geral`;
    const created = await request(app.server)
      .post("/api/v1/materias")
      .set("Authorization", coordenadorToken)
      .send({ nome: `${TEST_PREFIX}-Química`, codigo: `${TEST_PREFIX}-upd` });

    const id = created.body.data.id;
    const response = await request(app.server)
      .put(`/api/v1/materias/${id}`)
      .set("Authorization", coordenadorToken)
      .send({ nome: nomeAtualizado, codigo: `${TEST_PREFIX}-upd-novo` });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.nome).toBe(nomeAtualizado);
    expect(response.body.data.codigo).toBe(`${TEST_PREFIX}-upd-novo`);
  });

  it("deve remover matéria e retornar 204, com GET subsequente retornando 404", async () => {
    const created = await request(app.server)
      .post("/api/v1/materias")
      .set("Authorization", coordenadorToken)
      .send({ nome: `${TEST_PREFIX}-Biologia`, codigo: `${TEST_PREFIX}-del` });

    const id = created.body.data.id;
    const response = await request(app.server)
      .delete(`/api/v1/materias/${id}`)
      .set("Authorization", coordenadorToken);

    expect(response.statusCode).toBe(204);

    const check = await request(app.server)
      .get(`/api/v1/materias/${id}`)
      .set("Authorization", professorToken);
    expect(check.statusCode).toBe(404);
  });
});
