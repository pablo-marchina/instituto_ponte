import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { buildApp } from "../app.js";
import { pool } from "../database/pool.js";

const TEST_PREFIX = "aluno-test";

let app: ReturnType<typeof buildApp>;
let professorToken: string;
let coordenadorToken: string;

const cleanup = async () => {
  await pool.query(
    'DELETE FROM "aluno" WHERE "email" LIKE $1 OR "cpf" LIKE $2',
    [`${TEST_PREFIX}%`, "900%"],
  );
};

const createAluno = async (overrides: Partial<{ nome: string; email: string; cpf: string | null }> = {}) => {
  const suffix = randomUUID().slice(0, 8);
  const result = await pool.query<{ id: string }>(
    `INSERT INTO "aluno" ("nome", "email", "cpf", "aceitou_termos_em")
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
     RETURNING "id"`,
    [
      overrides.nome ?? "Aluno Teste",
      overrides.email ?? `${TEST_PREFIX}-${suffix}@example.com`,
      overrides.cpf === undefined ? `900${suffix.replace(/\D/g, "").padEnd(8, "0").slice(0, 8)}` : overrides.cpf,
    ],
  );
  return result.rows[0].id;
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

describe("AlunoController - integração", () => {
  it("deve listar alunos quando autenticado como professor", async () => {
    await createAluno({ nome: "Alice Aluna" });
    await createAluno({ nome: "Bruno Aluno" });

    const response = await request(app.server)
      .get("/api/v1/alunos")
      .set("Authorization", professorToken);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it("deve rejeitar com 401 listagem sem token de autenticação", async () => {
    const response = await request(app.server).get("/api/v1/alunos");
    expect(response.statusCode).toBe(401);
  });

  it("deve buscar aluno por id quando o id existe", async () => {
    const id = await createAluno({ nome: "Carla Aluna" });

    const response = await request(app.server)
      .get(`/api/v1/alunos/${id}`)
      .set("Authorization", professorToken);

    expect(response.statusCode).toBe(200);
    expect(response.body.data.id).toBe(id);
    expect(response.body.data.nome).toBe("Carla Aluna");
  });

  it("deve retornar 404 quando o aluno não existe", async () => {
    const response = await request(app.server)
      .get(`/api/v1/alunos/${randomUUID()}`)
      .set("Authorization", professorToken);

    expect(response.statusCode).toBe(404);
  });

  it("deve rejeitar com 422 alunoId que não é UUID válido", async () => {
    const response = await request(app.server)
      .get("/api/v1/alunos/invalido")
      .set("Authorization", professorToken);

    expect(response.statusCode).toBe(422);
  });

  it("deve atualizar aluno como coordenador e persistir nome, email e cpf no banco", async () => {
    const id = await createAluno({ nome: "Daniel Aluno" });

    const response = await request(app.server)
      .put(`/api/v1/alunos/${id}`)
      .set("Authorization", coordenadorToken)
      .send({
        nome: "Daniel Atualizado",
        email: `${TEST_PREFIX}-daniel-atualizado@example.com`,
        cpf: "90012345678",
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.nome).toBe("Daniel Atualizado");
    expect(response.body.data.email).toBe(`${TEST_PREFIX}-daniel-atualizado@example.com`);

    const persisted = await pool.query(
      'SELECT "nome", "email", "cpf" FROM "aluno" WHERE "id" = $1',
      [id],
    );
    expect(persisted.rows[0]).toMatchObject({
      nome: "Daniel Atualizado",
      email: `${TEST_PREFIX}-daniel-atualizado@example.com`,
      cpf: "90012345678",
    });
  });

  it("deve bloquear com 403 quando professor tenta atualizar aluno", async () => {
    const id = await createAluno();

    const response = await request(app.server)
      .put(`/api/v1/alunos/${id}`)
      .set("Authorization", professorToken)
      .send({ nome: "Sem permissão" });

    expect(response.statusCode).toBe(403);
  });

  it("deve rejeitar com 422 atualização quando email não tem formato válido", async () => {
    const id = await createAluno();

    const response = await request(app.server)
      .put(`/api/v1/alunos/${id}`)
      .set("Authorization", coordenadorToken)
      .send({ email: "email-invalido" });

    expect(response.statusCode).toBe(422);
  });

  it("deve rejeitar com 422 atualização quando CPF não tem 11 dígitos", async () => {
    const id = await createAluno();

    const response = await request(app.server)
      .put(`/api/v1/alunos/${id}`)
      .set("Authorization", coordenadorToken)
      .send({ cpf: "123" });

    expect(response.statusCode).toBe(422);
  });

  it("deve remover aluno como coordenador e retornar 204, com GET subsequente retornando 404", async () => {
    const id = await createAluno({ nome: "Aluno Removível" });

    const response = await request(app.server)
      .delete(`/api/v1/alunos/${id}`)
      .set("Authorization", coordenadorToken);

    expect(response.statusCode).toBe(204);

    const check = await request(app.server)
      .get(`/api/v1/alunos/${id}`)
      .set("Authorization", professorToken);
    expect(check.statusCode).toBe(404);
  });

  it("deve bloquear com 403 quando professor tenta remover aluno", async () => {
    const id = await createAluno();

    const response = await request(app.server)
      .delete(`/api/v1/alunos/${id}`)
      .set("Authorization", professorToken);

    expect(response.statusCode).toBe(403);
  });
});
