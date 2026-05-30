import { pool } from "../database/pool.js";
import { withTransaction } from "../database/transaction.js";
import { toIsoString } from "../helpers/date.js";
import type { AuthUser } from "../middlewares/auth.js";
import type { SalvarCorrecaoInput } from "../schemas/correcao.schema.js";

type CorrecaoQuestaoRow = {
  questao_id: string;
  ordem_original: number;
  pontuacao_max: string | number;
  total_respostas: string;
  corrigidas: string;
};

type CorrecaoRespostaRow = {
  resposta_id: string;
  aluno_id: string;
  aluno_nome: string;
  resposta_texto: string | null;
  anexos: Array<{ id: string; urlArquivo: string; mimeType: string }> | null;
  correcao_id: string | null;
  correcao_nota: string | number | null;
  correcao_observacao: string | null;
  correcao_tipo: string | null;
  correcao_corrigida_em: Date | string | null;
};

type RespostaCorrecaoContextRow = {
  resposta_id: string;
  prova_id: string;
  professor_id: string;
  materia_id: string;
  pontuacao_max: string | number;
  prova_aluno_status: string;
};

type CorrecaoRow = {
  id: string;
  nota: string | number;
  tipo: "manual";
  corrigida_em: Date | string | null;
};

const mapQuestao = (row: CorrecaoQuestaoRow) => ({
  questaoId: row.questao_id,
  ordemOriginal: row.ordem_original,
  pontuacaoMax: Number(row.pontuacao_max),
  respostas: {
    total: Number(row.total_respostas),
    corrigidas: Number(row.corrigidas),
  },
});

const mapResposta = (row: CorrecaoRespostaRow) => ({
  respostaId: row.resposta_id,
  aluno: {
    id: row.aluno_id,
    nome: row.aluno_nome,
  },
  respostaTexto: row.resposta_texto,
  anexos: row.anexos ?? [],
  correcao: row.correcao_id
    ? {
        id: row.correcao_id,
        nota: Number(row.correcao_nota),
        observacao: row.correcao_observacao,
        tipo: row.correcao_tipo ?? "manual",
        corrigidaEm: toIsoString(row.correcao_corrigida_em),
      }
    : null,
});

const mapCorrecao = (row: CorrecaoRow) => ({
  id: row.id,
  nota: Number(row.nota),
  tipo: row.tipo,
  corrigidaEm: toIsoString(row.corrigida_em) ?? "",
});

export class CorrecaoRepository {
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

  async findQuestoesDaProva(provaId: string) {
    const result = await pool.query<CorrecaoQuestaoRow>(
      `
        SELECT
          pq."questao_id",
          pq."ordem_original",
          pq."pontuacao_max",
          COUNT(ra."id") AS "total_respostas",
          COUNT(c."id") AS "corrigidas"
        FROM "prova_questao" pq
        LEFT JOIN "prova_aluno" pa
          ON pa."prova_id" = pq."prova_id"
          AND pa."status" IN ('enviada', 'corrigida')
        LEFT JOIN "resposta_aluno" ra
          ON ra."prova_aluno_id" = pa."id"
          AND ra."questao_id" = pq."questao_id"
        LEFT JOIN "correcao" c ON c."resposta_id" = ra."id"
        WHERE pq."prova_id" = $1
        GROUP BY pq."questao_id", pq."ordem_original", pq."pontuacao_max"
        ORDER BY pq."ordem_original" ASC
      `,
      [provaId],
    );

    return result.rows.map(mapQuestao);
  }

  async findRespostasPorQuestao(provaId: string, questaoId: string) {
    const result = await pool.query<CorrecaoRespostaRow>(
      `
        SELECT
          ra."id" AS "resposta_id",
          a."id" AS "aluno_id",
          a."nome" AS "aluno_nome",
          ra."resposta_texto",
          COALESCE(
            json_agg(
              json_build_object(
                'id', an."id",
                'urlArquivo', an."url_arquivo",
                'mimeType', an."mime_type"
              )
              ORDER BY an."criado_em"
            ) FILTER (WHERE an."id" IS NOT NULL),
            '[]'::json
          ) AS "anexos",
          c."id" AS "correcao_id",
          c."nota" AS "correcao_nota",
          c."observacao" AS "correcao_observacao",
          c."tipo" AS "correcao_tipo",
          c."corrigida_em" AS "correcao_corrigida_em"
        FROM "resposta_aluno" ra
        JOIN "prova_aluno" pa ON pa."id" = ra."prova_aluno_id"
        JOIN "aluno" a ON a."id" = pa."aluno_id"
        LEFT JOIN "resposta_anexo" an ON an."resposta_id" = ra."id"
        LEFT JOIN "correcao" c ON c."resposta_id" = ra."id"
        WHERE pa."prova_id" = $1
          AND ra."questao_id" = $2
          AND pa."status" IN ('enviada', 'corrigida')
        GROUP BY ra."id", a."id", a."nome", c."id", c."nota", c."observacao", c."tipo", c."corrigida_em"
        ORDER BY a."nome" ASC
      `,
      [provaId, questaoId],
    );

    return result.rows.map(mapResposta);
  }

