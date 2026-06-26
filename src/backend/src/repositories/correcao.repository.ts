import { pool } from "../database/pool.js";
import { withTransaction } from "../database/transaction.js";
import { toIsoString } from "../helpers/date.js";
import type { AuthUser } from "../middlewares/auth.js";
import type { CorrecaoQuestao, CorrecaoResposta, CorrecaoSalva, CorrecaoAutomatica } from "../models/correcao.model.js";
import type { SalvarCorrecaoInput } from "../schemas/correcao.schema.js";

/** Linha agregada de questão com contagem de respostas e correções. */
type CorrecaoQuestaoRow = {
  questao_id: string;
  ordem_original: number;
  pontuacao_max: string | number;
  tipo: string;
  enunciado: string | null;
  imagem_url: string | null;
  total_respostas: string;
  corrigidas: string;
};

/** Linha bruta de resposta com JOINs para aluno, anexos e correção. */
type CorrecaoRespostaRow = {
  resposta_id: string;
  questao_id: string;
  questao_tipo: string;
  questao_enunciado: string | null;
  questao_imagem_url: string | null;
  pontuacao_max: string | number;
  aluno_id: string;
  aluno_nome: string;
  resposta_texto: string | null;
  anexos: Array<{ id: string; urlArquivo: string; mimeType: string }> | null;
  alternativa_id: string | null;
  alternativa_ordem_original: number | null;
  alternativa_conteudo_latex: string | null;
  alternativa_url_imagem: string | null;
  alternativa_correta: boolean | null;
  alternativa_correta_id: string | null;
  alternativa_correta_ordem_original: number | null;
  alternativa_correta_conteudo_latex: string | null;
  alternativa_correta_url_imagem: string | null;
  correcao_id: string | null;
  correcao_nota: string | number | null;
  correcao_observacao: string | null;
  correcao_tipo: string | null;
  correcao_corrigida_em: Date | string | null;
};

/** Linha de contexto para validação de permissão de correção. */
type RespostaCorrecaoContextRow = {
  resposta_id: string;
  prova_id: string;
  professor_id: string;
  materia_id: string;
  questao_tipo: string;
  pontuacao_max: string | number;
  prova_aluno_status: string;
};

/** Linha bruta da tabela `correcao`. Campos em snake_case. */
type CorrecaoRow = {
  id: string;
  nota: string | number;
  tipo: "manual" | "automatica";
  corrigida_em: Date | string | null;
};

/** Converte uma CorrecaoQuestaoRow (snake_case) para o modelo CorrecaoQuestao (camelCase).
 *  total_respostas, corrigidas e pontuacao_max são convertidas de string (COUNT/NUMERIC) para Number. */
const mapQuestao = (row: CorrecaoQuestaoRow): CorrecaoQuestao => ({
  questaoId: row.questao_id,
  ordemOriginal: row.ordem_original,
  pontuacaoMax: Number(row.pontuacao_max),
  tipo: row.tipo,
  enunciado: row.enunciado,
  imagemUrl: row.imagem_url,
  respostas: {
    total: Number(row.total_respostas),
    corrigidas: Number(row.corrigidas),
  },
});

/** Converte uma CorrecaoRespostaRow (snake_case) para o modelo CorrecaoResposta (camelCase).
 *  Objetos aninhados aluno e correcao são populados; correcao só é montada se correcao_id existir.
 *  nota é convertida de string (NUMERIC) para Number. */
