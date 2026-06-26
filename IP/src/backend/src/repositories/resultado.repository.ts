import { pool } from "../database/pool.js";
import { withTransaction } from "../database/transaction.js";
import type { AuthUser } from "../middlewares/auth.js";
import type { ResultadoAluno, ExportacaoResultado } from "../models/resultado.model.js";

/** Linha agregada de resultado com dados do aluno, notas e pendências. */
type ResultadoRow = {
  prova_aluno_id: string;
  aluno_id: string;
  aluno_nome: string;
  aluno_email: string;
  questoes: Array<{ questaoId: string; nota: number | string | null; status: "corrigida" | "pendente" }>;
  nota_total: string | number;
  pontuacao_total: string | number;
  pendencias_correcao: string;
  liberado: boolean | null;
};

/** Linha bruta da tabela `exportacao_resultado`. Campos em snake_case. */
type ExportacaoResultadoRow = {
  id: string;
  url_arquivo: string;
  formato: "xlsx" | "csv";
};

/** Converte uma ResultadoRow (snake_case) para o modelo ResultadoAluno (camelCase).
 *  Calcula percentual como (nota_total / pontuacao_total) * 100 com proteção contra divisão por zero.
 *  Valores numéricos são convertidos de string (NUMERIC) para Number.
 *  liberado usa fallback para false quando null. */
const mapResultado = (row: ResultadoRow): ResultadoAluno => {
  const notaTotal = Number(row.nota_total);
  const pontuacaoTotal = Number(row.pontuacao_total);
  const percentual = pontuacaoTotal > 0 ? Number(((notaTotal / pontuacaoTotal) * 100).toFixed(2)) : 0;

  return {
    provaAlunoId: row.prova_aluno_id,
    aluno: {
      id: row.aluno_id,
      nome: row.aluno_nome,
      email: row.aluno_email,
    },
    notaTotal,
    percentual,
    liberado: row.liberado ?? false,
    pendenciasCorrecao: Number(row.pendencias_correcao),
    questoes: row.questoes.map((questao) => ({
      questaoId: questao.questaoId,
      nota: questao.nota === null ? null : Number(questao.nota),
      status: questao.status,
    })),
  };
};

/**
 * Repositório de resultados consolidados por prova e exportação.
 *
 * findByProva usa três CTEs encadeadas em transação para calcular
 * notas agregadas por aluno e fazer upsert em resultado_aluno.
 */
export class ResultadoRepository {
  async findProvaExists(provaId: string) {
    const result = await pool.query('SELECT 1 FROM "prova" WHERE "id" = $1', [provaId]);
    return result.rows.length > 0;
  }

  /**
   * Verifica se o usuário tem acesso aos resultados da prova.
   *
   * @param provaId - ID da prova.
   * @param user - Usuário autenticado.
   * @returns true se tiver acesso.
   */
  async hasAccessToProva(provaId: string, user: AuthUser) {
    if (user.perfil === "coordenador") return true;

    const result = await pool.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM "prova" p
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

  /**
   * Calcula e retorna os resultados consolidados de uma prova.
   * Usa CTEs encadeadas para agregar notas por aluno e fazer upsert
   * na tabela resultado_aluno com cálculo de percentual.
   *
   * @param provaId - ID da prova.
   * @returns Lista de resultados por aluno.
   */
  async findByProva(provaId: string) {
    return withTransaction(async (client) => {
      const result = await client.query<ResultadoRow>(
        `
          WITH itens AS (
            SELECT
              pa."id" AS "prova_aluno_id",
              a."id" AS "aluno_id",
              a."nome" AS "aluno_nome",
              a."email" AS "aluno_email",
              pq."questao_id",
              pq."ordem_original",
              pq."pontuacao_max",
              c."nota",
              CASE WHEN c."id" IS NULL THEN 'pendente' ELSE 'corrigida' END AS "status"
            FROM "prova_aluno" pa
            JOIN "aluno" a ON a."id" = pa."aluno_id"
            JOIN "prova_questao" pq ON pq."prova_id" = pa."prova_id"
            LEFT JOIN "resposta_aluno" ra
              ON ra."prova_aluno_id" = pa."id"
              AND ra."questao_id" = pq."questao_id"
            LEFT JOIN "correcao" c ON c."resposta_id" = ra."id"
            WHERE pa."prova_id" = $1
              AND pa."status" IN ('enviada', 'corrigida')
          ),
          consolidados AS (
            SELECT
              i."prova_aluno_id",
              i."aluno_id",
              i."aluno_nome",
              i."aluno_email",
              COALESCE(SUM(i."nota"), 0) AS "nota_total",
              COALESCE(SUM(i."pontuacao_max"), 0) AS "pontuacao_total",
              COUNT(*) FILTER (WHERE i."status" = 'pendente') AS "pendencias_correcao",
              json_agg(
                json_build_object(
                  'questaoId', i."questao_id",
                  'nota', i."nota",
                  'status', i."status"
                )
                ORDER BY i."ordem_original"
              ) AS "questoes"
            FROM itens i
            GROUP BY i."prova_aluno_id", i."aluno_id", i."aluno_nome", i."aluno_email"
          ),
          upserted AS (
            INSERT INTO "resultado_aluno" ("prova_aluno_id", "nota_total", "percentual", "liberado")
            SELECT
              c."prova_aluno_id",
              c."nota_total",
              CASE
                WHEN c."pontuacao_total" > 0 THEN ROUND((c."nota_total" / c."pontuacao_total") * 100, 2)
                ELSE 0
              END,
              FALSE
            FROM consolidados c
            ON CONFLICT ("prova_aluno_id") DO UPDATE
            SET "nota_total" = EXCLUDED."nota_total",
                "percentual" = EXCLUDED."percentual",
                "atualizado_em" = CURRENT_TIMESTAMP
            RETURNING "prova_aluno_id", "liberado"
          )
          SELECT
            c."prova_aluno_id",
            c."aluno_id",
            c."aluno_nome",
            c."aluno_email",
            c."questoes",
            c."nota_total",
            c."pontuacao_total",
            c."pendencias_correcao",
            u."liberado"
          FROM consolidados c
          JOIN upserted u ON u."prova_aluno_id" = c."prova_aluno_id"
          ORDER BY c."aluno_nome" ASC
        `,
        [provaId],
      );

      return result.rows.map(mapResultado);
    });
  }

  /**
   * Registra uma exportação de resultados (XLSX ou CSV) no banco.
   *
   * @param provaId - ID da prova exportada.
   * @param coordenadorId - ID do coordenador que solicitou, quando aplicavel.
   * @param formato - Formato do arquivo: "xlsx" ou "csv".
   * @param urlArquivo - URL do arquivo gerado.
   * @param pendenciasCorrecao - Número de pendências no momento da exportação.
   * @returns Dados da exportação registrada.
   */
  async createExportacao(
    provaId: string,
    coordenadorId: string | null,
    formato: "xlsx" | "csv",
    urlArquivo: string,
    pendenciasCorrecao: number,
  ) {
    const result = await pool.query<ExportacaoResultadoRow>(
      `
        INSERT INTO "exportacao_resultado" ("prova_id", "coordenador_id", "formato", "url_arquivo")
        VALUES ($1, $2, $3, $4)
        RETURNING "id", "url_arquivo", "formato"
      `,
      [provaId, coordenadorId, formato, urlArquivo],
    );

    return {
      id: result.rows[0].id,
      urlArquivo: result.rows[0].url_arquivo,
      formato: result.rows[0].formato,
      pendenciasCorrecao,
    };
  }
}
