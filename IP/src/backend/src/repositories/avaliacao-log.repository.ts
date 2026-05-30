import { pool } from "../database/pool.js";

type LogRow = {
  id: string;
  acao: string;
  criado_em: string;
};

export class AvaliacaoLogRepository {
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
