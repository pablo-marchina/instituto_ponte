import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { buildApp } from "../app.js";
import { pool } from "../database/pool.js";

const TEST_PREFIX = "vinculo-test";

let app: ReturnType<typeof buildApp>;
let coordenadorToken: string;
let coordenadorId: string;
let professorId: string;
let materiaId: string;

const cleanup = async () => {
  await pool.query(
    'DELETE FROM "materia_professor" WHERE "professor_id" IN (SELECT "id" FROM "professor" WHERE "email" LIKE $1)',
    [`${TEST_PREFIX}%`],
  );
  await pool.query(
    'DELETE FROM "professor" WHERE "email" LIKE $1',
    [`${TEST_PREFIX}%`],
  );
  await pool.query(
    'DELETE FROM "materia" WHERE "codigo" LIKE $1',
    [`${TEST_PREFIX}%`],
  );
  await pool.query(
    'DELETE FROM "coordenador" WHERE "email" LIKE $1',
    [`${TEST_PREFIX}%`],
  );
};

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
  const suffix = randomUUID();
  const coord = await pool.query<{ id: string }>(
    `INSERT INTO "coordenador" ("nome", "email") VALUES ($1, $2) RETURNING "id"`,
    ["Coord Vínculo", `${TEST_PREFIX}-coord-${suffix}@example.com`],
  );
  coordenadorId = coord.rows[0].id;
  coordenadorToken = `Bearer test-coordenador:${coordenadorId}`;

  const prof = await pool.query<{ id: string }>(
    `INSERT INTO "professor" ("coordenador_id", "nome", "email") VALUES ($1, $2, $3) RETURNING "id"`,
    [coordenadorId, "Prof Vínculo", `${TEST_PREFIX}-prof-${suffix}@example.com`],
  );
  professorId = prof.rows[0].id;

  const mat = await pool.query<{ id: string }>(
    `INSERT INTO "materia" ("nome", "codigo") VALUES ($1, $2) RETURNING "id"`,
    [`Matéria Vínculo ${suffix}`, `${TEST_PREFIX}-${suffix}`],
  );
  materiaId = mat.rows[0].id;
});

describe("VinculoController - integração", () => {
  it("deve criar vínculo professor-matéria quando dados são válidos", async () => {
    const response = await request(app.server)
      .post(`/api/v1/professores/${professorId}/materias`)
      .set("Authorization", coordenadorToken)
      .send({ materiaId });

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.materiaId).toBe(materiaId);
    expect(response.body.data.professorId).toBe(professorId);
  });

  it("deve rejeitar com 404 vínculo quando professor não existe", async () => {
    const response = await request(app.server)
      .post(`/api/v1/professores/${randomUUID()}/materias`)
      .set("Authorization", coordenadorToken)
      .send({ materiaId });

    expect(response.statusCode).toBe(404);
  });

  it("deve rejeitar com 404 vínculo quando matéria não existe", async () => {
    const response = await request(app.server)
      .post(`/api/v1/professores/${professorId}/materias`)
      .set("Authorization", coordenadorToken)
      .send({ materiaId: randomUUID() });

    expect(response.statusCode).toBe(404);
  });

  it("deve rejeitar com 409 vínculo duplicado (mesmo professor e matéria)", async () => {
    await request(app.server)
      .post(`/api/v1/professores/${professorId}/materias`)
      .set("Authorization", coordenadorToken)
      .send({ materiaId });

    const response = await request(app.server)
      .post(`/api/v1/professores/${professorId}/materias`)
      .set("Authorization", coordenadorToken)
      .send({ materiaId });

    expect(response.statusCode).toBe(409);
    expect(response.body.error.code).toBe("CONFLICT");
  });

  it("deve rejeitar com 401 vínculo quando não há token de autenticação", async () => {
    const response = await request(app.server)
      .post(`/api/v1/professores/${professorId}/materias`)
      .send({ materiaId });

    expect(response.statusCode).toBe(401);
  });

  it("deve remover vínculo existente e retornar 204", async () => {
    await request(app.server)
      .post(`/api/v1/professores/${professorId}/materias`)
      .set("Authorization", coordenadorToken)
      .send({ materiaId });

    const response = await request(app.server)
      .delete(`/api/v1/professores/${professorId}/materias/${materiaId}`)
      .set("Authorization", coordenadorToken);

    expect(response.statusCode).toBe(204);
  });

  it("deve retornar 404 ao tentar remover vínculo que não existe", async () => {
    const response = await request(app.server)
      .delete(`/api/v1/professores/${professorId}/materias/${materiaId}`)
      .set("Authorization", coordenadorToken);

    expect(response.statusCode).toBe(404);
  });
});
