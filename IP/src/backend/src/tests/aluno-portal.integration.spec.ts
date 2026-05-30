import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { buildApp } from "../app.js";
import { pool } from "../database/pool.js";

const TEST_PREFIX = "aluno-portal-api-test";

type Seed = {
  professorId: string;
  materiaId: string;
  provaId: string;
  provaFuturaId: string;
  questaoId: string;
  slug: string;
  slugFuturo: string;
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

const createQuestao = async (materiaId: string) => {
  const questao = await pool.query<{ id: string }>(
    'INSERT INTO "questao" ("materia_id", "tipo", "pontuacao_padrao") VALUES ($1, $2, $3) RETURNING "id"',
    [materiaId, "discursiva", 1],
  );
  await pool.query('INSERT INTO "enunciado" ("questao_id", "conteudo_latex") VALUES ($1, $2)', [
    questao.rows[0].id,
    "Explique o raciocínio usado.",
  ]);
  return questao.rows[0].id;
};

const createProva = async (professorId: string, materiaId: string, titulo: string) => {
  const prova = await pool.query<{ id: string }>(
    `
      INSERT INTO "prova" ("professor_id", "materia_id", "titulo", "turma", "semestre", "tempo_limite_min", "instrucoes")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING "id"
    `,
    [professorId, materiaId, titulo, "A", "2026.1", 60, "Leia com atenção."],
  );
  return prova.rows[0].id;
};

const publishProva = async (provaId: string, urlAcesso: string, futuro = false) => {
  await pool.query(
    `
      UPDATE "prova"
      SET "data_inicio" = CURRENT_TIMESTAMP + $1::interval,
          "data_fim" = CURRENT_TIMESTAMP + $2::interval,
          "url_acesso" = $3,
          "status" = 'publicada'
      WHERE "id" = $4
    `,
    [futuro ? "1 hour" : "-1 hour", futuro ? "2 hours" : "1 hour", urlAcesso, provaId],
  );
};

const createSeed = async (): Promise<Seed> => {
  const suffix = randomUUID();
  const slug = `portal-${suffix}`;
  const slugFuturo = `portal-futuro-${suffix}`;
  const coordenador = await pool.query<{ id: string }>(
    'INSERT INTO "coordenador" ("nome", "email") VALUES ($1, $2) RETURNING "id"',
    ["Coordenador Portal", `${TEST_PREFIX}-coord-${suffix}@example.com`],
  );
  const professor = await pool.query<{ id: string }>(
    'INSERT INTO "professor" ("coordenador_id", "nome", "email") VALUES ($1, $2, $3) RETURNING "id"',
    [coordenador.rows[0].id, "Professor Portal", `${TEST_PREFIX}-prof-${suffix}@example.com`],
  );
  const materia = await pool.query<{ id: string }>(
    'INSERT INTO "materia" ("nome", "codigo") VALUES ($1, $2) RETURNING "id"',
    [`Matemática Portal ${suffix}`, `${TEST_PREFIX}-${suffix}`],
  );
  await pool.query('INSERT INTO "materia_professor" ("materia_id", "professor_id") VALUES ($1, $2)', [
    materia.rows[0].id,
    professor.rows[0].id,
  ]);

  const provaId = await createProva(professor.rows[0].id, materia.rows[0].id, "Prova pública");
  const provaFuturaId = await createProva(professor.rows[0].id, materia.rows[0].id, "Prova futura");
  const questaoId = await createQuestao(materia.rows[0].id);
  const questaoFuturaId = await createQuestao(materia.rows[0].id);

  await pool.query(
    'INSERT INTO "prova_questao" ("prova_id", "questao_id", "ordem_original", "pontuacao_max") VALUES ($1, $2, $3, $4)',
    [provaId, questaoId, 1, 1],
  );
  await pool.query(
    'INSERT INTO "prova_questao" ("prova_id", "questao_id", "ordem_original", "pontuacao_max") VALUES ($1, $2, $3, $4)',
    [provaFuturaId, questaoFuturaId, 1, 1],
  );

  await publishProva(provaId, `https://app.test/provas/${slug}`);
  await publishProva(provaFuturaId, `https://app.test/provas/${slugFuturo}`, true);

  return {
    professorId: professor.rows[0].id,
    materiaId: materia.rows[0].id,
    provaId,
    provaFuturaId,
    questaoId,
    slug,
    slugFuturo,
  };
};

const alunoPayload = (suffix: string = randomUUID()) => ({
  nome: "Edgar Romeo",
  email: `${TEST_PREFIX}-aluno-${suffix}@example.com`,
  cpf: suffix.replace(/\D/g, "").padEnd(11, "0").slice(0, 11),
  aceiteTermos: true,
});

describe("AlunoPortalController - integração", () => {
  const app = buildApp();
  let seed: Seed;

  beforeAll(async () => {
    await app.ready();
    await pool.query('SELECT 1 FROM "aluno" LIMIT 1');
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

  it("deve exibir dados públicos da prova quando o slug existe e a prova está dentro do período", async () => {
    const response = await request(app.server).get(`/api/v1/public/provas/${seed.slug}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        titulo: "Prova pública",
        instrucoes: "Leia com atenção.",
        tempoLimiteMin: 60,
        disponivel: true,
      },
    });
    expect(response.body.data.dataInicio).toEqual(expect.any(String));
    expect(response.body.data.dataFim).toEqual(expect.any(String));
  });

  it("deve retornar 404 quando o slug da prova não existe", async () => {
    const response = await request(app.server).get("/api/v1/public/provas/link-inexistente");

    expect(response.statusCode).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("deve bloquear com 409 acesso a prova cujo período ainda não começou", async () => {
    const response = await request(app.server).get(`/api/v1/public/provas/${seed.slugFuturo}`);

    expect(response.statusCode).toBe(409);
    expect(response.body.error.code).toBe("CONFLICT");
  });

  it("deve iniciar prova com dados válidos do aluno, persistir aluno e prova_aluno, retornar questões", async () => {
    const payload = alunoPayload();

    const response = await request(app.server).post(`/api/v1/public/provas/${seed.slug}/iniciar`).send(payload);

    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        status: "em_andamento",
        questoes: [
          {
            id: seed.questaoId,
            ordem: 1,
            tipo: "discursiva",
            enunciado: {
              conteudoLatex: "Explique o raciocínio usado.",
              urlImagem: null,
            },
            alternativas: [],
          },
        ],
      },
    });
    expect(response.body.data.provaAlunoId).toEqual(expect.any(String));

    const persisted = await pool.query<{ status: string; email: string }>(
      `
        SELECT pa."status", a."email"
        FROM "prova_aluno" pa
        JOIN "aluno" a ON a."id" = pa."aluno_id"
        WHERE pa."id" = $1
      `,
      [response.body.data.provaAlunoId],
    );
    expect(persisted.rows[0]).toMatchObject({ status: "em_andamento", email: payload.email });
  });

  it("deve rejeitar com 422 inicio de prova com CPF inválido", async () => {
    const response = await request(app.server)
      .post(`/api/v1/public/provas/${seed.slug}/iniciar`)
      .send({ ...alunoPayload(), cpf: "123" });

    expect(response.statusCode).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("deve rejeitar com 422 inicio de prova quando aceiteTermos é false", async () => {
    const response = await request(app.server)
      .post(`/api/v1/public/provas/${seed.slug}/iniciar`)
      .send({ ...alunoPayload(), aceiteTermos: false });

    expect(response.statusCode).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("deve bloquear com 409 nova submissão quando o aluno já enviou a prova", async () => {
    const payload = alunoPayload("12345678901");
    const firstResponse = await request(app.server).post(`/api/v1/public/provas/${seed.slug}/iniciar`).send(payload);
    await pool.query('UPDATE "prova_aluno" SET "status" = $1 WHERE "id" = $2', [
      "enviada",
      firstResponse.body.data.provaAlunoId,
    ]);

    const response = await request(app.server).post(`/api/v1/public/provas/${seed.slug}/iniciar`).send(payload);

    expect(response.statusCode).toBe(409);
    expect(response.body.error.code).toBe("CONFLICT");
  });
});
