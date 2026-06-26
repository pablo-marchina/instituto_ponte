import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { buildApp } from "../app.js";
import { pool } from "../database/pool.js";

const TEST_PREFIX = "questao-api-test";

type Seed = {
  coordenadorId: string;
  professorId: string;
  materiaId: string;
  materiaSemVinculoId: string;
  temaId: string;
  tokenProfessor: string;
  tokenCoordenador: string;
};

const cleanup = async () => {
  await pool.query(
    `
      DELETE FROM "questao"
      WHERE "materia_id" IN (
        SELECT "id" FROM "materia" WHERE "codigo" LIKE $1
      )
    `,
    [`${TEST_PREFIX}%`],
  );
  await pool.query(
    'DELETE FROM "tema" WHERE "materia_id" IN (SELECT "id" FROM "materia" WHERE "codigo" LIKE $1)',
    [`${TEST_PREFIX}%`],
  );
  await pool.query(
    'DELETE FROM "materia_professor" WHERE "materia_id" IN (SELECT "id" FROM "materia" WHERE "codigo" LIKE $1)',
    [`${TEST_PREFIX}%`],
  );
  await pool.query(
    'DELETE FROM "prova" WHERE "professor_id" IN (SELECT p."id" FROM "professor" p JOIN "coordenador" c ON c."id" = p."coordenador_id" WHERE c."email" LIKE $1)',
    [`${TEST_PREFIX}%`],
  );
  await pool.query(
    'DELETE FROM "materia_professor" WHERE "professor_id" IN (SELECT p."id" FROM "professor" p JOIN "coordenador" c ON c."id" = p."coordenador_id" WHERE c."email" LIKE $1)',
    [`${TEST_PREFIX}%`],
  );
  await pool.query(
    'DELETE FROM "professor" WHERE "coordenador_id" IN (SELECT "id" FROM "coordenador" WHERE "email" LIKE $1)',
    [`${TEST_PREFIX}%`],
  );
  await pool.query('DELETE FROM "professor" WHERE "email" LIKE $1', [`${TEST_PREFIX}%`]);
  await pool.query('DELETE FROM "materia" WHERE "codigo" LIKE $1', [`${TEST_PREFIX}%`]);
  await pool.query('DELETE FROM "coordenador" WHERE "email" LIKE $1', [`${TEST_PREFIX}%`]);
};

const createSeed = async (): Promise<Seed> => {
  const suffix = randomUUID();
  const coordenador = await pool.query<{ id: string }>(
    'INSERT INTO "coordenador" ("nome", "email") VALUES ($1, $2) RETURNING "id"',
    ["Coordenador Questão", `${TEST_PREFIX}-coord-${suffix}@example.com`],
  );
  const professor = await pool.query<{ id: string }>(
    'INSERT INTO "professor" ("coordenador_id", "nome", "email") VALUES ($1, $2, $3) RETURNING "id"',
    [coordenador.rows[0].id, "Professor Questão", `${TEST_PREFIX}-prof-${suffix}@example.com`],
  );
  const materia = await pool.query<{ id: string }>(
    'INSERT INTO "materia" ("nome", "codigo") VALUES ($1, $2) RETURNING "id"',
    [`Matemática Questão ${suffix}`, `${TEST_PREFIX}-${suffix}`],
  );
  const materiaSemVinculo = await pool.query<{ id: string }>(
    'INSERT INTO "materia" ("nome", "codigo") VALUES ($1, $2) RETURNING "id"',
    [`História Questão ${suffix}`, `${TEST_PREFIX}-sem-vinculo-${suffix}`],
  );
  const tema = await pool.query<{ id: string }>(
    'INSERT INTO "tema" ("materia_id", "nome") VALUES ($1, $2) RETURNING "id"',
    [materia.rows[0].id, `Álgebra ${suffix}`],
  );
  await pool.query('INSERT INTO "materia_professor" ("materia_id", "professor_id") VALUES ($1, $2)', [
    materia.rows[0].id,
    professor.rows[0].id,
  ]);

  return {
    coordenadorId: coordenador.rows[0].id,
    professorId: professor.rows[0].id,
    materiaId: materia.rows[0].id,
    materiaSemVinculoId: materiaSemVinculo.rows[0].id,
    temaId: tema.rows[0].id,
    tokenProfessor: `Bearer test-professor:${professor.rows[0].id}:professor@example.com:Professor Questão`,
    tokenCoordenador: `Bearer test-coordenador:${coordenador.rows[0].id}:coord@example.com:Coordenador Questão`,
  };
};

