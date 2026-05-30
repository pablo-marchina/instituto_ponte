import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { buildApp } from "../app.js";
import { pool } from "../database/pool.js";

const TEST_PREFIX = "correcao-auto-api-test";

type Seed = {
  professorId: string;
  provaId: string;
  respostaMultiplaId: string;
  respostaVfId: string;
  respostaDiscursivaId: string;
  alternativaMultiplaCorretaId: string;
  alternativaMultiplaErradaId: string;
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

const createObjetiva = async (
  materiaId: string,
  tipo: "multipla_escolha" | "verdadeiro_falso",
  enunciado: string,
) => {
  const questao = await pool.query<{ id: string }>(
    'INSERT INTO "questao" ("materia_id", "tipo") VALUES ($1, $2) RETURNING "id"',
    [materiaId, tipo],
  );
  await pool.query('INSERT INTO "enunciado" ("questao_id", "conteudo_latex") VALUES ($1, $2)', [
    questao.rows[0].id,
    enunciado,
  ]);
  const correta = await pool.query<{ id: string }>(
    `
      INSERT INTO "alternativa" ("questao_id", "ordem_original", "conteudo_latex", "correta")
      VALUES ($1, 1, 'Correta', TRUE)
      RETURNING "id"
    `,
    [questao.rows[0].id],
  );
  const errada = await pool.query<{ id: string }>(
    `
      INSERT INTO "alternativa" ("questao_id", "ordem_original", "conteudo_latex", "correta")
      VALUES ($1, 2, 'Errada', FALSE)
      RETURNING "id"
    `,
    [questao.rows[0].id],
  );

  return { questaoId: questao.rows[0].id, corretaId: correta.rows[0].id, erradaId: errada.rows[0].id };
};

const createDiscursiva = async (materiaId: string) => {
  const questao = await pool.query<{ id: string }>(
    'INSERT INTO "questao" ("materia_id", "tipo") VALUES ($1, $2) RETURNING "id"',
    [materiaId, "discursiva"],
  );
  await pool.query('INSERT INTO "enunciado" ("questao_id", "conteudo_latex") VALUES ($1, $2)', [
    questao.rows[0].id,
    "Explique sua resposta.",
  ]);
  return questao.rows[0].id;
};

const createSeed = async (): Promise<Seed> => {
  const suffix = randomUUID();
  const coordenador = await pool.query<{ id: string }>(
    'INSERT INTO "coordenador" ("nome", "email") VALUES ($1, $2) RETURNING "id"',
    ["Coordenador Auto", `${TEST_PREFIX}-coord-${suffix}@example.com`],
  );
  const professor = await pool.query<{ id: string }>(
    'INSERT INTO "professor" ("coordenador_id", "nome", "email") VALUES ($1, $2, $3) RETURNING "id"',
    [coordenador.rows[0].id, "Professor Auto", `${TEST_PREFIX}-prof-${suffix}@example.com`],
  );
  const materia = await pool.query<{ id: string }>(
    'INSERT INTO "materia" ("nome", "codigo") VALUES ($1, $2) RETURNING "id"',
    [`Matemática Auto ${suffix}`, `${TEST_PREFIX}-${suffix}`],
  );
  await pool.query('INSERT INTO "materia_professor" ("materia_id", "professor_id") VALUES ($1, $2)', [
    materia.rows[0].id,
    professor.rows[0].id,
  ]);

  const prova = await pool.query<{ id: string }>(
    `
      INSERT INTO "prova" ("professor_id", "materia_id", "titulo", "turma", "semestre")
      VALUES ($1, $2, 'Prova objetiva', 'A', '2026.1')
      RETURNING "id"
    `,
    [professor.rows[0].id, materia.rows[0].id],
  );

  const multipla = await createObjetiva(materia.rows[0].id, "multipla_escolha", "Escolha.");
  const vf = await createObjetiva(materia.rows[0].id, "verdadeiro_falso", "V ou F.");
  const discursivaId = await createDiscursiva(materia.rows[0].id);

  for (const [index, item] of [
    { questaoId: multipla.questaoId, pontos: 2 },
    { questaoId: vf.questaoId, pontos: 1 },
    { questaoId: discursivaId, pontos: 3 },
  ].entries()) {
    await pool.query(
      'INSERT INTO "prova_questao" ("prova_id", "questao_id", "ordem_original", "pontuacao_max") VALUES ($1, $2, $3, $4)',
      [prova.rows[0].id, item.questaoId, index + 1, item.pontos],
    );
  }
  await pool.query(
    `
      UPDATE "prova"
      SET "data_inicio" = CURRENT_TIMESTAMP - INTERVAL '1 hour',
          "data_fim" = CURRENT_TIMESTAMP + INTERVAL '1 hour',
          "url_acesso" = $1,
          "status" = 'publicada'
      WHERE "id" = $2
    `,
    [`https://app.test/auto/${suffix}`, prova.rows[0].id],
  );

  const aluno = await pool.query<{ id: string }>(
    `
      INSERT INTO "aluno" ("nome", "email", "cpf", "aceitou_termos_em")
      VALUES ('Aluno Auto', $1, '40000000001', CURRENT_TIMESTAMP)
      RETURNING "id"
    `,
    [`${TEST_PREFIX}-aluno-${suffix}@example.com`],
  );
  const provaAluno = await pool.query<{ id: string }>(
    `
      INSERT INTO "prova_aluno" ("prova_id", "aluno_id", "status")
      VALUES ($1, $2, 'em_andamento')
      RETURNING "id"
    `,
    [prova.rows[0].id, aluno.rows[0].id],
  );

  const respostaMultipla = await pool.query<{ id: string }>(
    `
      INSERT INTO "resposta_aluno" ("prova_aluno_id", "questao_id", "alternativa_id", "rascunho")
      VALUES ($1, $2, $3, FALSE)
      RETURNING "id"
    `,
    [provaAluno.rows[0].id, multipla.questaoId, multipla.corretaId],
  );
  const respostaVf = await pool.query<{ id: string }>(
    `
      INSERT INTO "resposta_aluno" ("prova_aluno_id", "questao_id", "alternativa_id", "rascunho")
      VALUES ($1, $2, $3, FALSE)
      RETURNING "id"
    `,
    [provaAluno.rows[0].id, vf.questaoId, vf.erradaId],
  );
  const respostaDiscursiva = await pool.query<{ id: string }>(
    `
      INSERT INTO "resposta_aluno" ("prova_aluno_id", "questao_id", "resposta_texto", "rascunho")
      VALUES ($1, $2, 'Texto discursivo', FALSE)
      RETURNING "id"
    `,
    [provaAluno.rows[0].id, discursivaId],
  );
  await pool.query('UPDATE "prova_aluno" SET "status" = $1 WHERE "id" = $2', ["enviada", provaAluno.rows[0].id]);

  return {
    professorId: professor.rows[0].id,
    provaId: prova.rows[0].id,
    respostaMultiplaId: respostaMultipla.rows[0].id,
    respostaVfId: respostaVf.rows[0].id,
    respostaDiscursivaId: respostaDiscursiva.rows[0].id,
    alternativaMultiplaCorretaId: multipla.corretaId,
    alternativaMultiplaErradaId: multipla.erradaId,
    tokenProfessor: `Bearer test-professor:${professor.rows[0].id}:professor@example.com:Professor Auto`,
  };
};

describe("CorrecaoAutomaticaController - integração", () => {
  const app = buildApp();
  let seed: Seed;

  beforeAll(async () => {
    await app.ready();
    await pool.query('SELECT 1 FROM "correcao" LIMIT 1');
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

  it("deve corrigir automaticamente múltipla escolha e verdadeiro/falso, mantendo discursiva como pendente", async () => {
    const response = await request(app.server)
      .post(`/api/v1/provas/${seed.provaId}/correcao/objetivas`)
      .set("Authorization", seed.tokenProfessor);

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        provaId: seed.provaId,
        respostasCorrigidas: 2,
        discursivasPendentes: 1,
      },
    });

    const correcoes = await pool.query<{ resposta_id: string; nota: string; tipo: string }>(
      'SELECT "resposta_id", "nota", "tipo" FROM "correcao" ORDER BY "resposta_id"',
    );
    expect(correcoes.rows).toHaveLength(2);
    expect(correcoes.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ resposta_id: seed.respostaMultiplaId, nota: "2.00", tipo: "automatica" }),
        expect.objectContaining({ resposta_id: seed.respostaVfId, nota: "0.00", tipo: "automatica" }),
      ]),
    );
    expect(correcoes.rows.some((row) => row.resposta_id === seed.respostaDiscursivaId)).toBe(false);
  });

  it("deve recalcular nota objetiva quando o gabarito é alterado antes da liberação de resultados", async () => {
    await request(app.server)
      .post(`/api/v1/provas/${seed.provaId}/correcao/objetivas`)
      .set("Authorization", seed.tokenProfessor);

    await pool.query('UPDATE "alternativa" SET "correta" = FALSE WHERE "id" = $1', [
      seed.alternativaMultiplaCorretaId,
    ]);
    await pool.query('UPDATE "alternativa" SET "correta" = TRUE WHERE "id" = $1', [seed.alternativaMultiplaErradaId]);

    const response = await request(app.server)
      .post(`/api/v1/provas/${seed.provaId}/correcao/objetivas`)
      .set("Authorization", seed.tokenProfessor);

    expect(response.statusCode).toBe(200);
    const recalc = await pool.query<{ nota: string }>('SELECT "nota" FROM "correcao" WHERE "resposta_id" = $1', [
      seed.respostaMultiplaId,
    ]);
    expect(recalc.rows[0].nota).toBe("0.00");
  });
});
