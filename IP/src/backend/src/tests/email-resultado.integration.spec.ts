import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { buildApp } from "../app.js";
import { pool } from "../database/pool.js";

const TEST_PREFIX = "email-api-test";

type Seed = {
  provaId: string;
  professorId: string;
  vinculadoToken: string;
  naoVinculadoToken: string;
  coordenadorToken: string;
  provaAlunoIds: string[];
  emailEnvioId?: string;
};

const cleanup = async () => {
  await pool.query(
    `DELETE FROM "email_envio" WHERE "prova_aluno_id" IN (
      SELECT "id" FROM "prova_aluno" WHERE "aluno_id" IN (
        SELECT "id" FROM "aluno" WHERE "email" LIKE $1
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

const createSeed = async (comPendencias = true): Promise<Seed> => {
  const suffix = randomUUID();
  const coordenador = await pool.query<{ id: string }>(
    `INSERT INTO "coordenador" ("nome", "email") VALUES ($1, $2) RETURNING "id"`,
    ["Coordenador Email", `${TEST_PREFIX}-coord-${suffix}@example.com`],
  );
  const vinculado = await pool.query<{ id: string }>(
    `INSERT INTO "professor" ("coordenador_id", "nome", "email") VALUES ($1, $2, $3) RETURNING "id"`,
    [coordenador.rows[0].id, "Prof Vinculado", `${TEST_PREFIX}-vin-${suffix}@example.com`],
  );
  const naoVinculado = await pool.query<{ id: string }>(
    `INSERT INTO "professor" ("coordenador_id", "nome", "email") VALUES ($1, $2, $3) RETURNING "id"`,
    [coordenador.rows[0].id, "Prof Nao Vinculado", `${TEST_PREFIX}-nv-${suffix}@example.com`],
  );
  const materia = await pool.query<{ id: string }>(
    `INSERT INTO "materia" ("nome", "codigo") VALUES ($1, $2) RETURNING "id"`,
    [`Matéria Email ${suffix}`, `${TEST_PREFIX}-${suffix}`],
  );
  await pool.query('INSERT INTO "materia_professor" ("materia_id", "professor_id") VALUES ($1, $2)', [
    materia.rows[0].id,
    vinculado.rows[0].id,
  ]);

  const prova = await pool.query<{ id: string }>(
    `INSERT INTO "prova" ("professor_id", "materia_id", "titulo", "turma", "semestre")
     VALUES ($1, $2, 'Prova Email', 'A', '2026.1') RETURNING "id"`,
    [vinculado.rows[0].id, materia.rows[0].id],
  );

  const questao = await pool.query<{ id: string }>(
    `INSERT INTO "questao" ("materia_id", "tipo") VALUES ($1, $2) RETURNING "id"`,
    [materia.rows[0].id, "discursiva"],
  );
  await pool.query('INSERT INTO "enunciado" ("questao_id", "conteudo_latex") VALUES ($1, $2)', [
    questao.rows[0].id,
    "Enunciado email.",
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
    [`https://app.test/email/${suffix}`, prova.rows[0].id],
  );

  const provaAlunoIds: string[] = [];
  for (let index = 0; index < 3; index += 1) {
    const aluno = await pool.query<{ id: string }>(
      `INSERT INTO "aluno" ("nome", "email", "cpf", "aceitou_termos_em")
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING "id"`,
      [`Aluno Email ${index}`, `${TEST_PREFIX}-aluno-${index}-${suffix}@example.com`, `5000000000${index}`],
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
      [pa.rows[0].id, questao.rows[0].id, `Resposta ${index}`],
    );

    await pool.query(`UPDATE "prova_aluno" SET "status" = 'enviada' WHERE "id" = $1`, [pa.rows[0].id]);

    const corrigir = comPendencias ? index < 2 : true;
    if (corrigir) {
      await pool.query(
        `INSERT INTO "correcao" ("resposta_id", "professor_id", "nota", "tipo")
         VALUES ($1, $2, 1.5, 'manual')`,
        [resposta.rows[0].id, vinculado.rows[0].id],
      );
      await pool.query(`UPDATE "prova_aluno" SET "status" = 'corrigida' WHERE "id" = $1`, [pa.rows[0].id]);
    }

    provaAlunoIds.push(pa.rows[0].id);
  }

  return {
    provaId: prova.rows[0].id,
    professorId: vinculado.rows[0].id,
    vinculadoToken: `Bearer test-professor:${vinculado.rows[0].id}:${TEST_PREFIX}-vin-${suffix}@example.com:Vinculado`,
    naoVinculadoToken: `Bearer test-professor:${naoVinculado.rows[0].id}:${TEST_PREFIX}-nv-${suffix}@example.com:Nao Vinculado`,
    coordenadorToken: `Bearer test-coordenador:${coordenador.rows[0].id}:${TEST_PREFIX}-coord-${suffix}@example.com:Coordenador`,
    provaAlunoIds,
  };
};

