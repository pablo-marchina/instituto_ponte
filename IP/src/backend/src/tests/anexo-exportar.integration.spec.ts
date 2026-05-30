import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { buildApp } from "../app.js";
import { pool } from "../database/pool.js";

const TEST_PREFIX = "export-anexo-test";

let app: ReturnType<typeof buildApp>;

const cleanup = async () => {
  await pool.query(
    `DELETE FROM "resposta_anexo" WHERE "resposta_id" IN (
      SELECT "id" FROM "resposta_aluno" WHERE "prova_aluno_id" IN (
        SELECT "id" FROM "prova_aluno" WHERE "prova_id" IN (
          SELECT "id" FROM "prova" WHERE "professor_id" IN (
            SELECT "id" FROM "professor" WHERE "email" LIKE $1
          )
        )
      )
    )`,
    [`${TEST_PREFIX}%`],
  );
  await pool.query(
    `DELETE FROM "resposta_aluno" WHERE "prova_aluno_id" IN (
      SELECT "id" FROM "prova_aluno" WHERE "prova_id" IN (
        SELECT "id" FROM "prova" WHERE "professor_id" IN (
          SELECT "id" FROM "professor" WHERE "email" LIKE $1
        )
      )
    )`,
    [`${TEST_PREFIX}%`],
  );
  await pool.query(
    `DELETE FROM "prova_aluno" WHERE "prova_id" IN (
      SELECT "id" FROM "prova" WHERE "professor_id" IN (
        SELECT "id" FROM "professor" WHERE "email" LIKE $1
      )
    )`,
    [`${TEST_PREFIX}%`],
  );
  await pool.query(
    `DELETE FROM "prova" WHERE "professor_id" IN (
      SELECT "id" FROM "professor" WHERE "email" LIKE $1
    )`,
    [`${TEST_PREFIX}%`],
  );
  await pool.query(
    'DELETE FROM "questao" WHERE "materia_id" IN (SELECT "id" FROM "materia" WHERE "codigo" LIKE $1)',
    [`${TEST_PREFIX}%`],
  );
  await pool.query(
    'DELETE FROM "materia_professor" WHERE "materia_id" IN (SELECT "id" FROM "materia" WHERE "codigo" LIKE $1)',
    [`${TEST_PREFIX}%`],
  );
  await pool.query('DELETE FROM "aluno" WHERE "email" LIKE $1', [`${TEST_PREFIX}%`]);
  await pool.query('DELETE FROM "professor" WHERE "email" LIKE $1', [`${TEST_PREFIX}%`]);
  await pool.query('DELETE FROM "materia" WHERE "codigo" LIKE $1', [`${TEST_PREFIX}%`]);
  await pool.query('DELETE FROM "coordenador" WHERE "email" LIKE $1', [`${TEST_PREFIX}%`]);
};

type Seed = {
  provaId: string;
  professorVinculadoToken: string;
  professorNaoVinculadoToken: string;
  coordenadorToken: string;
  anexoIds: string[];
};

