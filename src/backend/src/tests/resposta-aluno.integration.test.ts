import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { buildApp } from "../app.js";
import { pool } from "../database/pool.js";

const TEST_PREFIX = "resposta-aluno-api-test";

type Seed = {
  provaId: string;
  provaAlunoId: string;
  provaAlunoExpiradaId: string;
  objetivaId: string;
  alternativaId: string;
  discursivaId: string;
  questaoEmBrancoId: string;
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
  await pool.query('DELETE FROM "aluno" WHERE "email" LIKE $1', [`${TEST_PREFIX}%`]);
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

const createDiscursiva = async (materiaId: string, conteudoLatex: string, limiteCaracteres?: number) => {
  const questao = await pool.query<{ id: string }>(
    `
      INSERT INTO "questao" ("materia_id", "tipo", "limite_caracteres")
      VALUES ($1, 'discursiva', $2)
      RETURNING "id"
    `,
    [materiaId, limiteCaracteres ?? null],
  );
  await pool.query('INSERT INTO "enunciado" ("questao_id", "conteudo_latex") VALUES ($1, $2)', [
    questao.rows[0].id,
    conteudoLatex,
  ]);
  return questao.rows[0].id;
};

const createObjetiva = async (materiaId: string) => {
  const questao = await pool.query<{ id: string }>(
    'INSERT INTO "questao" ("materia_id", "tipo") VALUES ($1, $2) RETURNING "id"',
    [materiaId, "multipla_escolha"],
  );
  await pool.query('INSERT INTO "enunciado" ("questao_id", "conteudo_latex") VALUES ($1, $2)', [
    questao.rows[0].id,
    "Escolha a alternativa correta.",
  ]);
  const alternativa = await pool.query<{ id: string }>(
    `
      INSERT INTO "alternativa" ("questao_id", "ordem_original", "conteudo_latex", "correta")
      VALUES ($1, 1, 'Alternativa A', TRUE)
      RETURNING "id"
    `,
    [questao.rows[0].id],
  );
  await pool.query(
    `
      INSERT INTO "alternativa" ("questao_id", "ordem_original", "conteudo_latex", "correta")
      VALUES ($1, 2, 'Alternativa B', FALSE)
    `,
    [questao.rows[0].id],
  );

  return { questaoId: questao.rows[0].id, alternativaId: alternativa.rows[0].id };
};

const createProvaAluno = async (provaId: string, suffix: string, cpf: string) => {
  const aluno = await pool.query<{ id: string }>(
    `
      INSERT INTO "aluno" ("nome", "email", "cpf", "aceitou_termos_em")
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      RETURNING "id"
    `,
    ["Aluno Resposta", `${TEST_PREFIX}-aluno-${suffix}@example.com`, cpf],
  );
  const provaAluno = await pool.query<{ id: string }>(
    `
      INSERT INTO "prova_aluno" ("prova_id", "aluno_id", "status")
      VALUES ($1, $2, 'em_andamento')
      RETURNING "id"
    `,
    [provaId, aluno.rows[0].id],
  );
  return provaAluno.rows[0].id;
};

const createSeed = async (): Promise<Seed> => {
  const suffix = randomUUID();
  const coordenador = await pool.query<{ id: string }>(
    'INSERT INTO "coordenador" ("nome", "email") VALUES ($1, $2) RETURNING "id"',
    ["Coordenador Resposta", `${TEST_PREFIX}-coord-${suffix}@example.com`],
  );
  const professor = await pool.query<{ id: string }>(
    'INSERT INTO "professor" ("coordenador_id", "nome", "email") VALUES ($1, $2, $3) RETURNING "id"',
    [coordenador.rows[0].id, "Professor Resposta", `${TEST_PREFIX}-prof-${suffix}@example.com`],
  );
  const materia = await pool.query<{ id: string }>(
    'INSERT INTO "materia" ("nome", "codigo") VALUES ($1, $2) RETURNING "id"',
    [`Matemática Resposta ${suffix}`, `${TEST_PREFIX}-${suffix}`],
  );
  await pool.query('INSERT INTO "materia_professor" ("materia_id", "professor_id") VALUES ($1, $2)', [
    materia.rows[0].id,
    professor.rows[0].id,
  ]);

  const prova = await pool.query<{ id: string }>(
    `
      INSERT INTO "prova" (
        "professor_id", "materia_id", "titulo", "turma", "semestre"
      )
      VALUES ($1, $2, $3, 'A', '2026.1')
      RETURNING "id"
    `,
    [professor.rows[0].id, materia.rows[0].id, "Prova respostas"],
  );
  const provaExpirada = await pool.query<{ id: string }>(
    `
      INSERT INTO "prova" (
        "professor_id", "materia_id", "titulo", "turma", "semestre"
      )
      VALUES ($1, $2, $3, 'B', '2026.1')
      RETURNING "id"
    `,
    [professor.rows[0].id, materia.rows[0].id, "Prova expirada"],
  );

  const objetiva = await createObjetiva(materia.rows[0].id);
  const discursivaId = await createDiscursiva(materia.rows[0].id, "Responda em poucas palavras.", 20);
  const questaoEmBrancoId = await createDiscursiva(materia.rows[0].id, "Questão ainda em branco.");
  const questaoExpiradaId = await createDiscursiva(materia.rows[0].id, "Questão expirada.");

  for (const [index, questaoId] of [objetiva.questaoId, discursivaId, questaoEmBrancoId].entries()) {
    await pool.query(
      'INSERT INTO "prova_questao" ("prova_id", "questao_id", "ordem_original", "pontuacao_max") VALUES ($1, $2, $3, 1)',
      [prova.rows[0].id, questaoId, index + 1],
    );
  }
  await pool.query(
    'INSERT INTO "prova_questao" ("prova_id", "questao_id", "ordem_original", "pontuacao_max") VALUES ($1, $2, 1, 1)',
    [provaExpirada.rows[0].id, questaoExpiradaId],
  );
  await pool.query(
    `
      UPDATE "prova"
      SET "data_inicio" = CURRENT_TIMESTAMP - INTERVAL '1 hour',
          "data_fim" = CURRENT_TIMESTAMP + INTERVAL '1 hour',
          "url_acesso" = $1,
          "status" = 'publicada'
      WHERE "id" = $2
    `,
    [`https://app.test/respostas/${suffix}`, prova.rows[0].id],
  );
  await pool.query(
    `
      UPDATE "prova"
      SET "data_inicio" = CURRENT_TIMESTAMP - INTERVAL '2 hours',
          "data_fim" = CURRENT_TIMESTAMP + INTERVAL '1 hour',
          "url_acesso" = $1,
          "status" = 'publicada'
      WHERE "id" = $2
    `,
    [`https://app.test/respostas-expirada/${suffix}`, provaExpirada.rows[0].id],
  );

  const provaAlunoId = await createProvaAluno(prova.rows[0].id, suffix, "10000000001");
  const provaAlunoExpiradaId = await createProvaAluno(
    provaExpirada.rows[0].id,
    `expirada-${suffix}`,
    "10000000002",
  );
  await pool.query('UPDATE "prova" SET "data_fim" = CURRENT_TIMESTAMP - INTERVAL \'1 minute\' WHERE "id" = $1', [
    provaExpirada.rows[0].id,
  ]);

  return {
    provaId: prova.rows[0].id,
    provaAlunoId,
    provaAlunoExpiradaId,
    objetivaId: objetiva.questaoId,
    alternativaId: objetiva.alternativaId,
    discursivaId,
    questaoEmBrancoId,
  };
};

describe("RespostaAlunoController - integração", () => {
  const app = buildApp();
  let seed: Seed;

  beforeAll(async () => {
    await app.ready();
    await pool.query('SELECT 1 FROM "resposta_aluno" LIMIT 1');
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

  it("deve salvar resposta objetiva com alternativa marcada e persistir no banco", async () => {
    const response = await request(app.server)
      .put(`/api/v1/public/provas-aluno/${seed.provaAlunoId}/respostas/${seed.objetivaId}`)
      .send({ alternativaId: seed.alternativaId, rascunho: true });

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        rascunho: true,
      },
    });
    expect(response.body.data.id).toEqual(expect.any(String));
    expect(response.body.data.sincronizadaEm).toEqual(expect.any(String));

    const persisted = await pool.query<{ alternativa_id: string }>(
      'SELECT "alternativa_id" FROM "resposta_aluno" WHERE "id" = $1',
      [response.body.data.id],
    );
    expect(persisted.rows[0].alternativa_id).toBe(seed.alternativaId);
  });

  it("deve rejeitar com 422 resposta objetiva quando alternativaId não é enviado", async () => {
    const response = await request(app.server)
      .put(`/api/v1/public/provas-aluno/${seed.provaAlunoId}/respostas/${seed.objetivaId}`)
      .send({ rascunho: true });

    expect(response.statusCode).toBe(422);
    expect(response.body.error.code).toBe("BUSINESS_RULE_ERROR");
  });

  it("deve retornar 404 ao salvar resposta para provaAluno inexistente", async () => {
    const response = await request(app.server)
      .put(`/api/v1/public/provas-aluno/${randomUUID()}/respostas/${seed.objetivaId}`)
      .send({ alternativaId: seed.alternativaId, rascunho: true });

    expect(response.statusCode).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("deve retornar 404 ao salvar resposta para questão que não pertence à prova do aluno", async () => {
    const response = await request(app.server)
      .put(`/api/v1/public/provas-aluno/${seed.provaAlunoId}/respostas/${randomUUID()}`)
      .send({ respostaTexto: "Resposta", rascunho: true });

    expect(response.statusCode).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("deve salvar resposta discursiva com respostaTexto e persistir no banco", async () => {
    const response = await request(app.server)
      .put(`/api/v1/public/provas-aluno/${seed.provaAlunoId}/respostas/${seed.discursivaId}`)
      .send({ respostaTexto: "Resposta curta", rascunho: true });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.rascunho).toBe(true);

    const persisted = await pool.query<{ resposta_texto: string }>(
      'SELECT "resposta_texto" FROM "resposta_aluno" WHERE "id" = $1',
      [response.body.data.id],
    );
    expect(persisted.rows[0].resposta_texto).toBe("Resposta curta");
  });

  it("deve rejeitar com 422 resposta discursiva quando texto excede o limite de caracteres", async () => {
    const response = await request(app.server)
      .put(`/api/v1/public/provas-aluno/${seed.provaAlunoId}/respostas/${seed.discursivaId}`)
      .send({ respostaTexto: "Esta resposta certamente passa do limite", rascunho: true });

    expect(response.statusCode).toBe(422);
    expect(response.body.error.code).toBe("BUSINESS_RULE_ERROR");
  });

  it("deve bloquear com 409 resposta quando prova está fora do período (dataFim já passou)", async () => {
    const response = await request(app.server)
      .put(`/api/v1/public/provas-aluno/${seed.provaAlunoExpiradaId}/respostas/${seed.discursivaId}`)
      .send({ respostaTexto: "Tarde demais", rascunho: true });

    expect(response.statusCode).toBe(409);
    expect(response.body.error.code).toBe("CONFLICT");
  });

  it("deve listar respostas salvas do aluno para a prova", async () => {
    await request(app.server)
      .put(`/api/v1/public/provas-aluno/${seed.provaAlunoId}/respostas/${seed.discursivaId}`)
      .send({ respostaTexto: "Resposta curta", rascunho: true });

    const response = await request(app.server).get(`/api/v1/public/provas-aluno/${seed.provaAlunoId}/respostas`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: [
        {
          provaAlunoId: seed.provaAlunoId,
          questaoId: seed.discursivaId,
          respostaTexto: "Resposta curta",
          rascunho: true,
        },
      ],
    });
  });

  it("deve retornar 404 ao listar respostas de provaAluno inexistente", async () => {
    const response = await request(app.server).get(`/api/v1/public/provas-aluno/${randomUUID()}/respostas`);

    expect(response.statusCode).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("deve enviar prova final, listar questões em branco e bloquear novas alterações após envio", async () => {
    await request(app.server)
      .put(`/api/v1/public/provas-aluno/${seed.provaAlunoId}/respostas/${seed.objetivaId}`)
      .send({ alternativaId: seed.alternativaId, rascunho: true });

    const envio = await request(app.server)
      .post(`/api/v1/public/provas-aluno/${seed.provaAlunoId}/enviar`)
      .send({ confirmarEnvio: true });

    expect(envio.statusCode).toBe(200);
    expect(envio.body).toMatchObject({
      success: true,
      data: {
        provaAlunoId: seed.provaAlunoId,
        status: "enviada",
        questoesEmBranco: expect.arrayContaining([seed.discursivaId, seed.questaoEmBrancoId]),
      },
    });
    expect(envio.body.data.enviadaEm).toEqual(expect.any(String));

    const blocked = await request(app.server)
      .put(`/api/v1/public/provas-aluno/${seed.provaAlunoId}/respostas/${seed.discursivaId}`)
      .send({ respostaTexto: "Depois do envio", rascunho: true });
    expect(blocked.statusCode).toBe(409);
  });

  it("deve retornar 404 ao enviar provaAluno inexistente", async () => {
    const response = await request(app.server)
      .post(`/api/v1/public/provas-aluno/${randomUUID()}/enviar`)
      .send({ confirmarEnvio: true });

    expect(response.statusCode).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });
});