describe("EmailResultadoController - integração", () => {
  const app = buildApp();
  let seed: Seed;

  beforeAll(async () => {
    await app.ready();
    await pool.query('SELECT 1 FROM "email_envio" LIMIT 1');
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

  describe("POST /api/v1/provas/:provaId/resultados/liberar-email", () => {
    it("deve criar envios individuais para cada aluno quando a prova não tem pendências de correção", async () => {
      await cleanup();
      seed = await createSeed(false);

      const response = await request(app.server)
        .post(`/api/v1/provas/${seed.provaId}/resultados/liberar-email`)
        .set("Authorization", seed.vinculadoToken)
        .send({});

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.enviados).toBe(3);
      expect(response.body.data.falhas).toBe(0);
      expect(response.body.data.pendentes).toBe(0);

      const envios = await pool.query(
        `SELECT "id", "status", "destinatario" FROM "email_envio"
         WHERE "prova_aluno_id" = ANY($1::uuid[])`,
        [seed.provaAlunoIds],
      );
      expect(envios.rows).toHaveLength(3);
      envios.rows.forEach((e) => {
        expect(e.status).toBe("enviado");
      });
    });

    it("deve bloquear envio com 409 quando há pendências de correção e confirmarPendencias não é true", async () => {
      const response = await request(app.server)
        .post(`/api/v1/provas/${seed.provaId}/resultados/liberar-email`)
        .set("Authorization", seed.coordenadorToken)
        .send({ confirmarPendencias: false });

      expect(response.statusCode).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("CONFLICT");
      expect(response.body.error.message).toContain("pendência");
    });

    it("deve permitir envio mesmo com pendências quando confirmarPendencias é true", async () => {
      const response = await request(app.server)
        .post(`/api/v1/provas/${seed.provaId}/resultados/liberar-email`)
        .set("Authorization", seed.coordenadorToken)
        .send({ confirmarPendencias: true });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.enviados).toBe(2);
      expect(response.body.data.pendentes).toBe(1);
    });

    it("deve retornar 403 quando professor não vinculado tenta liberar e-mail", async () => {
      const response = await request(app.server)
        .post(`/api/v1/provas/${seed.provaId}/resultados/liberar-email`)
        .set("Authorization", seed.naoVinculadoToken)
        .send({});

      expect(response.statusCode).toBe(403);
    });

    it("deve rejeitar com 401 quando não há token de autenticação", async () => {
      const response = await request(app.server)
        .post(`/api/v1/provas/${seed.provaId}/resultados/liberar-email`)
        .send({});

      expect(response.statusCode).toBe(401);
    });
  });

  describe("GET /api/v1/provas/:provaId/emails", () => {
    it("deve listar histórico de envios da prova quando autenticado como coordenador", async () => {
      await request(app.server)
        .post(`/api/v1/provas/${seed.provaId}/resultados/liberar-email`)
        .set("Authorization", seed.vinculadoToken)
        .send({ confirmarPendencias: true });

      const response = await request(app.server)
        .get(`/api/v1/provas/${seed.provaId}/emails`)
        .set("Authorization", seed.coordenadorToken);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0]).toMatchObject({
        id: expect.any(String),
        destinatario: expect.any(String),
        assunto: expect.any(String),
        status: "enviado",
      });
    });

    it("deve retornar 403 quando professor não vinculado lista e-mails da prova", async () => {
      const response = await request(app.server)
        .get(`/api/v1/provas/${seed.provaId}/emails`)
        .set("Authorization", seed.naoVinculadoToken);

      expect(response.statusCode).toBe(403);
    });
  });

  describe("POST /api/v1/emails/:emailEnvioId/reenviar", () => {
    it("deve reenviar e-mail com status erro e atualizar para enviado", async () => {
      const envio = await pool.query(
        `INSERT INTO "email_envio" ("prova_aluno_id", "destinatario", "assunto", "corpo", "status", "erro")
         VALUES ($1, 'aluno@test.com', 'Resultado', 'Corpo', 'erro', 'Falha na conexão')
         RETURNING "id"`,
        [seed.provaAlunoIds[0]],
      );

      const response = await request(app.server)
        .post(`/api/v1/emails/${envio.rows[0].id}/reenviar`)
        .set("Authorization", seed.coordenadorToken);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("enviado");
    });

    it("deve bloquear com 409 retry de envio cujo status já é enviado", async () => {
      const envio = await pool.query(
        `INSERT INTO "email_envio" ("prova_aluno_id", "destinatario", "assunto", "corpo", "status")
         VALUES ($1, 'aluno@test.com', 'Resultado', 'Corpo', 'enviado')
         RETURNING "id"`,
        [seed.provaAlunoIds[0]],
      );

      const response = await request(app.server)
        .post(`/api/v1/emails/${envio.rows[0].id}/reenviar`)
        .set("Authorization", seed.coordenadorToken);

      expect(response.statusCode).toBe(409);
      expect(response.body.error.code).toBe("CONFLICT");
    });

    it("deve retornar 422 quando emailEnvioId não é um UUID válido", async () => {
      const response = await request(app.server)
        .post("/api/v1/emails/id-invalido/reenviar")
        .set("Authorization", seed.coordenadorToken);

      expect(response.statusCode).toBe(422);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("validação de params nas rotas de e-mail", () => {
    it("deve retornar 422 no liberar-email quando provaId não é UUID válido", async () => {
      const response = await request(app.server)
        .post("/api/v1/provas/id-invalido/resultados/liberar-email")
        .set("Authorization", seed.vinculadoToken)
        .send({});

      expect(response.statusCode).toBe(422);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("deve retornar 422 no GET emails quando provaId não é UUID válido", async () => {
      const response = await request(app.server)
        .get("/api/v1/provas/id-invalido/emails")
        .set("Authorization", seed.vinculadoToken);

      expect(response.statusCode).toBe(422);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });
});
