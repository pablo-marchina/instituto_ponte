import { pool } from "../database/pool.js";
import type { AuthUser } from "../middlewares/auth.js";

type AnalyticsRow = {
  totalAlunos: string;
  acessos: string;
  inicios: string;
  envios: string;
  totalRespostas: string;
  totalAnexos: string;
  pendenciasCorrecao: string;
};

export class AnalyticsRepository {
  async hasAccessToProva(provaId: string, user: AuthUser) {
    if (user.perfil === "coordenador") return true;

    const result = await pool.query(
      `
      SELECT EXISTS (
        SELECT 1 FROM "prova" p
        WHERE p."id" = $1
          AND (
            p."professor_id" = $2
            OR EXISTS (
              SELECT 1 FROM "materia_professor" mp
              WHERE mp."materia_id" = p."materia_id" AND mp."professor_id" = $2
            )
          )
      ) AS "exists"
    `,
      [provaId, user.id],
    );

    return result.rows[0]?.exists ?? false;
  }

  async findProvaExists(provaId: string) {
    const result = await pool.query('SELECT 1 FROM "prova" WHERE "id" = $1', [provaId]);
    return result.rows.length > 0;
  }

  async obterAnalytics(provaId: string) {
    const result = await pool.query<AnalyticsRow>(
      `
      WITH stats_prova_aluno AS (
        SELECT
          COUNT(*) AS "total_alunos",
          COUNT(*) FILTER (WHERE "status" IN ('em_andamento', 'enviada', 'corrigida')) AS "iniciadas",
          COUNT(*) FILTER (WHERE "status" IN ('enviada', 'corrigida')) AS "enviadas"
        FROM "prova_aluno"
        WHERE "prova_id" = $1
      ),
      stats_respostas AS (
        SELECT COUNT(*) AS "total_respostas"
        FROM "resposta_aluno" ra
        JOIN "prova_aluno" pa ON pa."id" = ra."prova_aluno_id"
        WHERE pa."prova_id" = $1
      ),
      stats_anexos AS (
        SELECT COUNT(*) AS "total_anexos"
        FROM "resposta_anexo" ran
        JOIN "resposta_aluno" ra ON ra."id" = ran."resposta_id"
        JOIN "prova_aluno" pa ON pa."id" = ra."prova_aluno_id"
        WHERE pa."prova_id" = $1
      ),
      stats_pendencias AS (
        SELECT COUNT(*) AS "pendencias_correcao"
        FROM "resposta_aluno" ra
        LEFT JOIN "correcao" c ON c."resposta_id" = ra."id"
        JOIN "prova_aluno" pa ON pa."id" = ra."prova_aluno_id"
        WHERE pa."prova_id" = $1
          AND pa."status" IN ('enviada', 'corrigida')
          AND c."id" IS NULL
      ),
      stats_logs AS (
        SELECT COUNT(DISTINCT "prova_aluno_id") AS "acessos"
        FROM "avaliacao_log"
        WHERE "prova_id" = $1
      )
      SELECT
        COALESCE(spa."total_alunos", 0) AS "totalAlunos",
        COALESCE(sl."acessos", 0) AS "acessos",
        COALESCE(spa."iniciadas", 0) AS "inicios",
        COALESCE(spa."enviadas", 0) AS "envios",
        COALESCE(sr."total_respostas", 0) AS "totalRespostas",
        COALESCE(sa."total_anexos", 0) AS "totalAnexos",
        COALESCE(sp."pendencias_correcao", 0) AS "pendenciasCorrecao"
      FROM stats_prova_aluno spa
      CROSS JOIN stats_respostas sr
      CROSS JOIN stats_anexos sa
      CROSS JOIN stats_pendencias sp
      CROSS JOIN stats_logs sl
    `,
      [provaId],
    );

    return result.rows[0];
  }
}
