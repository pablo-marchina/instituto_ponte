import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { buildApp } from "../app.js";
import { pool } from "../database/pool.js";

const TEST_PREFIX = "prova-publicacao-api-test";

type Seed = {
  professorId: string;
  materiaId: string;
  provaId: string;
  provaSemQuestoesId: string;
  provaObjetivaInvalidaId: string;
  provaPublicadaId: string;
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
  await pool.query('DELETE FROM "professor" WHERE "email" LIKE $1', [`${TEST_PREFIX}%`]);
  await pool.query('DELETE FROM "materia" WHERE "codigo" LIKE $1', [`${TEST_PREFIX}%`]);
  await pool.query('DELETE FROM "coordenador" WHERE "email" LIKE $1', [`${TEST_PREFIX}%`]);
};

const createProva = async (professorId: string, materiaId: string, titulo: string) => {
  const result = await pool.query<{ id: string }>(
    `
      INSERT INTO "prova" ("professor_id", "materia_id", "titulo", "turma", "semestre")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING "id"
    `,
    [professorId, materiaId, titulo, "A", "2026.1"],
  );
  return result.rows[0].id;
};

const createDiscursiva = async (materiaId: string, conteudoLatex: string) => {
  const questao = await pool.query<{ id: string }>(
    'INSERT INTO "questao" ("materia_id", "tipo") VALUES ($1, $2) RETURNING "id"',
    [materiaId, "discursiva"],
  );
  await pool.query('INSERT INTO "enunciado" ("questao_id", "conteudo_latex") VALUES ($1, $2)', [
    questao.rows[0].id,
    conteudoLatex,
  ]);
  return questao.rows[0].id;
};

const createMultiplaEscolhaInvalida = async (materiaId: string) => {
  const questao = await pool.query<{ id: string }>(
    'INSERT INTO "questao" ("materia_id", "tipo") VALUES ($1, $2) RETURNING "id"',
    [materiaId, "multipla_escolha"],
  );
  await pool.query('INSERT INTO "enunciado" ("questao_id", "conteudo_latex") VALUES ($1, $2)', [
    questao.rows[0].id,
    "Questão objetiva sem gabarito suficiente.",
  ]);
  await pool.query(
    'INSERT INTO "alternativa" ("questao_id", "ordem_original", "conteudo_latex", "correta") VALUES ($1, $2, $3, $4)',
    [questao.rows[0].id, 1, "Alternativa única", false],
  );
  return questao.rows[0].id;
};

const vincularQuestao = async (provaId: string, questaoId: string) => {
  await pool.query(
    'INSERT INTO "prova_questao" ("prova_id", "questao_id", "ordem_original", "pontuacao_max") VALUES ($1, $2, $3, $4)',
    [provaId, questaoId, 1, 1],
  );
};

const createSeed = async (): Promise<Seed> => {
  const suffix = randomUUID();
  const coordenador = await pool.query<{ id: string }>(
    'INSERT INTO "coordenador" ("nome", "email") VALUES ($1, $2) RETURNING "id"',
    ["Coordenador Publicação", `${TEST_PREFIX}-coord-${suffix}@example.com`],
  );
  const professor = await pool.query<{ id: string }>(
    'INSERT INTO "professor" ("coordenador_id", "nome", "email") VALUES ($1, $2, $3) RETURNING "id"',
    [coordenador.rows[0].id, "Professor Publicação", `${TEST_PREFIX}-prof-${suffix}@example.com`],
  );
  const materia = await pool.query<{ id: string }>(
    'INSERT INTO "materia" ("nome", "codigo") VALUES ($1, $2) RETURNING "id"',
    [`Matemática Publicação ${suffix}`, `${TEST_PREFIX}-${suffix}`],
  );
  await pool.query('INSERT INTO "materia_professor" ("materia_id", "professor_id") VALUES ($1, $2)', [
    materia.rows[0].id,
    professor.rows[0].id,
  ]);

  const provaId = await createProva(professor.rows[0].id, materia.rows[0].id, "Prova publicável");
  const provaSemQuestoesId = await createProva(professor.rows[0].id, materia.rows[0].id, "Prova sem questões");
  const provaObjetivaInvalidaId = await createProva(
    professor.rows[0].id,
    materia.rows[0].id,
    "Prova objetiva inválida",
  );
  const provaPublicadaId = await createProva(professor.rows[0].id, materia.rows[0].id, "Prova já publicada");

  await vincularQuestao(provaId, await createDiscursiva(materia.rows[0].id, "Explique o processo."));
  await vincularQuestao(
    provaObjetivaInvalidaId,
    await createMultiplaEscolhaInvalida(materia.rows[0].id),
  );
  await vincularQuestao(provaPublicadaId, await createDiscursiva(materia.rows[0].id, "Questão publicada."));

  const inicio = "2026-06-01T10:00:00.000Z";
  const fim = "2026-06-01T12:00:00.000Z";
  for (const prova of [provaId, provaSemQuestoesId, provaObjetivaInvalidaId, provaPublicadaId]) {
    await pool.query('UPDATE "prova" SET "data_inicio" = $1, "data_fim" = $2 WHERE "id" = $3', [
      inicio,
      fim,
      prova,
    ]);
  }
  await pool.query(
    `
      UPDATE "prova"
      SET "url_acesso" = $1,
          "status" = 'publicada'
      WHERE "id" = $2
    `,
    [`https://app.test/prova/${suffix}`, provaPublicadaId],
  );

  return {
    professorId: professor.rows[0].id,
    materiaId: materia.rows[0].id,
    provaId,
    provaSemQuestoesId,
    provaObjetivaInvalidaId,
    provaPublicadaId,
    tokenProfessor: `Bearer test-professor:${professor.rows[0].id}:professor@example.com:Professor Publicação`,
  };
};

