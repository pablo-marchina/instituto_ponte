import { pool } from "../database/pool.js";
import { toIsoString } from "../helpers/date.js";
import type { AuthUser } from "../models/auth.model.js";
import type { AddQuestaoProvaInput } from "../schemas/prova-questao.schema.js";

/** Linha resumo da tabela `prova` para validação de existência. */
type ProvaResumoRow = {
  id: string;
  materia_id: string;
  status: string;
};

/** Linha resumo da tabela `questao` para validação de existência. */
type QuestaoResumoRow = {
  id: string;
  materia_id: string;
  tem_enunciado: boolean;
};

/** Linha bruta da tabela `prova_questao` com JOIN opcional com `questao` e `enunciado`. */
type ProvaQuestaoRow = {
  prova_id: string;
  questao_id: string;
  ordem_original: number;
  pontuacao_max: string | number;
  criado_em: Date | string;
  questao_tipo?: string;
  questao_dificuldade?: string | null;
  questao_materia_id?: string;
  questao_tema_id?: string | null;
  questao_limite_caracteres?: number | null;
  questao_limite_palavras?: number | null;
  questao_permite_anexo?: boolean;
  questao_pontuacao_padrao?: string | number;
  questao_ativa?: boolean;
  questao_criado_em?: Date | string;
  questao_atualizado_em?: Date | string;
  enunciado_conteudo_latex?: string | null;
  enunciado_url_imagem?: string | null;
};

/** Converte uma ProvaQuestaoRow (snake_case) para o modelo de associação (camelCase).
 *  - pontuacao_max é convertida de string (NUMERIC) para Number.
 *  - O objeto `questao` é montado apenas quando há dados de JOIN (questao_tipo presente).
 *  - enunciado.conteudoLatex usa fallback para string vazia. */
const mapProvaQuestao = (row: ProvaQuestaoRow) => ({
  provaId: row.prova_id,
  questaoId: row.questao_id,
  ordemOriginal: row.ordem_original,
  pontuacaoMax: Number(row.pontuacao_max),
  criadoEm: toIsoString(row.criado_em) ?? "",
  questao: row.questao_tipo
    ? {
        id: row.questao_id,
        materiaId: row.questao_materia_id ?? "",
        temaId: row.questao_tema_id ?? null,
        tipo: row.questao_tipo,
        dificuldade: row.questao_dificuldade ?? "Media",
        limiteCaracteres: row.questao_limite_caracteres ?? null,
        limitePalavras: row.questao_limite_palavras ?? null,
        permiteAnexo: row.questao_permite_anexo ?? false,
        pontuacaoPadrao: Number(row.questao_pontuacao_padrao ?? 1),
        ativa: row.questao_ativa ?? true,
        criadoEm: toIsoString(row.questao_criado_em ?? null) ?? "",
        atualizadoEm: toIsoString(row.questao_atualizado_em ?? null) ?? "",
        enunciado: {
          conteudoLatex: row.enunciado_conteudo_latex ?? "",
          urlImagem: row.enunciado_url_imagem ?? null,
        },
        alternativas: [],
        timesUsed: 0,
        successRate: 0,
      }
    : undefined,
});

/** Fragmento SQL reutilizável que JOIN prova_questao com questao e enunciado.
 *  Colunas da questão são prefixadas com "questao_" e do enunciado com "enunciado_"
 *  para evitar colisão com campos da tabela prova_questao. */
const selectProvaQuestaoSql = `
  SELECT
    pq."prova_id",
    pq."questao_id",
    pq."ordem_original",
    pq."pontuacao_max",
    pq."criado_em",
    q."tipo" AS "questao_tipo",
    q."dificuldade" AS "questao_dificuldade",
    q."materia_id" AS "questao_materia_id",
    q."tema_id" AS "questao_tema_id",
    q."limite_caracteres" AS "questao_limite_caracteres",
    q."limite_palavras" AS "questao_limite_palavras",
    q."permite_anexo" AS "questao_permite_anexo",
    q."pontuacao_padrao" AS "questao_pontuacao_padrao",
    q."ativa" AS "questao_ativa",
    q."criado_em" AS "questao_criado_em",
    q."atualizado_em" AS "questao_atualizado_em",
    e."conteudo_latex" AS "enunciado_conteudo_latex",
    e."url_imagem" AS "enunciado_url_imagem"
  FROM "prova_questao" pq
  JOIN "questao" q ON q."id" = pq."questao_id"
  JOIN "enunciado" e ON e."questao_id" = q."id"
`;

let provaQuestaoSchemaEnsured = false;

/**
 * Repositório da associação entre provas e questões (tabela `prova_questao`).
 *
 * Define ordem e pontuação máxima de cada questão na prova.
 * A consulta principal usa JOIN com questao e enunciado para evitar N+1.
 */
export class ProvaQuestaoRepository {
  private async ensureSchema() {
    if (provaQuestaoSchemaEnsured) return;
    await pool.query('ALTER TABLE "questao" ADD COLUMN IF NOT EXISTS "dificuldade" TEXT NULL');
    provaQuestaoSchemaEnsured = true;
  }

  /**
   * Busca dados resumidos da prova para validação de existência.
   *
   * @param provaId - ID da prova.
   * @returns Dados resumidos da prova ou null.
   */
  async findProva(provaId: string) {
    await this.ensureSchema();
    const result = await pool.query<ProvaResumoRow>(
      'SELECT "id", "materia_id", "status" FROM "prova" WHERE "id" = $1',
      [provaId],
    );
    return result.rows[0] ?? null;
  }

