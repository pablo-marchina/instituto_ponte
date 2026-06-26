import { pool } from "../database/pool.js";

/** Linha bruta da tabela `avaliacao_log`. Campos em snake_case. */
type LogRow = {
  id: string;
  acao: string;
  criado_em: string;
};

/**
 * Repositório de auditoria de ações durante a avaliação.
 *
 * Registra eventos (início, pausa, envio) com metadados do ator
 * e detalhes em JSONB. Usado para rastreamento e analytics.
 */
export class AvaliacaoLogRepository {
  /**
   * Cria um registro de log de auditoria.
   *
   * @param input - Dados do log: provaId, provaAlunoId, atorTipo, atorId, acao e detalhes opcionais.
   * @returns Registro criado com id, acao e criadoEm.
   */
  async create(input: {
    provaId?: string;
    provaAlunoId?: string;
    atorTipo: string;
    atorId?: string;
    acao: string;
    detalhes?: Record<string, unknown>;
  }) {
    const result = await pool.query<LogRow>(
      `
      INSERT INTO "avaliacao_log" ("prova_id", "prova_aluno_id", "ator_tipo", "ator_id", "acao", "detalhes")
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING "id", "acao", "criado_em"
    `,
      [
        input.provaId ?? null,
        input.provaAlunoId ?? null,
        input.atorTipo,
        input.atorId ?? null,
        input.acao,
        input.detalhes ? JSON.stringify(input.detalhes) : "{}",
      ],
    );

    const raw = result.rows[0];
    const criadoEm = raw.criado_em;
    return {
      id: raw.id,
      acao: raw.acao,
      criadoEm: typeof criadoEm === "object" && (criadoEm as Date).toISOString
        ? (criadoEm as Date).toISOString()
        : String(criadoEm),
    };
  }
}