describe("QuestaoController - integração", () => {
  const app = buildApp();
  let seed: Seed;

  beforeAll(async () => {
    await app.ready();
    await pool.query('SELECT 1 FROM "questao" LIMIT 1');
  });

  beforeEach(async () => {
    await cleanup();
    seed = await createSeed();
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
    await pool.end();
  });

  it("deve criar questão discursiva com enunciado e persistir no banco", async () => {
    const response = await request(app.server)
      .post("/api/v1/questoes")
      .set("Authorization", seed.tokenProfessor)
      .send({
        materiaId: seed.materiaId,
        temaId: seed.temaId,
        tipo: "discursiva",
        pontuacaoPadrao: 2,
        limiteCaracteres: 500,
        permiteAnexo: true,
        enunciado: {
          conteudoLatex: "Explique o processo.",
          urlImagem: null,
        },
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        tipo: "discursiva",
        materiaId: seed.materiaId,
        temaId: seed.temaId,
        alternativas: [],
      },
    });

    const persisted = await pool.query(
      `
        SELECT q."tipo", e."conteudo_latex"
        FROM "questao" q
        JOIN "enunciado" e ON e."questao_id" = q."id"
        WHERE q."id" = $1
      `,
      [response.body.data.id],
    );
    expect(persisted.rows).toHaveLength(1);
    expect(persisted.rows[0]).toEqual({
      tipo: "discursiva",
      conteudo_latex: "Explique o processo.",
    });
  });

  it("deve rejeitar com 422 questão discursiva que possui alternativas", async () => {
    const response = await request(app.server)
      .post("/api/v1/questoes")
      .set("Authorization", seed.tokenProfessor)
      .send({
        materiaId: seed.materiaId,
        tipo: "discursiva",
        enunciado: { conteudoLatex: "Explique.", urlImagem: null },
        alternativas: [{ ordemOriginal: 1, conteudoLatex: "A", correta: true }],
      });

    expect(response.statusCode).toBe(422);
    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: "BUSINESS_RULE_ERROR",
      },
    });
  });

  it("deve criar múltipla escolha e listar com filtros combinados (materiaId + temaId + tipo)", async () => {
    const create = await request(app.server)
      .post("/api/v1/questoes")
      .set("Authorization", seed.tokenProfessor)
      .send({
        materiaId: seed.materiaId,
        temaId: seed.temaId,
        tipo: "multipla_escolha",
        pontuacaoPadrao: 1,
        enunciado: { conteudoLatex: "Quanto é 2+2?", urlImagem: null },
        alternativas: [
          { ordemOriginal: 1, conteudoLatex: "3", correta: false },
          { ordemOriginal: 2, conteudoLatex: "4", correta: true },
        ],
      });

    expect(create.statusCode).toBe(201);
    expect(create.body.data.alternativas).toHaveLength(2);

    const list = await request(app.server)
      .get(`/api/v1/questoes?materiaId=${seed.materiaId}&temaId=${seed.temaId}&tipo=multipla_escolha`)
      .set("Authorization", seed.tokenProfessor);

    expect(list.statusCode).toBe(200);
    expect(list.body.meta.total).toBe(1);
    expect(list.body.data[0]).toMatchObject({
      id: create.body.data.id,
      tipo: "multipla_escolha",
      materiaId: seed.materiaId,
      temaId: seed.temaId,
    });
  });

  it("deve rejeitar com 422 múltipla escolha quando não há exatamente uma alternativa correta", async () => {
    const response = await request(app.server)
      .post("/api/v1/questoes")
      .set("Authorization", seed.tokenProfessor)
      .send({
        materiaId: seed.materiaId,
        tipo: "multipla_escolha",
        enunciado: { conteudoLatex: "Quanto é 2+2?", urlImagem: null },
        alternativas: [
          { ordemOriginal: 1, conteudoLatex: "3", correta: false },
          { ordemOriginal: 2, conteudoLatex: "5", correta: false },
        ],
      });

    expect(response.statusCode).toBe(422);
    expect(response.body.error.message).toContain("exatamente uma correta");
  });

  it("deve criar verdadeiro/falso válido e rejeitar com 422 quando não tem exatamente duas alternativas", async () => {
    const valid = await request(app.server)
      .post("/api/v1/questoes")
      .set("Authorization", seed.tokenProfessor)
      .send({
        materiaId: seed.materiaId,
        tipo: "verdadeiro_falso",
        enunciado: { conteudoLatex: "O número 2 é par.", urlImagem: null },
        alternativas: [
          { ordemOriginal: 1, conteudoLatex: "Verdadeiro", correta: true },
          { ordemOriginal: 2, conteudoLatex: "Falso", correta: false },
        ],
      });

    expect(valid.statusCode).toBe(201);

    const invalid = await request(app.server)
      .post("/api/v1/questoes")
      .set("Authorization", seed.tokenProfessor)
      .send({
        materiaId: seed.materiaId,
        tipo: "verdadeiro_falso",
        enunciado: { conteudoLatex: "O número 3 é par.", urlImagem: null },
        alternativas: [{ ordemOriginal: 1, conteudoLatex: "Verdadeiro", correta: false }],
      });

    expect(invalid.statusCode).toBe(422);
    expect(invalid.body.error.message).toContain("exatamente duas alternativas");
  });

  it("deve detalhar, atualizar e remover questão sequencialmente com respostas corretas", async () => {
    const create = await request(app.server)
      .post("/api/v1/questoes")
      .set("Authorization", seed.tokenProfessor)
      .send({
        materiaId: seed.materiaId,
        tipo: "discursiva",
        pontuacaoPadrao: 1,
        limitePalavras: 100,
        enunciado: { conteudoLatex: "Resposta inicial.", urlImagem: null },
      });

    const questaoId = create.body.data.id;
    const detail = await request(app.server)
      .get(`/api/v1/questoes/${questaoId}`)
      .set("Authorization", seed.tokenProfessor);

    expect(detail.statusCode).toBe(200);
    expect(detail.body.data.enunciado.conteudoLatex).toBe("Resposta inicial.");

    const update = await request(app.server)
      .put(`/api/v1/questoes/${questaoId}`)
      .set("Authorization", seed.tokenProfessor)
      .send({
        materiaId: seed.materiaId,
        tipo: "discursiva",
        pontuacaoPadrao: 3,
        limitePalavras: 120,
        enunciado: { conteudoLatex: "Resposta atualizada.", urlImagem: null },
      });

    expect(update.statusCode).toBe(200);
    expect(update.body.data).toMatchObject({
      id: questaoId,
      pontuacaoPadrao: 3,
      enunciado: { conteudoLatex: "Resposta atualizada." },
    });

    const remove = await request(app.server)
      .delete(`/api/v1/questoes/${questaoId}`)
      .set("Authorization", seed.tokenProfessor);

    expect(remove.statusCode).toBe(204);
    const exists = await pool.query('SELECT 1 FROM "questao" WHERE "id" = $1', [questaoId]);
    expect(exists.rows).toHaveLength(0);
  });

  it("deve retornar 404 ao detalhar questão inexistente", async () => {
    const response = await request(app.server)
      .get(`/api/v1/questoes/${randomUUID()}`)
      .set("Authorization", seed.tokenProfessor);

    expect(response.statusCode).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("deve retornar 404 ao atualizar questão inexistente", async () => {
    const response = await request(app.server)
      .put(`/api/v1/questoes/${randomUUID()}`)
      .set("Authorization", seed.tokenProfessor)
      .send({
        materiaId: seed.materiaId,
        tipo: "discursiva",
        enunciado: { conteudoLatex: "Questão inexistente.", urlImagem: null },
      });

    expect(response.statusCode).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("deve bloquear com 403 criação de questão quando professor não tem vínculo com a matéria", async () => {
    const response = await request(app.server)
      .post("/api/v1/questoes")
      .set("Authorization", seed.tokenProfessor)
      .send({
        materiaId: seed.materiaSemVinculoId,
        tipo: "discursiva",
        enunciado: { conteudoLatex: "Explique.", urlImagem: null },
      });

    expect(response.statusCode).toBe(403);
  });
});