  async findRespostaContext(respostaId: string) {
    const result = await pool.query<RespostaCorrecaoContextRow>(
      `
        SELECT
          ra."id" AS "resposta_id",
          p."id" AS "prova_id",
          p."professor_id",
          p."materia_id",
          pq."pontuacao_max",
          pa."status" AS "prova_aluno_status"
        FROM "resposta_aluno" ra
        JOIN "prova_aluno" pa ON pa."id" = ra."prova_aluno_id"
        JOIN "prova" p ON p."id" = pa."prova_id"
        JOIN "prova_questao" pq
          ON pq."prova_id" = p."id"
          AND pq."questao_id" = ra."questao_id"
        WHERE ra."id" = $1
      `,
      [respostaId],
    );

    return result.rows[0]
      ? {
          respostaId: result.rows[0].resposta_id,
          provaId: result.rows[0].prova_id,
          professorId: result.rows[0].professor_id,
          materiaId: result.rows[0].materia_id,
          pontuacaoMax: Number(result.rows[0].pontuacao_max),
          provaAlunoStatus: result.rows[0].prova_aluno_status,
        }
      : null;
  }

  async professorLinkedToMateria(professorId: string, materiaId: string) {
    const result = await pool.query(
      'SELECT EXISTS (SELECT 1 FROM "materia_professor" WHERE "professor_id" = $1 AND "materia_id" = $2) AS "exists"',
      [professorId, materiaId],
    );
    return result.rows[0]?.exists ?? false;
  }

  async upsertCorrecao(respostaId: string, professorId: string, input: SalvarCorrecaoInput) {
    return withTransaction(async (client) => {
      const result = await client.query<CorrecaoRow>(
        `
          INSERT INTO "correcao" ("resposta_id", "professor_id", "nota", "observacao", "tipo", "corrigida_em")
          VALUES ($1, $2, $3, $4, 'manual', CURRENT_TIMESTAMP)
          ON CONFLICT ("resposta_id") DO UPDATE
          SET "professor_id" = EXCLUDED."professor_id",
              "nota" = EXCLUDED."nota",
              "observacao" = EXCLUDED."observacao",
              "tipo" = 'manual',
              "corrigida_em" = CURRENT_TIMESTAMP
          RETURNING "id", "nota", "tipo", "corrigida_em"
        `,
        [respostaId, professorId, input.nota, input.observacao ?? null],
      );

      if (input.feedback) {
        await client.query(
          'INSERT INTO "feedback" ("correcao_id", "professor_id", "mensagem") VALUES ($1, $2, $3)',
          [result.rows[0].id, professorId, input.feedback],
        );
      }

      return mapCorrecao(result.rows[0]);
    });
  }

  async corrigirObjetivas(provaId: string, professorId: string) {
    return withTransaction(async (client) => {
      await client.query(
        `
          INSERT INTO "correcao" ("resposta_id", "professor_id", "nota", "tipo", "corrigida_em")
          SELECT
            ra."id",
            $2,
            CASE WHEN a."correta" = TRUE THEN pq."pontuacao_max" ELSE 0 END,
            'automatica',
            CURRENT_TIMESTAMP
          FROM "resposta_aluno" ra
          JOIN "prova_aluno" pa ON pa."id" = ra."prova_aluno_id"
          JOIN "prova_questao" pq ON pq."prova_id" = pa."prova_id" AND pq."questao_id" = ra."questao_id"
          JOIN "questao" q ON q."id" = ra."questao_id"
          JOIN "alternativa" a ON a."id" = ra."alternativa_id"
          WHERE pa."prova_id" = $1
            AND pa."status" IN ('enviada', 'corrigida')
            AND q."tipo" IN ('multipla_escolha', 'verdadeiro_falso')
            AND ra."alternativa_id" IS NOT NULL
          ON CONFLICT ("resposta_id") DO UPDATE
          SET "nota" = EXCLUDED."nota",
              "tipo" = 'automatica',
              "corrigida_em" = CURRENT_TIMESTAMP
        `,
        [provaId, professorId],
      );

      const discursivas = await client.query<{ total: string }>(
        `
          SELECT COUNT(ra."id") AS "total"
          FROM "resposta_aluno" ra
          JOIN "prova_aluno" pa ON pa."id" = ra."prova_aluno_id"
          JOIN "questao" q ON q."id" = ra."questao_id"
          LEFT JOIN "correcao" c ON c."resposta_id" = ra."id"
          WHERE pa."prova_id" = $1
            AND pa."status" IN ('enviada', 'corrigida')
            AND q."tipo" = 'discursiva'
            AND c."id" IS NULL
        `,
        [provaId],
      );

      const corrigidas = await client.query<{ total: string }>(
        `
          SELECT COUNT(ra."id") AS "total"
          FROM "resposta_aluno" ra
          JOIN "prova_aluno" pa ON pa."id" = ra."prova_aluno_id"
          JOIN "questao" q ON q."id" = ra."questao_id"
          WHERE pa."prova_id" = $1
            AND pa."status" IN ('enviada', 'corrigida')
            AND q."tipo" IN ('multipla_escolha', 'verdadeiro_falso')
            AND ra."alternativa_id" IS NOT NULL
        `,
        [provaId],
      );

      return {
        provaId,
        respostasCorrigidas: Number(corrigidas.rows[0]?.total ?? 0),
        discursivasPendentes: Number(discursivas.rows[0]?.total ?? 0),
      };
    });
  }
}