  /**
   * Verifica se o usuário tem acesso à prova para gerenciar questões.
   *
   * @param provaId - ID da prova.
   * @param user - Usuário autenticado.
   * @returns true se tiver acesso.
   */
  async hasAccess(provaId: string, user: AuthUser) {
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
                WHERE mp."materia_id" = p."materia_id"
                  AND mp."professor_id" = $2
              )
            )
        ) AS "exists"
      `,
      [provaId, user.id],
    );
    return result.rows[0]?.exists ?? false;
  }

  /**
   * Busca dados resumidos da questão para validação de existência e enunciado.
   *
   * @param questaoId - ID da questão.
   * @returns Dados resumidos da questão ou null.
   */
  async findQuestao(questaoId: string) {
    await this.ensureSchema();
    const result = await pool.query<QuestaoResumoRow>(
      `
        SELECT q."id", q."materia_id", EXISTS (
          SELECT 1 FROM "enunciado" e WHERE e."questao_id" = q."id"
        ) AS "tem_enunciado"
        FROM "questao" q
        WHERE q."id" = $1
      `,
      [questaoId],
    );
    return result.rows[0] ?? null;
  }

  /**
   * Verifica se uma ordem já está em uso na prova (unicidade de ordem).
   *
   * @param provaId - ID da prova.
   * @param ordemOriginal - Número de ordem a verificar.
   * @returns true se a ordem já estiver ocupada.
   */
  async hasOrdem(provaId: string, ordemOriginal: number) {
    const result = await pool.query(
      'SELECT EXISTS (SELECT 1 FROM "prova_questao" WHERE "prova_id" = $1 AND "ordem_original" = $2) AS "exists"',
      [provaId, ordemOriginal],
    );
    return result.rows[0]?.exists ?? false;
  }

  /**
   * Verifica se a questão já está vinculada à prova (evita duplicidade).
   *
   * @param provaId - ID da prova.
   * @param questaoId - ID da questão.
   * @returns true se a questão já estiver na prova.
   */
  async hasQuestao(provaId: string, questaoId: string) {
    const result = await pool.query(
      'SELECT EXISTS (SELECT 1 FROM "prova_questao" WHERE "prova_id" = $1 AND "questao_id" = $2) AS "exists"',
      [provaId, questaoId],
    );
    return result.rows[0]?.exists ?? false;
  }

  /**
   * Associa uma questão a uma prova com ordem e pontuação máxima.
   *
   * @param provaId - ID da prova.
   * @param input - Dados da associação: questaoId, ordemOriginal, pontuacaoMax opcional.
   * @returns A associação recém-criada com dados da questão via JOIN.
   */
  async create(provaId: string, input: AddQuestaoProvaInput) {
    const result = await pool.query<ProvaQuestaoRow>(
      `
        INSERT INTO "prova_questao" ("prova_id", "questao_id", "ordem_original", "pontuacao_max")
        VALUES ($1, $2, $3, COALESCE($4, 1))
        RETURNING *
      `,
      [provaId, input.questaoId, input.ordemOriginal, input.pontuacaoMax ?? null],
    );
    return mapProvaQuestao(result.rows[0]);
  }

  /**
   * Lista todas as questões de uma prova ordenadas por ordem original.
   *
   * @param provaId - ID da prova.
   * @returns Lista de associações com dados completos das questões.
   */
  async findByProva(provaId: string) {
    await this.ensureSchema();
    const result = await pool.query<ProvaQuestaoRow>(
      `
        ${selectProvaQuestaoSql}
        WHERE pq."prova_id" = $1
        ORDER BY pq."ordem_original" ASC
      `,
      [provaId],
    );
    return result.rows.map(mapProvaQuestao);
  }

  /**
   * Reordena uma questao e recompata as posicoes da prova.
   *
   * @param provaId - ID da prova.
   * @param questaoId - ID da questao movida.
   * @param ordemOriginal - Nova posicao desejada.
   * @returns Lista atualizada de vinculos.
   */
  async reorder(provaId: string, questaoId: string, ordemOriginal: number) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const current = await client.query<ProvaQuestaoRow>(
        `
          SELECT *
          FROM "prova_questao"
          WHERE "prova_id" = $1
          ORDER BY "ordem_original" ASC
        `,
        [provaId],
      );

      const rows = current.rows;
      const currentIndex = rows.findIndex((row) => row.questao_id === questaoId);
      if (currentIndex === -1) {
        await client.query("ROLLBACK");
        return null;
      }

      const [moved] = rows.splice(currentIndex, 1);
      const nextIndex = Math.min(Math.max(ordemOriginal - 1, 0), rows.length);
      rows.splice(nextIndex, 0, moved);

      await client.query(
        'UPDATE "prova_questao" SET "ordem_original" = "ordem_original" + 10000 WHERE "prova_id" = $1',
        [provaId],
      );

      for (const [index, row] of rows.entries()) {
        await client.query(
          'UPDATE "prova_questao" SET "ordem_original" = $1 WHERE "prova_id" = $2 AND "questao_id" = $3',
          [index + 1, provaId, row.questao_id],
        );
      }

      await client.query("COMMIT");
      return this.findByProva(provaId);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Remove a associação entre uma questão e uma prova.
   *
   * @param provaId - ID da prova.
   * @param questaoId - ID da questão a ser removida.
   */
  async delete(provaId: string, questaoId: string) {
    await pool.query('DELETE FROM "prova_questao" WHERE "prova_id" = $1 AND "questao_id" = $2', [
      provaId,
      questaoId,
    ]);
  }
}
