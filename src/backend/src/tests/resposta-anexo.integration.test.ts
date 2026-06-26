import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { buildApp } from "../app.js";
import { pool } from "../database/pool.js";

const TEST_PREFIX = "resposta-anexo-api-test";

type Seed = {
  respostaComAnexoId: string;
  respostaSemAnexoId: string;
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

const createQuestao = async (materiaId: string, permiteAnexo: boolean) => {
  const questao = await pool.query<{ id: string }>(
    `
      INSERT INTO "questao" ("materia_id", "tipo", "permite_anexo")
      VALUES ($1, 'discursiva', $2)
      RETURNING "id"
    `,
    [materiaId, permiteAnexo],
  );
  await pool.query('INSERT INTO "enunciado" ("questao_id", "conteudo_latex") VALUES ($1, $2)', [
    questao.rows[0].id,
    permiteAnexo ? "Questão com anexo." : "Questão sem anexo.",
  ]);
  return questao.rows[0].id;
};

const createSeed = async (): Promise<Seed> => {
  const suffix = randomUUID();
  const coordenador = await pool.query<{ id: string }>(
    'INSERT INTO "coordenador" ("nome", "email") VALUES ($1, $2) RETURNING "id"',
    ["Coordenador Anexo", `${TEST_PREFIX}-coord-${suffix}@example.com`],
  );
  const professor = await pool.query<{ id: string }>(
    'INSERT INTO "professor" ("coordenador_id", "nome", "email") VALUES ($1, $2, $3) RETURNING "id"',
    [coordenador.rows[0].id, "Professor Anexo", `${TEST_PREFIX}-prof-${suffix}@example.com`],
  );
  const materia = await pool.query<{ id: string }>(
    'INSERT INTO "materia" ("nome", "codigo") VALUES ($1, $2) RETURNING "id"',
    [`Matemática Anexo ${suffix}`, `${TEST_PREFIX}-${suffix}`],
  );
  await pool.query('INSERT INTO "materia_professor" ("materia_id", "professor_id") VALUES ($1, $2)', [
    materia.rows[0].id,
    professor.rows[0].id,
  ]);

  const prova = await pool.query<{ id: string }>(
    `
      INSERT INTO "prova" ("professor_id", "materia_id", "titulo", "turma", "semestre")
      VALUES ($1, $2, $3, 'A', '2026.1')
      RETURNING "id"
    `,
    [professor.rows[0].id, materia.rows[0].id, "Prova anexos"],
  );
  const questaoComAnexoId = await createQuestao(materia.rows[0].id, true);
  const questaoSemAnexoId = await createQuestao(materia.rows[0].id, false);

  for (const [index, questaoId] of [questaoComAnexoId, questaoSemAnexoId].entries()) {
    await pool.query(
      'INSERT INTO "prova_questao" ("prova_id", "questao_id", "ordem_original", "pontuacao_max") VALUES ($1, $2, $3, 1)',
      [prova.rows[0].id, questaoId, index + 1],
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
    [`https://app.test/anexos/${suffix}`, prova.rows[0].id],
  );

  const aluno = await pool.query<{ id: string }>(
    `
      INSERT INTO "aluno" ("nome", "email", "cpf", "aceitou_termos_em")
      VALUES ($1, $2, '20000000001', CURRENT_TIMESTAMP)
      RETURNING "id"
    `,
    ["Aluno Anexo", `${TEST_PREFIX}-aluno-${suffix}@example.com`],
  );
  const provaAluno = await pool.query<{ id: string }>(
    `
      INSERT INTO "prova_aluno" ("prova_id", "aluno_id", "status")
      VALUES ($1, $2, 'em_andamento')
      RETURNING "id"
    `,
    [prova.rows[0].id, aluno.rows[0].id],
  );

  const respostaComAnexo = await pool.query<{ id: string }>(
    `
      INSERT INTO "resposta_aluno" ("prova_aluno_id", "questao_id", "resposta_texto")
      VALUES ($1, $2, 'Resposta com anexo')
      RETURNING "id"
    `,
    [provaAluno.rows[0].id, questaoComAnexoId],
  );
  const respostaSemAnexo = await pool.query<{ id: string }>(
    `
      INSERT INTO "resposta_aluno" ("prova_aluno_id", "questao_id", "resposta_texto")
      VALUES ($1, $2, 'Resposta sem anexo')
      RETURNING "id"
    `,
    [provaAluno.rows[0].id, questaoSemAnexoId],
  );

  return {
    respostaComAnexoId: respostaComAnexo.rows[0].id,
    respostaSemAnexoId: respostaSemAnexo.rows[0].id,
  };
};

describe("RespostaAnexoController - integração", () => {
  const app = buildApp();
  let seed: Seed;

  beforeAll(async () => {
    await app.ready();
    await pool.query('SELECT 1 FROM "resposta_anexo" LIMIT 1');
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

  it("deve salvar metadados do anexo quando upload é de tipo de arquivo permitido", async () => {
    const response = await request(app.server)
      .post(`/api/v1/public/respostas/${seed.respostaComAnexoId}/anexos`)
      .attach("file", Buffer.from("conteudo do arquivo"), {
        filename: "resposta.png",
        contentType: "image/png",
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        urlArquivo: expect.stringContaining("/uploads/respostas/"),
        mimeType: "image/png",
        tamanhoBytes: Buffer.byteLength("conteudo do arquivo"),
      },
    });
    expect(response.body.data.id).toEqual(expect.any(String));

    const persisted = await pool.query<{ mime_type: string; tamanho_bytes: number }>(
      'SELECT "mime_type", "tamanho_bytes" FROM "resposta_anexo" WHERE "id" = $1',
      [response.body.data.id],
    );
    expect(persisted.rows[0]).toMatchObject({
      mime_type: "image/png",
      tamanho_bytes: Buffer.byteLength("conteudo do arquivo"),
    });
  });

  it("deve rejeitar com 422 upload de arquivo com tipo MIME não permitido (txt)", async () => {
    const response = await request(app.server)
      .post(`/api/v1/public/respostas/${seed.respostaComAnexoId}/anexos`)
      .attach("file", Buffer.from("texto"), {
        filename: "resposta.txt",
        contentType: "text/plain",
      });

    expect(response.statusCode).toBe(422);
    expect(response.body.error.code).toBe("BUSINESS_RULE_ERROR");
  });

  it("deve rejeitar com 422 quando respostaId não é UUID válido", async () => {
    const response = await request(app.server)
      .post("/api/v1/public/respostas/resposta-invalida/anexos")
      .attach("file", Buffer.from("conteudo"), {
        filename: "resposta.png",
        contentType: "image/png",
      });

    expect(response.statusCode).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("deve rejeitar com 422 arquivo cujo tamanho excede 5MB", async () => {
    const response = await request(app.server)
      .post(`/api/v1/public/respostas/${seed.respostaComAnexoId}/anexos`)
      .attach("file", Buffer.alloc(5 * 1024 * 1024 + 1), {
        filename: "resposta.pdf",
        contentType: "application/pdf",
      });

    expect(response.statusCode).toBe(422);
    expect(response.body.error.code).toBe("BUSINESS_RULE_ERROR");
  });

  it("deve rejeitar com 409 upload quando a questão não permite anexo", async () => {
    const response = await request(app.server)
      .post(`/api/v1/public/respostas/${seed.respostaSemAnexoId}/anexos`)
      .attach("file", Buffer.from("conteudo"), {
        filename: "resposta.jpg",
        contentType: "image/jpeg",
      });

    expect(response.statusCode).toBe(409);
    expect(response.body.error.code).toBe("CONFLICT");
  });

  it("deve retornar 404 quando resposta não existe", async () => {
    const response = await request(app.server)
      .post(`/api/v1/public/respostas/${randomUUID()}/anexos`)
      .attach("file", Buffer.from("conteudo"), {
        filename: "resposta.pdf",
        contentType: "application/pdf",
      });

    expect(response.statusCode).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });
});
