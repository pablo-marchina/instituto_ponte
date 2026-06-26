import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { buildApp } from "../app.js";
import { pool } from "../database/pool.js";

const TEST_PREFIX = "prova-api-test";

type Seed = {
  coordenadorId: string;
  professorId: string;
  outroProfessorId: string;
  materiaId: string;
  provaRascunhoId: string;
  provaEncerradaId: string;
  tokenProfessor: string;
  tokenOutroProfessor: string;
  tokenCoordenador: string;
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

const createProva = async (professorId: string, materiaId: string, titulo: string, status = "rascunho") => {
  const result = await pool.query<{ id: string }>(
    `
      INSERT INTO "prova" (
        "professor_id", "materia_id", "titulo", "turma", "semestre", "status", "data_inicio", "data_fim",
        "url_acesso"
      )
      VALUES (
        $1, $2, $3, 'A', '2026.1', $4::prova_status,
        CASE WHEN $4 = 'publicada' THEN CURRENT_TIMESTAMP - INTERVAL '1 hour' ELSE NULL END,
        CASE WHEN $4 = 'publicada' THEN CURRENT_TIMESTAMP + INTERVAL '1 hour' ELSE NULL END,
        CASE WHEN $4 = 'publicada' THEN $5 ELSE NULL END
      )
      RETURNING "id"
    `,
    [professorId, materiaId, titulo, status, `https://app.test/provas/${randomUUID()}`],
  );
  return result.rows[0].id;
};

const createSeed = async (): Promise<Seed> => {
  const suffix = randomUUID();
  const coordenador = await pool.query<{ id: string }>(
    'INSERT INTO "coordenador" ("nome", "email") VALUES ($1, $2) RETURNING "id"',
    ["Coordenador Prova", `${TEST_PREFIX}-coord-${suffix}@example.com`],
  );
  const professor = await pool.query<{ id: string }>(
    'INSERT INTO "professor" ("coordenador_id", "nome", "email") VALUES ($1, $2, $3) RETURNING "id"',
    [coordenador.rows[0].id, "Professor Prova", `${TEST_PREFIX}-prof-${suffix}@example.com`],
  );
  const outroProfessor = await pool.query<{ id: string }>(
    'INSERT INTO "professor" ("coordenador_id", "nome", "email") VALUES ($1, $2, $3) RETURNING "id"',
    [coordenador.rows[0].id, "Outro Professor Prova", `${TEST_PREFIX}-outro-prof-${suffix}@example.com`],
  );
  const materia = await pool.query<{ id: string }>(
    'INSERT INTO "materia" ("nome", "codigo") VALUES ($1, $2) RETURNING "id"',
    [`Matemática Prova ${suffix}`, `${TEST_PREFIX}-${suffix}`],
  );
  await pool.query('INSERT INTO "materia_professor" ("materia_id", "professor_id") VALUES ($1, $2)', [
    materia.rows[0].id,
    professor.rows[0].id,
  ]);

  const provaRascunhoId = await createProva(professor.rows[0].id, materia.rows[0].id, "Prova rascunho");
  const provaEncerradaId = await createProva(
    professor.rows[0].id,
    materia.rows[0].id,
    "Prova encerrada",
    "encerrada",
  );

  return {
    coordenadorId: coordenador.rows[0].id,
    professorId: professor.rows[0].id,
    outroProfessorId: outroProfessor.rows[0].id,
    materiaId: materia.rows[0].id,
    provaRascunhoId,
    provaEncerradaId,
    tokenProfessor: `Bearer test-professor:${professor.rows[0].id}:professor@example.com:Professor Prova`,
    tokenOutroProfessor: `Bearer test-professor:${outroProfessor.rows[0].id}:outro-professor@example.com:Outro Professor Prova`,
    tokenCoordenador: `Bearer test-coordenador:${coordenador.rows[0].id}:coord@example.com:Coordenador Prova`,
  };
};

describe("ProvaController - integração", () => {
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

  it("deve criar prova em rascunho quando professor e matéria são válidos", async () => {
    const response = await request(app.server)
      .post("/api/v1/provas")
      .set("Authorization", seed.tokenProfessor)
      .send({
        materiaId: seed.materiaId,
        titulo: "Prova criada via endpoint",
        turma: "B",
        semestre: "2026.2",
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        professorId: seed.professorId,
        materiaId: seed.materiaId,
        titulo: "Prova criada via endpoint",
        status: "rascunho",
      },
    });
  });

  it("deve listar e detalhar prova existente quando usuário tem acesso", async () => {
    const list = await request(app.server)
      .get(`/api/v1/provas?status=rascunho&materiaId=${seed.materiaId}`)
      .set("Authorization", seed.tokenProfessor);

    expect(list.statusCode).toBe(200);
    expect(list.body.data.some((prova: { id: string }) => prova.id === seed.provaRascunhoId)).toBe(true);

    const detail = await request(app.server)
      .get(`/api/v1/provas/${seed.provaRascunhoId}`)
      .set("Authorization", seed.tokenProfessor);

    expect(detail.statusCode).toBe(200);
    expect(detail.body.data).toMatchObject({
      id: seed.provaRascunhoId,
      titulo: "Prova rascunho",
      questoes: [],
    });
  });

  it("deve atualizar e remover prova em rascunho", async () => {
    const update = await request(app.server)
      .put(`/api/v1/provas/${seed.provaRascunhoId}`)
      .set("Authorization", seed.tokenProfessor)
      .send({ titulo: "Prova atualizada" });

    expect(update.statusCode).toBe(200);
    expect(update.body.data.titulo).toBe("Prova atualizada");

    const remove = await request(app.server)
      .delete(`/api/v1/provas/${seed.provaRascunhoId}`)
      .set("Authorization", seed.tokenProfessor);

    expect(remove.statusCode).toBe(204);
  });

  it("deve rejeitar com 422 criação de prova sem título", async () => {
    const response = await request(app.server)
      .post("/api/v1/provas")
      .set("Authorization", seed.tokenProfessor)
      .send({
        materiaId: seed.materiaId,
        turma: "B",
        semestre: "2026.2",
      });

    expect(response.statusCode).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("deve bloquear com 403 criação de prova quando usuário é coordenador", async () => {
    const response = await request(app.server)
      .post("/api/v1/provas")
      .set("Authorization", seed.tokenCoordenador)
      .send({
        materiaId: seed.materiaId,
        titulo: "Prova indevida",
        turma: "B",
        semestre: "2026.2",
      });

    expect(response.statusCode).toBe(403);
  });

  it("deve bloquear com 409 edição de prova que não está em rascunho", async () => {
    const response = await request(app.server)
      .put(`/api/v1/provas/${seed.provaEncerradaId}`)
      .set("Authorization", seed.tokenProfessor)
      .send({ titulo: "Tentativa inválida" });

    expect(response.statusCode).toBe(409);
    expect(response.body.error.code).toBe("CONFLICT");
  });

  it("deve retornar 404 ao detalhar prova inexistente", async () => {
    const response = await request(app.server)
      .get(`/api/v1/provas/${randomUUID()}`)
      .set("Authorization", seed.tokenProfessor);

    expect(response.statusCode).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("deve listar histórico de status da prova quando usuário tem acesso", async () => {
    await pool.query(
      `
        INSERT INTO "prova_status_historico" ("prova_id", "status_anterior", "status_novo")
        VALUES ($1, NULL, 'rascunho'), ($1, 'rascunho', 'publicada')
      `,
      [seed.provaRascunhoId],
    );

    const response = await request(app.server)
      .get(`/api/v1/provas/${seed.provaRascunhoId}/status-historico`)
      .set("Authorization", seed.tokenProfessor);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          statusNovo: "rascunho",
        }),
        expect.objectContaining({
          statusAnterior: "rascunho",
          statusNovo: "publicada",
        }),
      ]),
    );
  });

  it("deve retornar 422 no histórico quando provaId não é UUID válido", async () => {
    const response = await request(app.server)
      .get("/api/v1/provas/id-invalido/status-historico")
      .set("Authorization", seed.tokenProfessor);

    expect(response.statusCode).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("deve bloquear com 403 histórico de prova sem acesso para professor não vinculado", async () => {
    const response = await request(app.server)
      .get(`/api/v1/provas/${seed.provaRascunhoId}/status-historico`)
      .set("Authorization", seed.tokenOutroProfessor);

    expect(response.statusCode).toBe(403);
  });

  it("deve retornar 404 no histórico quando a prova não existe", async () => {
    const response = await request(app.server)
      .get(`/api/v1/provas/${randomUUID()}/status-historico`)
      .set("Authorization", seed.tokenProfessor);

    expect(response.statusCode).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });
});
