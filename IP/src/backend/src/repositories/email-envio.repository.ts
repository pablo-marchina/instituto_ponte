import { pool } from "../database/pool.js";
import { toIsoString } from "../helpers/date.js";
import type { AuthUser } from "../models/auth.model.js";

/** Linha bruta da tabela `email_envio` com JOIN opcional em `aluno`. */
type EmailEnvioRow = {
  id: string;
  prova_aluno_id: string;
  prova_id?: string;
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

/** Linha de aluno com resultado para envio de email. */
type AlunoResultadoRow = {
  prova_aluno_id: string;
  aluno_id: string;
  aluno_nome: string;
  aluno_email: string;
  prova_titulo: string | null;
  nota_total: string | number | null;
  pontuacao_total: string | number | null;
  percentual: string | number | null;
  feedbacks: string | null;
};

/** Converte uma EmailEnvioRow (snake_case) para o formato de envio (camelCase).
 *  Inclui objeto `aluno` condicionalmente quando aluno_id está presente (JOIN). */
const mapEnvio = (row: EmailEnvioRow) => ({
  id: row.id,
  provaAlunoId: row.prova_aluno_id,
  ...(row.prova_id ? { provaId: row.prova_id } : {}),
  destinatario: row.destinatario,
  assunto: row.assunto,
  corpo: row.corpo ?? null,
  status: row.status,
  erro: row.erro ?? null,
  enviadoEm: toIsoString(row.enviado_em),
  criadoEm: toIsoString(row.criado_em) ?? "",
  ...(row.aluno_id
    ? { aluno: { id: row.aluno_id, nome: row.aluno_nome ?? "" } }
    : {}),
});

/**
 * Repositório de envio de e-mails de notificação com resultado.
 *
 * Ciclo de vida: pendente → enviado | erro. O disparo é delegado
 * a um adaptador externo. Filtra apenas alunos com prova corrigida.
 */
export class EmailEnvioRepository {
  /**
   * Verifica se o usuário tem acesso para gerenciar envios da prova.
   *
   * @param provaId - ID da prova.
   * @param user - Usuário autenticado.
   * @returns true se tiver acesso.
   */
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

  /**
   * Verifica se uma prova existe pelo ID.
   *
   * @param provaId - ID da prova.
   * @returns true se a prova existir.
   */
  async findProvaExists(provaId: string) {
    const result = await pool.query('SELECT 1 FROM "prova" WHERE "id" = $1', [provaId]);
    return result.rows.length > 0;
  }

  /**
   * Lista alunos com prova corrigida para envio de e-mail.
   *
   * @param provaId - ID da prova.
   * @returns Lista de alunos com resultado disponível.
   */
  async findAlunosComResultado(provaId: string) {
    const result = await pool.query<AlunoResultadoRow>(
      `WITH feedback_por_correcao AS (
        SELECT
          "correcao_id",
          STRING_AGG(DISTINCT NULLIF(BTRIM("mensagem"), ''), E'\n- ') AS "feedbacks"
        FROM "feedback"
        GROUP BY "correcao_id"
      ),
      itens AS (
        SELECT
          pa."id" AS "prova_aluno_id",
          COALESCE(c."nota", 0) AS "nota",
          COALESCE(pq."pontuacao_max", 0) AS "pontuacao_max",
          COALESCE(fpc."feedbacks", NULLIF(BTRIM(c."observacao"), '')) AS "feedback"
        FROM "prova_aluno" pa
        LEFT JOIN "resposta_aluno" ra ON ra."prova_aluno_id" = pa."id"
        LEFT JOIN "prova_questao" pq ON pq."prova_id" = pa."prova_id" AND pq."questao_id" = ra."questao_id"
        LEFT JOIN "correcao" c ON c."resposta_id" = ra."id"
        LEFT JOIN feedback_por_correcao fpc ON fpc."correcao_id" = c."id"
        WHERE pa."prova_id" = $1
          AND pa."status" = 'corrigida'
      )
      SELECT
        pa."id" AS "prova_aluno_id",
        a."id" AS "aluno_id",
        a."nome" AS "aluno_nome",
        a."email" AS "aluno_email",
        p."titulo" AS "prova_titulo",
        COALESCE(SUM(i."nota"), 0) AS "nota_total",
        COALESCE(SUM(i."pontuacao_max"), 0) AS "pontuacao_total",
        CASE
          WHEN COALESCE(SUM(i."pontuacao_max"), 0) > 0
            THEN ROUND((COALESCE(SUM(i."nota"), 0) / SUM(i."pontuacao_max")) * 100, 2)
          ELSE 0
        END AS "percentual",
        NULLIF(
          STRING_AGG(DISTINCT i."feedback", E'\n- ') FILTER (WHERE i."feedback" IS NOT NULL),
          ''
        ) AS "feedbacks"
      FROM "prova_aluno" pa
      JOIN "prova" p ON p."id" = pa."prova_id"
      JOIN "aluno" a ON a."id" = pa."aluno_id"
      LEFT JOIN itens i ON i."prova_aluno_id" = pa."id"
      WHERE pa."prova_id" = $1
        AND pa."status" = 'corrigida'
      GROUP BY pa."id", a."id", a."nome", a."email", p."titulo"
      ORDER BY a."nome" ASC`,
      [provaId],
    );
    return result.rows;
  }

  /**
   * Conta respostas sem correção pendentes em uma prova.
   *
   * @param provaId - ID da prova.
   * @returns Número de pendências de correção.
   */
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

  /**
   * Cria um registro de envio de e-mail com status "pendente".
   *
   * @param provaAlunoId - ID do vínculo prova-aluno.
   * @param destinatario - E-mail do destinatário.
   * @param assunto - Assunto do e-mail.
   * @param corpo - Corpo do e-mail.
   * @returns ID do registro criado.
   */
  async createEnvio(provaAlunoId: string, destinatario: string, assunto: string, corpo: string) {
    const result = await pool.query<{ id: string }>(
      `INSERT INTO "email_envio" ("prova_aluno_id", "destinatario", "assunto", "corpo", "status")
       VALUES ($1, $2, $3, $4, 'pendente')
       RETURNING "id"`,
      [provaAlunoId, destinatario, assunto, corpo],
    );
    return result.rows[0].id;
  }

  /**
   * Marca um envio como "enviado" com timestamp atual.
   *
   * @param id - ID do registro de envio.
   */
  async markAsSent(id: string) {
    await pool.query(
      `UPDATE "email_envio" SET "status" = 'enviado', "enviado_em" = CURRENT_TIMESTAMP, "erro" = NULL
       WHERE "id" = $1`,
      [id],
    );
  }

  /**
   * Marca um envio como "erro" com a mensagem de erro.
   *
   * @param id - ID do registro de envio.
   * @param error - Mensagem de erro.
   */
  async markAsError(id: string, error: string) {
    await pool.query(
      `UPDATE "email_envio" SET "status" = 'erro', "erro" = $1 WHERE "id" = $2`,
      [error, id],
    );
  }

  /**
   * Lista todos os envios de e-mail de uma prova com dados do aluno.
   *
   * @param provaId - ID da prova.
   * @returns Lista de envios.
   */
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

  /**
   * Busca um envio de e-mail pelo ID.
   *
   * @param id - ID do registro de envio.
   * @returns Dados do envio ou null.
   */
  async findById(id: string) {
    const result = await pool.query<EmailEnvioRow>(
      `SELECT ee."id", ee."prova_aluno_id", pa."prova_id", ee."destinatario", ee."assunto", ee."corpo", ee."status",
              ee."erro", ee."enviado_em", ee."criado_em"
       FROM "email_envio" ee
       JOIN "prova_aluno" pa ON pa."id" = ee."prova_aluno_id"
       WHERE ee."id" = $1`,
      [id],
    );
    return result.rows[0] ? mapEnvio(result.rows[0]) : null;
  }
}