const createSeed = async (): Promise<Seed> => {
  const suffix = randomUUID();
  const coord = await pool.query<{ id: string }>(
    `INSERT INTO "coordenador" ("nome", "email") VALUES ($1, $2) RETURNING "id"`,
    ["Coord Anexo", `${TEST_PREFIX}-coord-${suffix}@example.com`],
  );
  const vin = await pool.query<{ id: string }>(
    `INSERT INTO "professor" ("coordenador_id", "nome", "email") VALUES ($1, $2, $3) RETURNING "id"`,
    [coord.rows[0].id, "Prof Vinculado", `${TEST_PREFIX}-vin-${suffix}@example.com`],
  );
  const nv = await pool.query<{ id: string }>(
    `INSERT INTO "professor" ("coordenador_id", "nome", "email") VALUES ($1, $2, $3) RETURNING "id"`,
    [coord.rows[0].id, "Prof Nao Vinculado", `${TEST_PREFIX}-nv-${suffix}@example.com`],
  );
  const materia = await pool.query<{ id: string }>(
    `INSERT INTO "materia" ("nome", "codigo") VALUES ($1, $2) RETURNING "id"`,
    [`Matéria Anexo ${suffix}`, `${TEST_PREFIX}-${suffix}`],
  );
  await pool.query('INSERT INTO "materia_professor" ("materia_id", "professor_id") VALUES ($1, $2)', [
    materia.rows[0].id,
    vin.rows[0].id,
  ]);

  const prova = await pool.query<{ id: string }>(
    `INSERT INTO "prova" ("professor_id", "materia_id", "titulo", "turma", "semestre")
     VALUES ($1, $2, 'Prova Anexo', 'A', '2026.1') RETURNING "id"`,
    [vin.rows[0].id, materia.rows[0].id],
  );

  const questao = await pool.query<{ id: string }>(
    `INSERT INTO "questao" ("materia_id", "tipo", "permite_anexo") VALUES ($1, $2, $3) RETURNING "id"`,
    [materia.rows[0].id, "discursiva", true],
  );
  await pool.query('INSERT INTO "enunciado" ("questao_id", "conteudo_latex") VALUES ($1, $2)', [
    questao.rows[0].id,
    "Enunciado anexo.",
  ]);
  await pool.query(
    `INSERT INTO "prova_questao" ("prova_id", "questao_id", "ordem_original", "pontuacao_max")
     VALUES ($1, $2, 1, 2)`,
    [prova.rows[0].id, questao.rows[0].id],
  );

  await pool.query(
    `UPDATE "prova"
     SET "data_inicio" = CURRENT_TIMESTAMP - INTERVAL '2 hours',
         "data_fim" = CURRENT_TIMESTAMP + INTERVAL '1 hour',
         "url_acesso" = $1,
         "status" = 'publicada'
     WHERE "id" = $2`,
    [`https://app.test/anexo/${suffix}`, prova.rows[0].id],
  );

  const anexoIds: string[] = [];
  for (let i = 0; i < 2; i += 1) {
    const aluno = await pool.query<{ id: string }>(
      `INSERT INTO "aluno" ("nome", "email", "cpf", "aceitou_termos_em")
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING "id"`,
      [`Aluno ${i}`, `${TEST_PREFIX}-aluno-${i}-${suffix}@example.com`, `8364224000${i}`],
    );
    const pa = await pool.query<{ id: string }>(
      `INSERT INTO "prova_aluno" ("prova_id", "aluno_id", "status")
       VALUES ($1, $2, 'nao_iniciada') RETURNING "id"`,
      [prova.rows[0].id, aluno.rows[0].id],
    );
    await pool.query(`UPDATE "prova_aluno" SET "status" = 'em_andamento' WHERE "id" = $1`, [pa.rows[0].id]);

    const resposta = await pool.query<{ id: string }>(
      `INSERT INTO "resposta_aluno" ("prova_aluno_id", "questao_id", "resposta_texto", "rascunho", "enviada_final")
       VALUES ($1, $2, $3, FALSE, TRUE) RETURNING "id"`,
      [pa.rows[0].id, questao.rows[0].id, `Resposta ${i}`],
    );
    await pool.query(`UPDATE "prova_aluno" SET "status" = 'enviada' WHERE "id" = $1`, [pa.rows[0].id]);

    const anexo = await pool.query<{ id: string }>(
      `INSERT INTO "resposta_anexo" ("resposta_id", "url_arquivo", "nome_arquivo", "mime_type", "tamanho_bytes")
       VALUES ($1, $2, $3, $4, $5) RETURNING "id"`,
      [resposta.rows[0].id, `/uploads/test/${suffix}/anexo-${i}.pdf`, `anexo-${i}.pdf`, "application/pdf", 1024],
    );
    anexoIds.push(anexo.rows[0].id);
  }

  return {
    provaId: prova.rows[0].id,
    professorVinculadoToken: `Bearer test-professor:${vin.rows[0].id}`,
    professorNaoVinculadoToken: `Bearer test-professor:${nv.rows[0].id}`,
    coordenadorToken: `Bearer test-coordenador:${coord.rows[0].id}`,
    anexoIds,
  };
};

let seed: Seed;

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
  seed = await createSeed();
});

describe("AnexoExportarController - integração", () => {
  it("deve exportar anexos da prova como coordenador e retornar lista com metadados", async () => {
    const response = await request(app.server)
      .post(`/api/v1/provas/${seed.provaId}/anexos/exportar`)
      .set("Authorization", seed.coordenadorToken);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBe(2);
    expect(response.body.data[0]).toMatchObject({
      id: expect.any(String),
      nomeArquivo: expect.any(String),
      mimeType: "application/pdf",
      tamanhoBytes: 1024,
      urlArquivo: expect.any(String),
      aluno: expect.any(String),
    });
  });

  it("deve retornar 403 quando professor não vinculado tenta exportar anexos", async () => {
    const response = await request(app.server)
      .post(`/api/v1/provas/${seed.provaId}/anexos/exportar`)
      .set("Authorization", seed.professorNaoVinculadoToken);

    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 404 quando a prova não existe", async () => {
    const response = await request(app.server)
      .post(`/api/v1/provas/${randomUUID()}/anexos/exportar`)
      .set("Authorization", seed.coordenadorToken);

    expect(response.statusCode).toBe(404);
  });

  it("deve retornar 401 quando não há token de autenticação", async () => {
    const response = await request(app.server).post(`/api/v1/provas/${seed.provaId}/anexos/exportar`);
    expect(response.statusCode).toBe(401);
  });
});
