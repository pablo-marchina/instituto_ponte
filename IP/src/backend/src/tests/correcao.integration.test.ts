import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { buildApp } from "../app.js";
import { pool } from "../database/pool.js";

const TEST_PREFIX = "correcao-api-test";

type Seed = {
  professorId: string;
  outroProfessorId: string;
  provaId: string;
  discursivaId: string;
  outraQuestaoId: string;
  respostaId: string;
  tokenProfessor: string;
  tokenOutroProfessor: string;
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

const createDiscursiva = async (materiaId: string, conteudoLatex: string) => {
  const questao = await pool.query<{ id: string }>(
    'INSERT INTO "questao" ("materia_id", "tipo", "permite_anexo") VALUES ($1, $2, TRUE) RETURNING "id"',
    [materiaId, "discursiva"],
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
    ["Coordenador Correção", `${TEST_PREFIX}-coord-${suffix}@example.com`],
  );
  const professor = await pool.query<{ id: string }>(
    'INSERT INTO "professor" ("coordenador_id", "nome", "email") VALUES ($1, $2, $3) RETURNING "id"',
    [coordenador.rows[0].id, "Professor Correção", `${TEST_PREFIX}-prof-${suffix}@example.com`],
  );
  const outroProfessor = await pool.query<{ id: string }>(
    'INSERT INTO "professor" ("coordenador_id", "nome", "email") VALUES ($1, $2, $3) RETURNING "id"',
    [coordenador.rows[0].id, "Professor Sem Vínculo", `${TEST_PREFIX}-outro-${suffix}@example.com`],
  );
  const materia = await pool.query<{ id: string }>(
    'INSERT INTO "materia" ("nome", "codigo") VALUES ($1, $2) RETURNING "id"',
    [`Matemática Correção ${suffix}`, `${TEST_PREFIX}-${suffix}`],
  );
  await pool.query('INSERT INTO "materia_professor" ("materia_id", "professor_id") VALUES ($1, $2)', [
    materia.rows[0].id,
    professor.rows[0].id,
  ]);

  const prova = await pool.query<{ id: string }>(
    `
      INSERT INTO "prova" ("professor_id", "materia_id", "titulo", "turma", "semestre")
      VALUES ($1, $2, 'Prova correção', 'A', '2026.1')
      RETURNING "id"
    `,
    [professor.rows[0].id, materia.rows[0].id],
  );
  const discursivaId = await createDiscursiva(materia.rows[0].id, "Explique a solução.");
  const outraQuestaoId = await createDiscursiva(materia.rows[0].id, "Outra questão.");

  await pool.query(
    'INSERT INTO "prova_questao" ("prova_id", "questao_id", "ordem_original", "pontuacao_max") VALUES ($1, $2, 1, 2)',
    [prova.rows[0].id, discursivaId],
  );
  await pool.query(
    'INSERT INTO "prova_questao" ("prova_id", "questao_id", "ordem_original", "pontuacao_max") VALUES ($1, $2, 2, 1)',
    [prova.rows[0].id, outraQuestaoId],
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
    [`https://app.test/correcao/${suffix}`, prova.rows[0].id],
  );

  const aluno = await pool.query<{ id: string }>(
    `
      INSERT INTO "aluno" ("nome", "email", "cpf", "aceitou_termos_em")
      VALUES ('Aluno Correção', $1, '30000000001', CURRENT_TIMESTAMP)
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
  const resposta = await pool.query<{ id: string }>(
    `
      INSERT INTO "resposta_aluno" ("prova_aluno_id", "questao_id", "resposta_texto", "rascunho")
      VALUES ($1, $2, 'Resposta do aluno', FALSE)
      RETURNING "id"
    `,
    [provaAluno.rows[0].id, discursivaId],
  );
  await pool.query(
    `
      INSERT INTO "resposta_anexo" ("resposta_id", "url_arquivo", "nome_arquivo", "mime_type", "tamanho_bytes")
      VALUES ($1, '/uploads/a.png', 'a.png', 'image/png', 10)
    `,
    [resposta.rows[0].id],
  );
  await pool.query('UPDATE "prova_aluno" SET "status" = $1 WHERE "id" = $2', ["enviada", provaAluno.rows[0].id]);

  return {
    professorId: professor.rows[0].id,
    outroProfessorId: outroProfessor.rows[0].id,
    provaId: prova.rows[0].id,
    discursivaId,
    outraQuestaoId,
    respostaId: resposta.rows[0].id,
    tokenProfessor: `Bearer test-professor:${professor.rows[0].id}:professor@example.com:Professor Correção`,
    tokenOutroProfessor: `Bearer test-professor:${outroProfessor.rows[0].id}:outro@example.com:Professor Sem Vínculo`,
  };
};

describe("CorrecaoController - integração", () => {
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

  it("deve listar questões corrigíveis da prova com total e corrigidas por questão", async () => {
    const response = await request(app.server)
      .get(`/api/v1/provas/${seed.provaId}/correcao/questoes`)
      .set("Authorization", seed.tokenProfessor);

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: [
        {
          questaoId: seed.discursivaId,
          ordemOriginal: 1,
          respostas: {
            total: 1,
            corrigidas: 0,
          },
        },
        {
          questaoId: seed.outraQuestaoId,
          ordemOriginal: 2,
          respostas: {
            total: 0,
            corrigidas: 0,
          },
        },
      ],
    });
  });

  it("deve listar respostas de uma questão específica com anexos sem incluir outras questões", async () => {
    const response = await request(app.server)
      .get(`/api/v1/provas/${seed.provaId}/questoes/${seed.discursivaId}/respostas`)
      .set("Authorization", seed.tokenProfessor);

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: [
        {
          respostaId: seed.respostaId,
          aluno: {
            nome: "Aluno Correção",
          },
          respostaTexto: "Resposta do aluno",
          anexos: [
            {
              urlArquivo: "/uploads/a.png",
              mimeType: "image/png",
            },
          ],
          correcao: null,
        },
      ],
    });
  });

  it("deve salvar correção manual com nota e observação e persistir no banco", async () => {
    const response = await request(app.server)
      .put(`/api/v1/respostas/${seed.respostaId}/correcao`)
      .set("Authorization", seed.tokenProfessor)
      .send({
        nota: 1.5,
        observacao: "Boa resolução.",
        feedback: "Revise a justificativa final.",
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        nota: 1.5,
        tipo: "manual",
      },
    });
    expect(response.body.data.id).toEqual(expect.any(String));
    expect(response.body.data.corrigidaEm).toEqual(expect.any(String));

    const persisted = await pool.query<{ nota: string; observacao: string }>(
      'SELECT "nota", "observacao" FROM "correcao" WHERE "resposta_id" = $1',
      [seed.respostaId],
    );
    expect(Number(persisted.rows[0].nota)).toBe(1.5);
    expect(persisted.rows[0].observacao).toBe("Boa resolução.");
  });

  it("deve bloquear com 422 nota acima da pontuação máxima da questão", async () => {
    const response = await request(app.server)
      .put(`/api/v1/respostas/${seed.respostaId}/correcao`)
      .set("Authorization", seed.tokenProfessor)
      .send({ nota: 3 });

    expect(response.statusCode).toBe(422);
    expect(response.body.error.code).toBe("BUSINESS_RULE_ERROR");
  });

  it("deve retornar 422 quando respostaId não é UUID válido", async () => {
    const response = await request(app.server)
      .put("/api/v1/respostas/resposta-invalida/correcao")
      .set("Authorization", seed.tokenProfessor)
      .send({ nota: 1 });

    expect(response.statusCode).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("deve retornar 404 ao corrigir resposta inexistente", async () => {
    const response = await request(app.server)
      .put(`/api/v1/respostas/${randomUUID()}/correcao`)
      .set("Authorization", seed.tokenProfessor)
      .send({ nota: 1 });

    expect(response.statusCode).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("deve bloquear com 409 correção antes do envio final da prova", async () => {
    const aluno = await pool.query<{ id: string }>(
      `
        INSERT INTO "aluno" ("nome", "email", "cpf", "aceitou_termos_em")
        VALUES ('Aluno Em Andamento', $1, '30000000002', CURRENT_TIMESTAMP)
        RETURNING "id"
      `,
      [`${TEST_PREFIX}-andamento-${randomUUID()}@example.com`],
    );
    const provaAluno = await pool.query<{ id: string }>(
      'INSERT INTO "prova_aluno" ("prova_id", "aluno_id", "status") VALUES ($1, $2, $3) RETURNING "id"',
      [seed.provaId, aluno.rows[0].id, "em_andamento"],
    );
    const resposta = await pool.query<{ id: string }>(
      `
        INSERT INTO "resposta_aluno" ("prova_aluno_id", "questao_id", "resposta_texto", "rascunho")
        VALUES ($1, $2, 'Resposta ainda não enviada', FALSE)
        RETURNING "id"
      `,
      [provaAluno.rows[0].id, seed.discursivaId],
    );

    const response = await request(app.server)
      .put(`/api/v1/respostas/${resposta.rows[0].id}/correcao`)
      .set("Authorization", seed.tokenProfessor)
      .send({ nota: 1 });

    expect(response.statusCode).toBe(409);
    expect(response.body.error.code).toBe("CONFLICT");
  });

  it("deve bloquear com 403 professor sem vínculo com a matéria da prova", async () => {
    const response = await request(app.server)
      .put(`/api/v1/respostas/${seed.respostaId}/correcao`)
      .set("Authorization", seed.tokenOutroProfessor)
      .send({ nota: 1 });

    expect(response.statusCode).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });
});
