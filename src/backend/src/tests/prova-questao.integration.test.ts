import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { buildApp } from "../app.js";
import { pool } from "../database/pool.js";

const TEST_PREFIX = "prova-questao-api-test";

type Seed = {
  coordenadorId: string;
  professorId: string;
  materiaId: string;
  outraMateriaId: string;
  provaId: string;
  provaPublicadaId: string;
  questaoId: string;
  segundaQuestaoId: string;
  questaoOutraMateriaId: string;
  tokenProfessor: string;
};

const cleanup = async () => {
  await pool.query(
    `
      DELETE FROM "prova"
      WHERE "professor_id" IN (
        SELECT "id" FROM "professor" WHERE "email" LIKE $1
      )
      OR "materia_id" IN (
        SELECT "id" FROM "materia" WHERE "codigo" LIKE $2
      )
    `,
    [`${TEST_PREFIX}%`, `${TEST_PREFIX}%`],
  );
  await pool.query(
    'DELETE FROM "questao" WHERE "materia_id" IN (SELECT "id" FROM "materia" WHERE "codigo" LIKE $1)',
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

const createQuestao = async (materiaId: string, conteudoLatex: string) => {
  const questao = await pool.query<{ id: string }>(
    'INSERT INTO "questao" ("materia_id", "tipo", "pontuacao_padrao") VALUES ($1, $2, $3) RETURNING "id"',
    [materiaId, "discursiva", 1],
  );
  await pool.query('INSERT INTO "enunciado" ("questao_id", "conteudo_latex") VALUES ($1, $2)', [
    questao.rows[0].id,
    conteudoLatex,
  ]);
  return questao.rows[0].id;
};

const createSeed = async (): Promise<Seed> => {
  const suffix = randomUUID();
  const coordenador = await pool.query<{ id: string }>(
    'INSERT INTO "coordenador" ("nome", "email") VALUES ($1, $2) RETURNING "id"',
    ["Coordenador Prova Questão", `${TEST_PREFIX}-coord-${suffix}@example.com`],
  );
  const professor = await pool.query<{ id: string }>(
    'INSERT INTO "professor" ("coordenador_id", "nome", "email") VALUES ($1, $2, $3) RETURNING "id"',
    [coordenador.rows[0].id, "Professor Prova Questão", `${TEST_PREFIX}-prof-${suffix}@example.com`],
  );
  const materia = await pool.query<{ id: string }>(
    'INSERT INTO "materia" ("nome", "codigo") VALUES ($1, $2) RETURNING "id"',
    [`Matemática Prova Questão ${suffix}`, `${TEST_PREFIX}-${suffix}`],
  );
  const outraMateria = await pool.query<{ id: string }>(
    'INSERT INTO "materia" ("nome", "codigo") VALUES ($1, $2) RETURNING "id"',
    [`História Prova Questão ${suffix}`, `${TEST_PREFIX}-outra-${suffix}`],
  );
  await pool.query('INSERT INTO "materia_professor" ("materia_id", "professor_id") VALUES ($1, $2)', [
    materia.rows[0].id,
    professor.rows[0].id,
  ]);
  await pool.query('INSERT INTO "materia_professor" ("materia_id", "professor_id") VALUES ($1, $2)', [
    outraMateria.rows[0].id,
    professor.rows[0].id,
  ]);

  const prova = await pool.query<{ id: string }>(
    `
      INSERT INTO "prova" ("professor_id", "materia_id", "titulo", "turma", "semestre")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING "id"
    `,
    [professor.rows[0].id, materia.rows[0].id, "Prova Rascunho", "A", "2026.1"],
  );
  const provaPublicada = await pool.query<{ id: string }>(
    `
      INSERT INTO "prova" ("professor_id", "materia_id", "titulo", "turma", "semestre")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING "id"
    `,
    [professor.rows[0].id, materia.rows[0].id, "Prova Publicada", "B", "2026.1"],
  );

  const questaoId = await createQuestao(materia.rows[0].id, "Resolva a primeira questão.");
  const segundaQuestaoId = await createQuestao(materia.rows[0].id, "Resolva a segunda questão.");
  const questaoPublicacaoId = await createQuestao(materia.rows[0].id, "Questão para publicação.");
  const questaoOutraMateriaId = await createQuestao(outraMateria.rows[0].id, "Questão de outra matéria.");

  await pool.query(
    'INSERT INTO "prova_questao" ("prova_id", "questao_id", "ordem_original", "pontuacao_max") VALUES ($1, $2, $3, $4)',
    [provaPublicada.rows[0].id, questaoPublicacaoId, 1, 1],
  );
  await pool.query(
    `
      UPDATE "prova"
      SET "data_inicio" = $1,
          "data_fim" = $2,
          "url_acesso" = $3,
          "status" = 'publicada'
      WHERE "id" = $4
    `,
    [
      "2026-06-01T10:00:00.000Z",
      "2026-06-01T12:00:00.000Z",
      `https://app.test/provas/${suffix}`,
      provaPublicada.rows[0].id,
    ],
  );

  return {
    coordenadorId: coordenador.rows[0].id,
    professorId: professor.rows[0].id,
    materiaId: materia.rows[0].id,
    outraMateriaId: outraMateria.rows[0].id,
    provaId: prova.rows[0].id,
    provaPublicadaId: provaPublicada.rows[0].id,
    questaoId,
    segundaQuestaoId,
    questaoOutraMateriaId,
    tokenProfessor: `Bearer test-professor:${professor.rows[0].id}:professor@example.com:Professor Prova Questão`,
  };
};

describe("ProvaQuestaoController - integração", () => {
  const app = buildApp();
  let seed: Seed;

  beforeAll(async () => {
    await app.ready();
    await pool.query('SELECT 1 FROM "prova_questao" LIMIT 1');
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

  it("deve adicionar questão à prova em rascunho e persistir vínculo no banco", async () => {
    const response = await request(app.server)
      .post(`/api/v1/provas/${seed.provaId}/questoes`)
      .set("Authorization", seed.tokenProfessor)
      .send({
        questaoId: seed.questaoId,
        ordemOriginal: 1,
        pontuacaoMax: 2,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        provaId: seed.provaId,
        questaoId: seed.questaoId,
        ordemOriginal: 1,
        pontuacaoMax: 2,
      },
    });

    const persisted = await pool.query(
      'SELECT "pontuacao_max" FROM "prova_questao" WHERE "prova_id" = $1 AND "questao_id" = $2',
      [seed.provaId, seed.questaoId],
    );
    expect(Number(persisted.rows[0].pontuacao_max)).toBe(2);
  });

  it("deve listar questões vinculadas à prova com dados do enunciado", async () => {
    await pool.query(
      'INSERT INTO "prova_questao" ("prova_id", "questao_id", "ordem_original", "pontuacao_max") VALUES ($1, $2, $3, $4)',
      [seed.provaId, seed.questaoId, 1, 2],
    );

    const response = await request(app.server)
      .get(`/api/v1/provas/${seed.provaId}/questoes`)
      .set("Authorization", seed.tokenProfessor);

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: [
        {
          provaId: seed.provaId,
          questaoId: seed.questaoId,
          ordemOriginal: 1,
          pontuacaoMax: 2,
          questao: {
            tipo: "discursiva",
            enunciado: {
              conteudoLatex: "Resolva a primeira questão.",
            },
          },
        },
      ],
    });
  });

  it("deve retornar 404 ao adicionar questão em prova que não existe", async () => {
    const response = await request(app.server)
      .post(`/api/v1/provas/${randomUUID()}/questoes`)
      .set("Authorization", seed.tokenProfessor)
      .send({
        questaoId: seed.questaoId,
        ordemOriginal: 1,
        pontuacaoMax: 2,
      });

    expect(response.statusCode).toBe(404);
  });

  it("deve bloquear com 422 questão de matéria diferente da prova", async () => {
    const response = await request(app.server)
      .post(`/api/v1/provas/${seed.provaId}/questoes`)
      .set("Authorization", seed.tokenProfessor)
      .send({
        questaoId: seed.questaoOutraMateriaId,
        ordemOriginal: 1,
        pontuacaoMax: 2,
      });

    expect(response.statusCode).toBe(422);
    expect(response.body.error.message).toContain("mesma matéria");
  });

  it("deve bloquear com 409 adição de questão quando prova já foi publicada", async () => {
    const response = await request(app.server)
      .post(`/api/v1/provas/${seed.provaPublicadaId}/questoes`)
      .set("Authorization", seed.tokenProfessor)
      .send({
        questaoId: seed.questaoId,
        ordemOriginal: 2,
        pontuacaoMax: 1,
      });

    expect(response.statusCode).toBe(409);
  });

  it("deve bloquear com 409 ordemOriginal duplicada dentro da mesma prova", async () => {
    await request(app.server)
      .post(`/api/v1/provas/${seed.provaId}/questoes`)
      .set("Authorization", seed.tokenProfessor)
      .send({
        questaoId: seed.questaoId,
        ordemOriginal: 1,
        pontuacaoMax: 1,
      });

    const response = await request(app.server)
      .post(`/api/v1/provas/${seed.provaId}/questoes`)
      .set("Authorization", seed.tokenProfessor)
      .send({
        questaoId: seed.segundaQuestaoId,
        ordemOriginal: 1,
        pontuacaoMax: 1,
      });

    expect(response.statusCode).toBe(409);
  });

  it("deve remover questão de prova em rascunho e confirmar ausência no banco", async () => {
    await pool.query(
      'INSERT INTO "prova_questao" ("prova_id", "questao_id", "ordem_original", "pontuacao_max") VALUES ($1, $2, $3, $4)',
      [seed.provaId, seed.questaoId, 1, 2],
    );

    const response = await request(app.server)
      .delete(`/api/v1/provas/${seed.provaId}/questoes/${seed.questaoId}`)
      .set("Authorization", seed.tokenProfessor);

    expect(response.statusCode).toBe(204);

    const persisted = await pool.query(
      'SELECT 1 FROM "prova_questao" WHERE "prova_id" = $1 AND "questao_id" = $2',
      [seed.provaId, seed.questaoId],
    );
    expect(persisted.rows).toHaveLength(0);
  });

  it("deve retornar 422 ao remover questão com provaId inválido", async () => {
    const response = await request(app.server)
      .delete(`/api/v1/provas/prova-invalida/questoes/${seed.questaoId}`)
      .set("Authorization", seed.tokenProfessor);

    expect(response.statusCode).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("deve retornar 404 ao remover questão que não está vinculada à prova", async () => {
    const response = await request(app.server)
      .delete(`/api/v1/provas/${seed.provaId}/questoes/${seed.questaoId}`)
      .set("Authorization", seed.tokenProfessor);

    expect(response.statusCode).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("deve bloquear com 409 remoção de questão quando a prova já foi publicada", async () => {
    const vinculada = await pool.query<{ questao_id: string }>(
      'SELECT "questao_id" FROM "prova_questao" WHERE "prova_id" = $1 LIMIT 1',
      [seed.provaPublicadaId],
    );

    const response = await request(app.server)
      .delete(`/api/v1/provas/${seed.provaPublicadaId}/questoes/${vinculada.rows[0].questao_id}`)
      .set("Authorization", seed.tokenProfessor);

    expect(response.statusCode).toBe(409);
    expect(response.body.error.code).toBe("CONFLICT");
  });
});
