import { pool } from "../database/pool.js";
import { toIsoString } from "../helpers/date.js";
import type { AuthUser } from "../middlewares/auth.js";

type EmailEnvioRow = {
  id: string;
  prova_aluno_id: string;
  destinatario: string;
  assunto: string;
  corpo: string | null;
  status: "pendente" | "enviado" | "erro";
  erro: string | null;
  enviado_em: Date | string | null;
  criado_em: Date | string;
  aluno_id?: string;
  aluno_nome?: string;
};

type AlunoResultadoRow = {
  prova_aluno_id: string;
  aluno_id: string;
  aluno_nome: string;
  aluno_email: string;
};

const mapEnvio = (row: EmailEnvioRow) => ({
  id: row.id,
  provaAlunoId: row.prova_aluno_id,
  destinatario: row.destinatario,
  assunto: row.assunto,
  status: row.status,
  erro: row.erro ?? null,
  enviadoEm: toIsoString(row.enviado_em),
  criadoEm: toIsoString(row.criado_em) ?? "",
  ...(row.aluno_id
    ? { aluno: { id: row.aluno_id, nome: row.aluno_nome ?? "" } }
    : {}),
});

export class EmailEnvioRepository {
  async hasAccessToProva(provaId: string, user: AuthUser) {
    if (user.perfil === "coordenador") return true;

    const result = await pool.query(
      `SELECT EXISTS (
        SELECT 1 FROM "prova" p
        WHERE p."id" = $1
          AND (
            p."professor_id" = $2
            OR EXISTS (
              SELECT 1 FROM "materia_professor" mp
              WHERE mp."materia_id" = p."materia_id" AND mp."professor_id" = $2
            )
          )
      ) AS "exists"`,
      [provaId, user.id],
    );

    return result.rows[0]?.exists ?? false;
  }

  async findProvaExists(provaId: string) {
    const result = await pool.query('SELECT 1 FROM "prova" WHERE "id" = $1', [provaId]);
    return result.rows.length > 0;
  }

  async findAlunosComResultado(provaId: string) {
    const result = await pool.query<AlunoResultadoRow>(
      `SELECT
        pa."id" AS "prova_aluno_id",
        a."id" AS "aluno_id",
        a."nome" AS "aluno_nome",
        a."email" AS "aluno_email"
      FROM "prova_aluno" pa
      JOIN "aluno" a ON a."id" = pa."aluno_id"
      WHERE pa."prova_id" = $1
        AND pa."status" = 'corrigida'
      ORDER BY a."nome" ASC`,
      [provaId],
    );
    return result.rows;
  }

  async countPendenciasCorrecaoPorProva(provaId: string) {
    const result = await pool.query(
      `SELECT COUNT(*) AS "total"
      FROM "resposta_aluno" ra
      LEFT JOIN "correcao" c ON c."resposta_id" = ra."id"
      JOIN "prova_aluno" pa ON pa."id" = ra."prova_aluno_id"
      WHERE pa."prova_id" = $1
        AND pa."status" IN ('enviada', 'corrigida')
        AND c."id" IS NULL`,
      [provaId],
    );
    return Number(result.rows[0].total);
  }

  async createEnvio(provaAlunoId: string, destinatario: string, assunto: string, corpo: string) {
    const result = await pool.query<{ id: string }>(
      `INSERT INTO "email_envio" ("prova_aluno_id", "destinatario", "assunto", "corpo", "status")
       VALUES ($1, $2, $3, $4, 'pendente')
       RETURNING "id"`,
      [provaAlunoId, destinatario, assunto, corpo],
    );
    return result.rows[0].id;
  }

  async markAsSent(id: string) {
    await pool.query(
      `UPDATE "email_envio" SET "status" = 'enviado', "enviado_em" = CURRENT_TIMESTAMP, "erro" = NULL
       WHERE "id" = $1`,
      [id],
    );
  }

  async markAsError(id: string, error: string) {
    await pool.query(
      `UPDATE "email_envio" SET "status" = 'erro', "erro" = $1 WHERE "id" = $2`,
      [error, id],
    );
  }

  async findEnviosByProva(provaId: string) {
    const result = await pool.query<EmailEnvioRow>(
      `SELECT
        ee."id",
        ee."prova_aluno_id",
        ee."destinatario",
        ee."assunto",
        ee."status",
        ee."erro",
        ee."enviado_em",
        ee."criado_em",
        a."id" AS "aluno_id",
        a."nome" AS "aluno_nome"
      FROM "email_envio" ee
      JOIN "prova_aluno" pa ON pa."id" = ee."prova_aluno_id"
      JOIN "aluno" a ON a."id" = pa."aluno_id"
      WHERE pa."prova_id" = $1
      ORDER BY ee."criado_em" DESC`,
      [provaId],
    );
    return result.rows.map(mapEnvio);
  }

  async findById(id: string) {
    const result = await pool.query<EmailEnvioRow>(
      `SELECT "id", "prova_aluno_id", "destinatario", "assunto", "status", "erro", "enviado_em", "criado_em"
       FROM "email_envio" WHERE "id" = $1`,
      [id],
    );
    return result.rows[0] ? mapEnvio(result.rows[0]) : null;
  }
}
