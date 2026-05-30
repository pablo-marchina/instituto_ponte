import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { buildApp } from "../app.js";
import { pool } from "../database/pool.js";

const TEST_PREFIX = "coord-prova-api-test";

type Seed = {
  coordenadorId: string;
  professorId: string;
  outroProfessorId: string;
  provaRascunhoId: string;
  provaPublicadaId: string;
  tokenCoordenador: string;
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
    'DELETE FROM "materia_professor" WHERE "materia_id" IN (SELECT "id" FROM "materia" WHERE "codigo" LIKE $1)',
    [`${TEST_PREFIX}%`],
  );
  await pool.query(
    'DELETE FROM "questao" WHERE "materia_id" IN (SELECT "id" FROM "materia" WHERE "codigo" LIKE $1)',
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
    ["Coordenador Provas", `${TEST_PREFIX}-coord-${suffix}@example.com`],
  );
  const professor = await pool.query<{ id: string }>(
    'INSERT INTO "professor" ("coordenador_id", "nome", "email") VALUES ($1, $2, $3) RETURNING "id"',
    [coordenador.rows[0].id, "Professor Um", `${TEST_PREFIX}-prof-1-${suffix}@example.com`],
  );
  const outroProfessor = await pool.query<{ id: string }>(
    'INSERT INTO "professor" ("coordenador_id", "nome", "email") VALUES ($1, $2, $3) RETURNING "id"',
    [coordenador.rows[0].id, "Professor Dois", `${TEST_PREFIX}-prof-2-${suffix}@example.com`],
  );
  const materia = await pool.query<{ id: string }>(
    'INSERT INTO "materia" ("nome", "codigo") VALUES ($1, $2) RETURNING "id"',
    [`Matéria Coord ${suffix}`, `${TEST_PREFIX}-${suffix}`],
  );
  await pool.query(
    'INSERT INTO "materia_professor" ("materia_id", "professor_id") VALUES ($1, $2), ($1, $3)',
    [materia.rows[0].id, professor.rows[0].id, outroProfessor.rows[0].id],
  );

  const provaRascunho = await pool.query<{ id: string }>(
    `
      INSERT INTO "prova" ("professor_id", "materia_id", "titulo", "turma", "semestre", "status")
      VALUES ($1, $2, 'Prova Coord Rascunho', 'A', '2026.1', 'rascunho')
      RETURNING "id"
    `,
    [professor.rows[0].id, materia.rows[0].id],
  );
  const provaPublicada = await pool.query<{ id: string }>(
    `
      INSERT INTO "prova" (
        "professor_id", "materia_id", "titulo", "turma", "semestre", "data_inicio", "data_fim", "url_acesso"
      )
      VALUES (
        $1,
        $2,
        'Prova Coord Publicada',
        'B',
        '2026.1',
        CURRENT_TIMESTAMP - INTERVAL '1 hour',
        CURRENT_TIMESTAMP + INTERVAL '1 hour',
        $3
      )
      RETURNING "id"
    `,
    [outroProfessor.rows[0].id, materia.rows[0].id, `https://app.test/coord/${suffix}`],
  );
  const questao = await pool.query<{ id: string }>(
    'INSERT INTO "questao" ("materia_id", "tipo") VALUES ($1, $2) RETURNING "id"',
    [materia.rows[0].id, "discursiva"],
  );
  await pool.query('INSERT INTO "enunciado" ("questao_id", "conteudo_latex") VALUES ($1, $2)', [
    questao.rows[0].id,
    "Questão para publicação",
  ]);
  await pool.query(
    'INSERT INTO "prova_questao" ("prova_id", "questao_id", "ordem_original", "pontuacao_max") VALUES ($1, $2, 1, 1)',
    [provaPublicada.rows[0].id, questao.rows[0].id],
  );
  await pool.query('UPDATE "prova" SET "status" = $1 WHERE "id" = $2', ["publicada", provaPublicada.rows[0].id]);

  return {
    coordenadorId: coordenador.rows[0].id,
    professorId: professor.rows[0].id,
    outroProfessorId: outroProfessor.rows[0].id,
    provaRascunhoId: provaRascunho.rows[0].id,
    provaPublicadaId: provaPublicada.rows[0].id,
    tokenCoordenador: `Bearer test-coordenador:${coordenador.rows[0].id}:coord@example.com:Coordenador Provas`,
    tokenProfessor: `Bearer test-professor:${professor.rows[0].id}:prof@example.com:Professor Um`,
  };
};

describe("CoordenadorProvaController - integração", () => {
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

  it("deve listar todas as provas de professores distintos quando autenticado como coordenador", async () => {
    const response = await request(app.server)
      .get("/api/v1/coordenador/provas")
      .set("Authorization", seed.tokenCoordenador);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: seed.provaRascunhoId, professorId: seed.professorId }),
        expect.objectContaining({ id: seed.provaPublicadaId, professorId: seed.outroProfessorId }),
      ]),
    );
    expect(response.body.meta.total).toBeGreaterThanOrEqual(2);
  });

  it("deve filtrar provas por status quando coordenador passa query param", async () => {
    const response = await request(app.server)
      .get("/api/v1/coordenador/provas")
      .query({ status: "publicada" })
      .set("Authorization", seed.tokenCoordenador);

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: seed.provaPublicadaId, status: "publicada" })]),
    );
    expect(response.body.data.some((prova: { id: string }) => prova.id === seed.provaRascunhoId)).toBe(false);
  });

  it("deve bloquear com 403 professor na rota /coordenador/provas", async () => {
    const response = await request(app.server)
      .get("/api/v1/coordenador/provas")
      .set("Authorization", seed.tokenProfessor);

    expect(response.statusCode).toBe(403);
  });
});
