import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import request from "supertest";
import { buildApp } from "../app.js";
import { pool } from "../database/pool.js";

const TEST_PREFIX = "resultado-api-test";

type Seed = {
  coordenadorId: string;
  professorId: string;
  provaId: string;
  provaAlunoCompletaId: string;
  provaAlunoPendenteId: string;
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
  await pool.query('DELETE FROM "aluno" WHERE "email" LIKE $1', [`${TEST_PREFIX}%`]);
  await pool.query(
    'DELETE FROM "questao" WHERE "materia_id" IN (SELECT "id" FROM "materia" WHERE "codigo" LIKE $1)',
    [`${TEST_PREFIX}%`],
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

const createQuestao = async (
  materiaId: string,
  tipo: "multipla_escolha" | "discursiva",
  ordem: number,
  correta = true,
) => {
  const questao = await pool.query<{ id: string }>(
    'INSERT INTO "questao" ("materia_id", "tipo") VALUES ($1, $2) RETURNING "id"',
    [materiaId, tipo],
  );
  await pool.query('INSERT INTO "enunciado" ("questao_id", "conteudo_latex") VALUES ($1, $2)', [
    questao.rows[0].id,
    `Questão ${ordem}`,
  ]);

  if (tipo === "discursiva") {
    return { questaoId: questao.rows[0].id, alternativaId: null };
  }

  const alternativa = await pool.query<{ id: string }>(
    `
      INSERT INTO "alternativa" ("questao_id", "ordem_original", "conteudo_latex", "correta")
      VALUES ($1, 1, 'Alternativa', $2)
      RETURNING "id"
    `,
    [questao.rows[0].id, correta],
  );
  await pool.query(
    `
      INSERT INTO "alternativa" ("questao_id", "ordem_original", "conteudo_latex", "correta")
      VALUES ($1, 2, 'Distrator', FALSE)
    `,
    [questao.rows[0].id],
  );

  return { questaoId: questao.rows[0].id, alternativaId: alternativa.rows[0].id };
};

const createResposta = async (
  provaAlunoId: string,
  questaoId: string,
  alternativaId: string | null,
  respostaTexto: string | null,
) => {
  const result = await pool.query<{ id: string }>(
    `
      INSERT INTO "resposta_aluno" ("prova_aluno_id", "questao_id", "alternativa_id", "resposta_texto", "rascunho")
      VALUES ($1, $2, $3, $4, FALSE)
      RETURNING "id"
    `,
    [provaAlunoId, questaoId, alternativaId, respostaTexto],
  );
  return result.rows[0].id;
};

const createSeed = async (): Promise<Seed> => {
  const suffix = randomUUID();
  const coordenador = await pool.query<{ id: string }>(
    'INSERT INTO "coordenador" ("nome", "email") VALUES ($1, $2) RETURNING "id"',
    ["Coordenador Resultado", `${TEST_PREFIX}-coord-${suffix}@example.com`],
  );
  const professor = await pool.query<{ id: string }>(
    'INSERT INTO "professor" ("coordenador_id", "nome", "email") VALUES ($1, $2, $3) RETURNING "id"',
    [coordenador.rows[0].id, "Professor Resultado", `${TEST_PREFIX}-prof-${suffix}@example.com`],
  );
  const materia = await pool.query<{ id: string }>(
    'INSERT INTO "materia" ("nome", "codigo") VALUES ($1, $2) RETURNING "id"',
    [`Matemática Resultado ${suffix}`, `${TEST_PREFIX}-${suffix}`],
  );
  await pool.query('INSERT INTO "materia_professor" ("materia_id", "professor_id") VALUES ($1, $2)', [
    materia.rows[0].id,
    professor.rows[0].id,
  ]);

  const prova = await pool.query<{ id: string }>(
    `
      INSERT INTO "prova" (
        "professor_id", "materia_id", "titulo", "turma", "semestre", "data_inicio", "data_fim", "url_acesso"
      )
      VALUES (
        $1,
        $2,
        'Prova de resultados',
        'A',
        '2026.1',
        CURRENT_TIMESTAMP - INTERVAL '1 hour',
        CURRENT_TIMESTAMP + INTERVAL '1 hour',
        $3
      )
      RETURNING "id"
    `,
    [professor.rows[0].id, materia.rows[0].id, `https://app.test/resultados/${suffix}`],
  );

  const objetiva = await createQuestao(materia.rows[0].id, "multipla_escolha", 1);
  const discursiva = await createQuestao(materia.rows[0].id, "discursiva", 2);

  await pool.query(
    'INSERT INTO "prova_questao" ("prova_id", "questao_id", "ordem_original", "pontuacao_max") VALUES ($1, $2, 1, 2), ($1, $3, 2, 3)',
    [prova.rows[0].id, objetiva.questaoId, discursiva.questaoId],
  );
  await pool.query('UPDATE "prova" SET "status" = $1 WHERE "id" = $2', ["publicada", prova.rows[0].id]);

  const alunoCompleto = await pool.query<{ id: string }>(
    `
      INSERT INTO "aluno" ("nome", "email", "cpf", "aceitou_termos_em")
      VALUES ('Aluno Completo', $1, '50000000001', CURRENT_TIMESTAMP)
      RETURNING "id"
    `,
    [`${TEST_PREFIX}-completo-${suffix}@example.com`],
  );
  const alunoPendente = await pool.query<{ id: string }>(
    `
      INSERT INTO "aluno" ("nome", "email", "cpf", "aceitou_termos_em")
      VALUES ('Aluno Pendente', $1, '50000000002', CURRENT_TIMESTAMP)
      RETURNING "id"
    `,
    [`${TEST_PREFIX}-pendente-${suffix}@example.com`],
  );

  const provaAlunoCompleta = await pool.query<{ id: string }>(
    'INSERT INTO "prova_aluno" ("prova_id", "aluno_id", "status") VALUES ($1, $2, $3) RETURNING "id"',
    [prova.rows[0].id, alunoCompleto.rows[0].id, "em_andamento"],
  );
  const provaAlunoPendente = await pool.query<{ id: string }>(
    'INSERT INTO "prova_aluno" ("prova_id", "aluno_id", "status") VALUES ($1, $2, $3) RETURNING "id"',
    [prova.rows[0].id, alunoPendente.rows[0].id, "em_andamento"],
  );

  const respostaObjetivaCompleta = await createResposta(
    provaAlunoCompleta.rows[0].id,
    objetiva.questaoId,
    objetiva.alternativaId,
    null,
  );
  const respostaDiscursivaCompleta = await createResposta(
    provaAlunoCompleta.rows[0].id,
    discursiva.questaoId,
    null,
    "Resposta completa",
  );
  const respostaObjetivaPendente = await createResposta(
    provaAlunoPendente.rows[0].id,
    objetiva.questaoId,
    objetiva.alternativaId,
    null,
  );
  await createResposta(provaAlunoPendente.rows[0].id, discursiva.questaoId, null, "Resposta pendente");

  await pool.query('UPDATE "prova_aluno" SET "status" = $1 WHERE "id" IN ($2, $3)', [
    "enviada",
    provaAlunoCompleta.rows[0].id,
    provaAlunoPendente.rows[0].id,
  ]);

  await pool.query(
    'INSERT INTO "correcao" ("resposta_id", "professor_id", "nota", "tipo") VALUES ($1, $2, 2, $3), ($4, $2, 2.5, $3), ($5, $2, 2, $3)',
    [respostaObjetivaCompleta, professor.rows[0].id, "manual", respostaDiscursivaCompleta, respostaObjetivaPendente],
  );

  return {
    coordenadorId: coordenador.rows[0].id,
    professorId: professor.rows[0].id,
    provaId: prova.rows[0].id,
    provaAlunoCompletaId: provaAlunoCompleta.rows[0].id,
    provaAlunoPendenteId: provaAlunoPendente.rows[0].id,
    tokenCoordenador: `Bearer test-coordenador:${coordenador.rows[0].id}:coordenador@example.com:Coordenador Resultado`,
    tokenProfessor: `Bearer test-professor:${professor.rows[0].id}:professor@example.com:Professor Resultado`,
  };
};

describe("ResultadosController - integração", () => {
  const app = buildApp();
  let seed: Seed;
  const originalStorageUrl = process.env.SUPABASE_STORAGE_URL;
  const originalStorageKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const originalStorageBucket = process.env.SUPABASE_STORAGE_BUCKET;

  beforeAll(async () => {
    await app.ready();
    await pool.query('SELECT 1 FROM "resultado_aluno" LIMIT 1');
  });

  beforeEach(async () => {
    await cleanup();
    seed = await createSeed();
  });

  afterEach(() => {
    process.env.SUPABASE_STORAGE_URL = originalStorageUrl;
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalStorageKey;
    process.env.SUPABASE_STORAGE_BUCKET = originalStorageBucket;
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
    await pool.end();
  });

  it("deve calcular nota total, percentual e persistir resultado_aluno quando todas as correções existem", async () => {
    const response = await request(app.server)
      .get(`/api/v1/provas/${seed.provaId}/resultados`)
      .set("Authorization", seed.tokenProfessor);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);

    const completo = response.body.data.find((item: { aluno: { nome: string } }) => item.aluno.nome === "Aluno Completo");
    expect(completo).toMatchObject({
      notaTotal: 4.5,
      percentual: 90,
      liberado: false,
      pendenciasCorrecao: 0,
      questoes: expect.arrayContaining([
        expect.objectContaining({ nota: 2, status: "corrigida" }),
        expect.objectContaining({ nota: 2.5, status: "corrigida" }),
      ]),
    });

    const persistido = await pool.query<{ nota_total: string; percentual: string; liberado: boolean }>(
      'SELECT "nota_total", "percentual", "liberado" FROM "resultado_aluno" WHERE "prova_aluno_id" = $1',
      [seed.provaAlunoCompletaId],
    );
    expect(persistido.rows[0]).toMatchObject({ nota_total: "4.50", percentual: "90.00", liberado: false });
  });

  it("deve indicar pendenciasCorrecao > 0 para aluno com resposta não corrigida", async () => {
    const response = await request(app.server)
      .get(`/api/v1/provas/${seed.provaId}/resultados`)
      .set("Authorization", seed.tokenProfessor);

    expect(response.statusCode).toBe(200);
    const pendente = response.body.data.find((item: { aluno: { nome: string } }) => item.aluno.nome === "Aluno Pendente");
    expect(pendente).toMatchObject({
      notaTotal: 2,
      percentual: 40,
      pendenciasCorrecao: 1,
      questoes: expect.arrayContaining([expect.objectContaining({ nota: null, status: "pendente" })]),
    });
  });

  it("deve rejeitar com 422 quando provaId não é UUID válido", async () => {
    const response = await request(app.server)
      .get("/api/v1/provas/prova-invalida/resultados")
      .set("Authorization", seed.tokenProfessor);

    expect(response.statusCode).toBe(422);
  });

  it("deve retornar 404 ao listar resultados de prova inexistente", async () => {
    const response = await request(app.server)
      .get(`/api/v1/provas/${randomUUID()}/resultados`)
      .set("Authorization", seed.tokenCoordenador);

    expect(response.statusCode).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("deve exportar resultados em CSV como coordenador, fazer upload ao storage e persistir exportacao_resultado", async () => {
    process.env.SUPABASE_STORAGE_URL = "https://storage.test";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test";
    process.env.SUPABASE_STORAGE_BUCKET = "exports";
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({ ok: true, status: 200, text: async () => "" } as Response);

    const response = await request(app.server)
      .post(`/api/v1/provas/${seed.provaId}/resultados/exportar`)
      .set("Authorization", seed.tokenCoordenador)
      .send({ formato: "csv" });

    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        formato: "csv",
        urlArquivo: expect.stringContaining("https://storage.test/storage/v1/object/public/exports/"),
        pendenciasCorrecao: 1,
      },
    });
    expect(response.body.data.id).toEqual(expect.any(String));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [uploadUrl, uploadOptions] = fetchMock.mock.calls[0];
    expect(String(uploadUrl)).toContain(`/storage/v1/object/exports/provas/${seed.provaId}/resultados-`);
    expect(uploadOptions).toMatchObject({
      method: "PUT",
      headers: expect.objectContaining({
        Authorization: "Bearer service-role-test",
        "Content-Type": "text/csv; charset=utf-8",
      }),
    });
    expect(String(uploadOptions?.body)).toContain("Aluno Completo");
    expect(String(uploadOptions?.body)).toContain("Aluno Pendente");

    const persistido = await pool.query<{ formato: string; url_arquivo: string; coordenador_id: string }>(
      'SELECT "formato", "url_arquivo", "coordenador_id" FROM "exportacao_resultado" WHERE "id" = $1',
      [response.body.data.id],
    );
    expect(persistido.rows[0]).toMatchObject({
      formato: "csv",
      url_arquivo: response.body.data.urlArquivo,
      coordenador_id: seed.coordenadorId,
    });
  });

  it("deve exportar resultados em XLSX válido como coordenador, com buffer PK header e persistir exportacao_resultado", async () => {
    process.env.SUPABASE_STORAGE_URL = "https://storage.test";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test";
    process.env.SUPABASE_STORAGE_BUCKET = "exports";
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({ ok: true, status: 200, text: async () => "" } as Response);

    const response = await request(app.server)
      .post(`/api/v1/provas/${seed.provaId}/resultados/exportar`)
      .set("Authorization", seed.tokenCoordenador)
      .send({ formato: "xlsx" });

    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        formato: "xlsx",
        urlArquivo: expect.stringMatching(/\.xlsx$/),
        pendenciasCorrecao: 1,
      },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [uploadUrl, uploadOptions] = fetchMock.mock.calls[0];
    expect(String(uploadUrl)).toContain(`/storage/v1/object/exports/provas/${seed.provaId}/resultados-`);
    expect(String(uploadUrl)).toMatch(/\.xlsx$/);
    expect(uploadOptions).toMatchObject({
      method: "PUT",
      headers: expect.objectContaining({
        Authorization: "Bearer service-role-test",
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    });

    const body = uploadOptions?.body;
    expect(Buffer.isBuffer(body)).toBe(true);
    const buffer = body as Buffer;
    expect(buffer.subarray(0, 2).toString("utf8")).toBe("PK");
    expect(buffer.toString("utf8", 0, 80)).not.toContain("Aluno,Email");

    const persistido = await pool.query<{ formato: string; url_arquivo: string; coordenador_id: string }>(
      'SELECT "formato", "url_arquivo", "coordenador_id" FROM "exportacao_resultado" WHERE "id" = $1',
      [response.body.data.id],
    );
    expect(persistido.rows[0]).toMatchObject({
      formato: "xlsx",
      url_arquivo: response.body.data.urlArquivo,
      coordenador_id: seed.coordenadorId,
    });
  });

  it("deve bloquear com 403 exportação quando o perfil é professor (apenas coordenador pode)", async () => {
    const response = await request(app.server)
      .post(`/api/v1/provas/${seed.provaId}/resultados/exportar`)
      .set("Authorization", seed.tokenProfessor)
      .send({ formato: "xlsx" });

    expect(response.statusCode).toBe(403);
  });

  it("deve rejeitar com 422 formato de exportação que não é csv nem xlsx", async () => {
    const response = await request(app.server)
      .post(`/api/v1/provas/${seed.provaId}/resultados/exportar`)
      .set("Authorization", seed.tokenCoordenador)
      .send({ formato: "pdf" });

    expect(response.statusCode).toBe(422);
  });

  it("deve retornar 404 ao exportar resultados de prova inexistente", async () => {
    const response = await request(app.server)
      .post(`/api/v1/provas/${randomUUID()}/resultados/exportar`)
      .set("Authorization", seed.tokenCoordenador)
      .send({ formato: "csv" });

    expect(response.statusCode).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });
});