describe("ProvaPublicacaoController - integração", () => {
  const app = buildApp();
  let seed: Seed;

  beforeAll(async () => {
    await app.ready();
    await pool.query('SELECT 1 FROM "prova" LIMIT 1');
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

  it("deve salvar configurações de datas, tempo limite e embaralhamento quando dados são válidos", async () => {
    const response = await request(app.server)
      .patch(`/api/v1/provas/${seed.provaId}/configuracoes`)
      .set("Authorization", seed.tokenProfessor)
      .send({
        tempoLimiteMin: 60,
        dataInicio: "2026-07-01T12:00:00.000Z",
        dataFim: "2026-07-01T15:00:00.000Z",
        embaralharQuestoes: false,
        embaralharAlternativas: false,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        id: seed.provaId,
        tempoLimiteMin: 60,
        dataInicio: "2026-07-01T12:00:00.000Z",
        dataFim: "2026-07-01T15:00:00.000Z",
        embaralharQuestoes: false,
        embaralharAlternativas: false,
      },
    });
  });

  it("deve rejeitar com 422 configuração quando dataFim é anterior a dataInicio", async () => {
    const response = await request(app.server)
      .patch(`/api/v1/provas/${seed.provaId}/configuracoes`)
      .set("Authorization", seed.tokenProfessor)
      .send({
        dataInicio: "2026-07-01T15:00:00.000Z",
        dataFim: "2026-07-01T12:00:00.000Z",
      });

    expect(response.statusCode).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("deve rejeitar com 422 configuração quando tempoLimiteMin é zero ou negativo", async () => {
    const response = await request(app.server)
      .patch(`/api/v1/provas/${seed.provaId}/configuracoes`)
      .set("Authorization", seed.tokenProfessor)
      .send({ tempoLimiteMin: 0 });

    expect(response.statusCode).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("deve publicar prova válida e gerar urlAcesso único e qrCode", async () => {
    const response = await request(app.server)
      .post(`/api/v1/provas/${seed.provaId}/publicar`)
      .set("Authorization", seed.tokenProfessor)
      .send({ baseUrlAluno: "https://app.test/prova" });

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        id: seed.provaId,
        status: "publicada",
      },
    });
    expect(response.body.data.urlAcesso).toMatch(/^https:\/\/app\.test\/prova\/.+/);
    expect(response.body.data.qrCode).toBe(response.body.data.urlAcesso);
  });

  it("deve rejeitar com 409 publicação de prova que não possui questões vinculadas", async () => {
    const response = await request(app.server)
      .post(`/api/v1/provas/${seed.provaSemQuestoesId}/publicar`)
      .set("Authorization", seed.tokenProfessor)
      .send({ baseUrlAluno: "https://app.test/prova" });

    expect(response.statusCode).toBe(409);
    expect(response.body.error.message).toContain("sem questões");
  });

  it("deve rejeitar com 409 publicação de prova com questão objetiva sem alternativas/gabarito válidos", async () => {
    const response = await request(app.server)
      .post(`/api/v1/provas/${seed.provaObjetivaInvalidaId}/publicar`)
      .set("Authorization", seed.tokenProfessor)
      .send({ baseUrlAluno: "https://app.test/prova" });

    expect(response.statusCode).toBe(409);
    expect(response.body.error.message).toContain("objetivas");
  });

  it("deve encerrar prova publicada (status encerrada) e depois arquivá-la (status antiga)", async () => {
    const encerrar = await request(app.server)
      .post(`/api/v1/provas/${seed.provaPublicadaId}/encerrar`)
      .set("Authorization", seed.tokenProfessor);

    expect(encerrar.statusCode).toBe(200);
    expect(encerrar.body.data).toMatchObject({
      id: seed.provaPublicadaId,
      status: "encerrada",
    });

    const arquivar = await request(app.server)
      .post(`/api/v1/provas/${seed.provaPublicadaId}/arquivar`)
      .set("Authorization", seed.tokenProfessor);

    expect(arquivar.statusCode).toBe(200);
    expect(arquivar.body.data).toMatchObject({
      id: seed.provaPublicadaId,
      status: "antiga",
    });
  });
});
