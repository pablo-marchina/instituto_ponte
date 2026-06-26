import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { buildApp } from "../app.js";
import { pool } from "../database/pool.js";

const TEST_PREFIX = "analytics-api-test";

type Seed = {
  provaId: string;
  professorId: string;
  professorVinculadoToken: string;
  professorNaoVinculadoToken: string;
  coordenadorToken: string;
  provaAlunoId: string;
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

const createSeed = async (): Promise<Seed> => {
  const suffix = randomUUID();
  const coordenador = await pool.query<{ id: string }>(
    'INSERT INTO "coordenador" ("nome", "email") VALUES ($1, $2) RETURNING "id"',
    ["Coordenador Analytics", `${TEST_PREFIX}-coord-${suffix}@example.com`],
  );
  const profVinculado = await pool.query<{ id: string }>(
    'INSERT INTO "professor" ("coordenador_id", "nome", "email") VALUES ($1, $2, $3) RETURNING "id"',
    [coordenador.rows[0].id, "Professor Vinculado", `${TEST_PREFIX}-prof-vin-${suffix}@example.com`],
  );
  const profNaoVinculado = await pool.query<{ id: string }>(
    'INSERT INTO "professor" ("coordenador_id", "nome", "email") VALUES ($1, $2, $3) RETURNING "id"',
    [coordenador.rows[0].id, "Professor Não Vinculado", `${TEST_PREFIX}-prof-nv-${suffix}@example.com`],
  );
  const materia = await pool.query<{ id: string }>(
    'INSERT INTO "materia" ("nome", "codigo") VALUES ($1, $2) RETURNING "id"',
    [`Matéria Analytics ${suffix}`, `${TEST_PREFIX}-${suffix}`],
  );
  await pool.query('INSERT INTO "materia_professor" ("materia_id", "professor_id") VALUES ($1, $2)', [
    materia.rows[0].id,
    profVinculado.rows[0].id,
  ]);

  const prova = await pool.query<{ id: string }>(
    `
    INSERT INTO "prova" ("professor_id", "materia_id", "titulo", "turma", "semestre")
    VALUES ($1, $2, 'Prova Analytics', 'A', '2026.1')
    RETURNING "id"
  `,
    [profVinculado.rows[0].id, materia.rows[0].id],
  );

  const questao = await pool.query<{ id: string }>(
    'INSERT INTO "questao" ("materia_id", "tipo") VALUES ($1, $2) RETURNING "id"',
    [materia.rows[0].id, "discursiva"],
  );
  await pool.query('INSERT INTO "enunciado" ("questao_id", "conteudo_latex") VALUES ($1, $2)', [
    questao.rows[0].id,
    "Enunciado analytics.",
  ]);
  await pool.query(
    'INSERT INTO "prova_questao" ("prova_id", "questao_id", "ordem_original", "pontuacao_max") VALUES ($1, $2, 1, 2)',
    [prova.rows[0].id, questao.rows[0].id],
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
    [`https://app.test/analytics/${suffix}`, prova.rows[0].id],
  );

  const aluno = await pool.query<{ id: string }>(
    `INSERT INTO "aluno" ("nome", "email", "cpf", "aceitou_termos_em")
     VALUES ('Aluno Analytics', $1, '40000000002', CURRENT_TIMESTAMP)
     RETURNING "id"`,
    [`${TEST_PREFIX}-aluno-${suffix}@example.com`],
  );
  const provaAluno = await pool.query<{ id: string }>(
    `INSERT INTO "prova_aluno" ("prova_id", "aluno_id", "status")
     VALUES ($1, $2, 'em_andamento')
     RETURNING "id"`,
    [prova.rows[0].id, aluno.rows[0].id],
  );

  const resposta = await pool.query<{ id: string }>(
    `INSERT INTO "resposta_aluno" ("prova_aluno_id", "questao_id", "resposta_texto", "rascunho", "enviada_final")
     VALUES ($1, $2, 'Resposta para analytics', FALSE, TRUE)
     RETURNING "id"`,
    [provaAluno.rows[0].id, questao.rows[0].id],
  );
  await pool.query(
    `INSERT INTO "resposta_anexo" ("resposta_id", "url_arquivo", "mime_type", "tamanho_bytes")
     VALUES ($1, '/uploads/test/analytics.png', 'image/png', 1024)`,
    [resposta.rows[0].id],
  );
  await pool.query('UPDATE "prova_aluno" SET "status" = $1 WHERE "id" = $2', ["enviada", provaAluno.rows[0].id]);

  return {
    provaId: prova.rows[0].id,
    professorId: profVinculado.rows[0].id,
    professorVinculadoToken: `Bearer test-professor:${profVinculado.rows[0].id}:${TEST_PREFIX}-prof-vin-${suffix}@example.com:Professor Vinculado`,
    professorNaoVinculadoToken: `Bearer test-professor:${profNaoVinculado.rows[0].id}:${TEST_PREFIX}-prof-nv-${suffix}@example.com:Professor Nao Vinculado`,
    coordenadorToken: `Bearer test-coordenador:${coordenador.rows[0].id}:${TEST_PREFIX}-coord-${suffix}@example.com:Coordenador Analytics`,
    provaAlunoId: provaAluno.rows[0].id,
  };
};

describe("AnalyticsController - integração", () => {
  const app = buildApp();
  let seed: Seed;

  beforeAll(async () => {
    await app.ready();
    await pool.query('SELECT 1 FROM "avaliacao_log" LIMIT 1');
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

  describe("GET /api/v1/provas/:provaId/analytics", () => {
    it("deve retornar analytics da prova para coordenador com totalAlunos, inicios e envios", async () => {
      const response = await request(app.server)
        .get(`/api/v1/provas/${seed.provaId}/analytics`)
        .set("Authorization", seed.coordenadorToken);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        totalAlunos: expect.any(Number),
        inicios: expect.any(Number),
        envios: expect.any(Number),
        totalRespostas: expect.any(Number),
        totalAnexos: expect.any(Number),
        pendenciasCorrecao: expect.any(Number),
      });
      expect(response.body.data.totalAlunos).toBeGreaterThanOrEqual(1);
      expect(response.body.data.inicios).toBeGreaterThanOrEqual(1);
      expect(response.body.data.envios).toBeGreaterThanOrEqual(1);
      expect(response.body.data.totalRespostas).toBeGreaterThanOrEqual(1);
      expect(response.body.data.totalAnexos).toBeGreaterThanOrEqual(1);
    });

    it("deve retornar analytics quando professor é o dono da prova", async () => {
      const response = await request(app.server)
        .get(`/api/v1/provas/${seed.provaId}/analytics`)
        .set("Authorization", seed.professorVinculadoToken);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.provaId).toBe(seed.provaId);
    });

    it("deve retornar 403 quando professor não vinculado tenta acessar analytics", async () => {
      const response = await request(app.server)
        .get(`/api/v1/provas/${seed.provaId}/analytics`)
        .set("Authorization", seed.professorNaoVinculadoToken);

      expect(response.statusCode).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("FORBIDDEN");
    });

    it("deve retornar 404 quando a prova não existe", async () => {
      const fakeId = "00000000-0000-4000-8000-000000000000";
      const response = await request(app.server)
        .get(`/api/v1/provas/${fakeId}/analytics`)
        .set("Authorization", seed.coordenadorToken);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("NOT_FOUND");
    });

    it("deve retornar 422 quando provaId não é UUID válido", async () => {
      const response = await request(app.server)
        .get("/api/v1/provas/prova-invalida/analytics")
        .set("Authorization", seed.coordenadorToken);

      expect(response.statusCode).toBe(422);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("deve retornar 401 quando não há token de autenticação", async () => {
      const response = await request(app.server).get(`/api/v1/provas/${seed.provaId}/analytics`);

      expect(response.statusCode).toBe(401);
    });
  });

  describe("POST /api/v1/logs", () => {
    it("deve persistir evento de log quando todos os campos são fornecidos", async () => {
      const response = await request(app.server)
        .post("/api/v1/logs")
        .set("Authorization", seed.coordenadorToken)
        .send({
          provaId: seed.provaId,
          provaAlunoId: seed.provaAlunoId,
          atorTipo: "coordenador",
          atorId: seed.coordenadorToken.split(":")[1],
          acao: "visualizou_analytics",
          detalhes: { origem: "teste" },
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();

      const log = await pool.query(
        'SELECT "acao", "ator_tipo" FROM "avaliacao_log" WHERE "id" = $1',
        [response.body.data.id],
      );
      expect(log.rows[0].acao).toBe("visualizou_analytics");
      expect(log.rows[0].ator_tipo).toBe("coordenador");
    });

    it("deve persistir evento de log com apenas campos obrigatórios (atorTipo e acao)", async () => {
      const response = await request(app.server)
        .post("/api/v1/logs")
        .set("Authorization", seed.coordenadorToken)
        .send({
          atorTipo: "sistema",
          acao: "tarefa_agendada",
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it("deve rejeitar com 422 log quando payload está vazio", async () => {
      const response = await request(app.server)
        .post("/api/v1/logs")
        .set("Authorization", seed.coordenadorToken)
        .send({});

      expect(response.statusCode).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("deve rejeitar com 422 log quando atorTipo não é um valor válido", async () => {
      const response = await request(app.server)
        .post("/api/v1/logs")
        .set("Authorization", seed.coordenadorToken)
        .send({
          atorTipo: "visitante",
          acao: "teste",
        });

      expect(response.statusCode).toBe(422);
    });

    it("deve retornar 401 quando POST /logs não tem autenticação", async () => {
      const response = await request(app.server)
        .post("/api/v1/logs")
        .send({
          atorTipo: "sistema",
          acao: "teste",
        });

      expect(response.statusCode).toBe(401);
    });
  });
});