const mapResposta = (row: CorrecaoRespostaRow): CorrecaoResposta => ({
  respostaId: row.resposta_id,
  questaoId: row.questao_id,
  questaoTipo: row.questao_tipo,
  questaoEnunciado: row.questao_enunciado,
  questaoImagemUrl: row.questao_imagem_url,
  pontuacaoMax: Number(row.pontuacao_max),
  aluno: {
    id: row.aluno_id,
    nome: row.aluno_nome,
  },
  respostaTexto: row.resposta_texto,
  anexos: row.anexos ?? [],
  alternativaSelecionada: row.alternativa_id
    ? {
        id: row.alternativa_id,
        ordemOriginal: row.alternativa_ordem_original ?? 0,
        conteudoLatex: row.alternativa_conteudo_latex ?? "",
        urlImagem: row.alternativa_url_imagem,
        correta: row.alternativa_correta ?? false,
      }
    : null,
  alternativaCorreta: row.alternativa_correta_id
    ? {
        id: row.alternativa_correta_id,
        ordemOriginal: row.alternativa_correta_ordem_original ?? 0,
        conteudoLatex: row.alternativa_correta_conteudo_latex ?? "",
        urlImagem: row.alternativa_correta_url_imagem,
        correta: true,
      }
    : null,
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

/** Converte uma CorrecaoRow (snake_case) para o modelo CorrecaoSalva (camelCase).
 *  nota é convertida de string (NUMERIC) para Number. */
const mapCorrecao = (row: CorrecaoRow): CorrecaoSalva => ({
  id: row.id,
  nota: Number(row.nota),
  tipo: row.tipo,
  corrigidaEm: toIsoString(row.corrigida_em) ?? "",
});

/**
 * Repositório de correções manuais e automáticas de respostas.
 *
 * A correção automática (corrigirObjetivas) usa INSERT … ON CONFLICT
 * para atribuir nota conforme alternativa correta. upsertCorrecao
 * permite revisão de nota e inserção opcional de feedback.
 */
export class CorrecaoRepository {
  /**
   * Verifica se a prova existe antes de avaliar permissão de correção.
   *
   * @param provaId - ID da prova.
   * @returns true se a prova existir.
   */
  async findProvaExists(provaId: string) {
    const result = await pool.query('SELECT EXISTS (SELECT 1 FROM "prova" WHERE "id" = $1) AS "exists"', [
      provaId,
    ]);
    return result.rows[0]?.exists ?? false;
  }

  /**
   * Verifica se o usuário tem acesso à prova para correção.
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
   * Lista questões de uma prova com progresso de correção.
   *
   * @param provaId - ID da prova.
   * @returns Lista de questões com total de respostas e corrigidas.
   */
  async findQuestoesDaProva(provaId: string) {
    const result = await pool.query<CorrecaoQuestaoRow>(
      `
        SELECT
          pq."questao_id",
          pq."ordem_original",
          pq."pontuacao_max",
          q."tipo",
          e."conteudo_latex" AS "enunciado",
          e."url_imagem" AS "imagem_url",
          COUNT(ra."id") AS "total_respostas",
          COUNT(c."id") AS "corrigidas"
        FROM "prova_questao" pq
        JOIN "questao" q ON q."id" = pq."questao_id"
        LEFT JOIN "enunciado" e ON e."questao_id" = q."id"
        LEFT JOIN "prova_aluno" pa
          ON pa."prova_id" = pq."prova_id"
          AND pa."status" IN ('enviada', 'corrigida')
        LEFT JOIN "resposta_aluno" ra
          ON ra."prova_aluno_id" = pa."id"
          AND ra."questao_id" = pq."questao_id"
        LEFT JOIN "correcao" c ON c."resposta_id" = ra."id"
        WHERE pq."prova_id" = $1
        GROUP BY pq."questao_id", pq."ordem_original", pq."pontuacao_max", q."tipo", e."conteudo_latex", e."url_imagem"
        ORDER BY pq."ordem_original" ASC
      `,
      [provaId],
    );

    return result.rows.map(mapQuestao);
  }

  /**
   * Lista respostas de uma questão com dados do aluno, anexos e correção.
   *
   * @param provaId - ID da prova.
   * @param questaoId - ID da questão.
   * @returns Lista de respostas com dados completos.
   */
  async findRespostasPorQuestao(provaId: string, questaoId: string) {
    const result = await pool.query<CorrecaoRespostaRow>(
      `
        SELECT
          ra."id" AS "resposta_id",
          ra."questao_id",
          q."tipo" AS "questao_tipo",
          e."conteudo_latex" AS "questao_enunciado",
          e."url_imagem" AS "questao_imagem_url",
          pq."pontuacao_max",
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
          alt."id" AS "alternativa_id",
          alt."ordem_original" AS "alternativa_ordem_original",
          alt."conteudo_latex" AS "alternativa_conteudo_latex",
          alt."url_imagem" AS "alternativa_url_imagem",
          alt."correta" AS "alternativa_correta",
          correta."id" AS "alternativa_correta_id",
          correta."ordem_original" AS "alternativa_correta_ordem_original",
          correta."conteudo_latex" AS "alternativa_correta_conteudo_latex",
          correta."url_imagem" AS "alternativa_correta_url_imagem",
          c."id" AS "correcao_id",
          c."nota" AS "correcao_nota",
          c."observacao" AS "correcao_observacao",
          c."tipo" AS "correcao_tipo",
          c."corrigida_em" AS "correcao_corrigida_em"
        FROM "resposta_aluno" ra
        JOIN "prova_aluno" pa ON pa."id" = ra."prova_aluno_id"
        JOIN "aluno" a ON a."id" = pa."aluno_id"
        JOIN "questao" q ON q."id" = ra."questao_id"
        JOIN "prova_questao" pq ON pq."prova_id" = pa."prova_id" AND pq."questao_id" = ra."questao_id"
        LEFT JOIN "enunciado" e ON e."questao_id" = q."id"
        LEFT JOIN "alternativa" alt ON alt."id" = ra."alternativa_id"
        LEFT JOIN "alternativa" correta ON correta."questao_id" = q."id" AND correta."correta" = TRUE
        LEFT JOIN "resposta_anexo" an ON an."resposta_id" = ra."id"
        LEFT JOIN "correcao" c ON c."resposta_id" = ra."id"
        WHERE pa."prova_id" = $1
          AND ra."questao_id" = $2
          AND pa."status" IN ('enviada', 'corrigida')
        GROUP BY
          ra."id", ra."questao_id", q."tipo", e."conteudo_latex", e."url_imagem", pq."pontuacao_max",
          a."id", a."nome",
          alt."id", alt."ordem_original", alt."conteudo_latex", alt."url_imagem", alt."correta",
          correta."id", correta."ordem_original", correta."conteudo_latex", correta."url_imagem",
          c."id", c."nota", c."observacao", c."tipo", c."corrigida_em"
        ORDER BY a."nome" ASC
      `,
      [provaId, questaoId],
    );

    return result.rows.map(mapResposta);
  }

  /**
   * Busca contexto de uma resposta para validação de permissão de correção.
   *
   * @param respostaId - ID da resposta.
   * @returns Contexto da resposta ou null.
   */
  async findRespostaContext(respostaId: string) {
    const result = await pool.query<RespostaCorrecaoContextRow>(
      `
        SELECT
          ra."id" AS "resposta_id",
          p."id" AS "prova_id",
          p."professor_id",
          p."materia_id",
          q."tipo" AS "questao_tipo",
          pq."pontuacao_max",
          pa."status" AS "prova_aluno_status"
        FROM "resposta_aluno" ra
        JOIN "prova_aluno" pa ON pa."id" = ra."prova_aluno_id"
        JOIN "prova" p ON p."id" = pa."prova_id"
        JOIN "questao" q ON q."id" = ra."questao_id"
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
          questaoTipo: result.rows[0].questao_tipo,
          pontuacaoMax: Number(result.rows[0].pontuacao_max),
          provaAlunoStatus: result.rows[0].prova_aluno_status,
        }
      : null;
  }

  /**
   * Verifica se o professor possui vínculo com a matéria.
   *
   * @param professorId - ID do professor.
   * @param materiaId - ID da matéria.
   * @returns true se houver vínculo.
   */
  async professorLinkedToMateria(professorId: string, materiaId: string) {
    const result = await pool.query(
      'SELECT EXISTS (SELECT 1 FROM "materia_professor" WHERE "professor_id" = $1 AND "materia_id" = $2) AS "exists"',
      [professorId, materiaId],
    );
    return result.rows[0]?.exists ?? false;
  }

  /**
   * Cria ou atualiza uma correção manual para uma resposta.
   * Usa ON CONFLICT (resposta_id) para permitir revisão de nota.
   *
   * @param respostaId - ID da resposta a ser corrigida.
   * @param professorId - ID do professor responsável.
   * @param input - Dados da correção: nota, observacao e feedback opcional.
   * @returns Dados da correção salva.
   */
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
              "tipo" = (CASE WHEN "correcao"."tipo" = 'automatica' THEN 'automatica' ELSE 'manual' END)::"correcao_tipo",
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

      await client.query(
        `
          UPDATE "prova_aluno" pa
          SET "status" = 'corrigida'
          WHERE pa."id" = (
            SELECT ra."prova_aluno_id"
            FROM "resposta_aluno" ra
            WHERE ra."id" = $1
          )
            AND pa."status" IN ('enviada', 'corrigida')
            AND NOT EXISTS (
              SELECT 1
              FROM "resposta_aluno" pendente
              LEFT JOIN "correcao" c ON c."resposta_id" = pendente."id"
              WHERE pendente."prova_aluno_id" = pa."id"
                AND c."id" IS NULL
            )
        `,
        [respostaId],
      );

      return mapCorrecao(result.rows[0]);
    });
  }

  /**
   * Corrige automaticamente questões objetivas (múltipla escolha e verdadeiro/falso).
   * Atribui pontuacao_max se alternativa correta, zero caso contrário.
   * Retorna total de pendências discursivas que exigem correção manual.
   *
   * @param provaId - ID da prova.
   * @returns Resumo com respostas corrigidas e pendências discursivas.
   */
  async corrigirObjetivas(provaId: string): Promise<CorrecaoAutomatica> {
    return withTransaction(async (client) => {
      await client.query(
        `
          INSERT INTO "correcao" ("resposta_id", "professor_id", "nota", "tipo", "corrigida_em")
          SELECT
            ra."id",
            p."professor_id",
            CASE WHEN a."correta" = TRUE THEN pq."pontuacao_max" ELSE 0 END,
            'automatica',
            CURRENT_TIMESTAMP
          FROM "resposta_aluno" ra
          JOIN "prova_aluno" pa ON pa."id" = ra."prova_aluno_id"
          JOIN "prova" p ON p."id" = pa."prova_id"
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
        [provaId],
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

      await client.query(
        `
          UPDATE "prova_aluno" pa
          SET "status" = 'corrigida'
          WHERE pa."prova_id" = $1
            AND pa."status" IN ('enviada', 'corrigida')
            AND NOT EXISTS (
              SELECT 1
              FROM "resposta_aluno" pendente
              LEFT JOIN "correcao" c ON c."resposta_id" = pendente."id"
              WHERE pendente."prova_aluno_id" = pa."id"
                AND c."id" IS NULL
            )
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
