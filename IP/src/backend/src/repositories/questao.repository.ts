import type { PoolClient } from "pg";
import { pool } from "../database/pool.js";
import { withTransaction } from "../database/transaction.js";
import { toIsoString } from "../helpers/date.js";
import type { AuthUser } from "../models/auth.model.js";
import type { Questao, QuestaoTipo } from "../models/questao.model.js";
import type { CreateQuestaoInput, ListQuestoesQuery, UpdateQuestaoInput } from "../schemas/questao.schema.js";

/** Linha bruta da tabela `questao` com JOINs para `enunciado` e `alternativa`. */
type QuestaoRow = {
  id: string;
  materia_id: string;
  tema_id: string | null;
  tipo: string;
  dificuldade: string | null;
  limite_caracteres: number | null;
  limite_palavras: number | null;
  permite_anexo: boolean;
  pontuacao_padrao: string | number;
  ativa: boolean;
  criado_em: Date | string;
  atualizado_em: Date | string;
  enunciado_conteudo_latex: string | null;
  enunciado_url_imagem: string | null;
  alternativas: Array<{
    id: string;
    ordemOriginal: number;
    conteudoLatex: string;
    urlImagem: string | null;
    correta: boolean;
  }> | null;
  times_used?: string | number | null;
  success_rate?: string | number | null;
  total?: string;
};

/** Converte uma QuestaoRow (snake_case) para o modelo Questao (camelCase).
 *  - pontuacao_padrao é convertida de string (NUMERIC) para Number.
 *  - enunciado.conteudoLatex usa fallback para string vazia.
 *  - alternativas é sempre um array (nunca null). */
const mapQuestao = (row: QuestaoRow): Questao => ({
  id: row.id,
  materiaId: row.materia_id,
  temaId: row.tema_id,
  tipo: row.tipo as QuestaoTipo,
  dificuldade: row.dificuldade ?? "Media",
  limiteCaracteres: row.limite_caracteres,
  limitePalavras: row.limite_palavras,
  permiteAnexo: row.permite_anexo,
  pontuacaoPadrao: Number(row.pontuacao_padrao),
  ativa: row.ativa,
  criadoEm: toIsoString(row.criado_em) ?? "",
  atualizadoEm: toIsoString(row.atualizado_em) ?? "",
  enunciado: {
    conteudoLatex: row.enunciado_conteudo_latex ?? "",
    urlImagem: row.enunciado_url_imagem,
  },
  alternativas: row.alternativas ?? [],
  timesUsed: Number(row.times_used ?? 0),
  successRate: Math.round(Number(row.success_rate ?? 0)),
});

/** Fragmento SQL reutilizável que agrega alternativas via json_agg com FILTER.
 *  COALESCE com '[]'::json garante array vazio para questões sem alternativas.
 *  LEFT JOIN permite retornar questões discursivas sem alternativas. */
const selectQuestaoSql = `
  SELECT
    q.*,
    e."conteudo_latex" AS "enunciado_conteudo_latex",
    e."url_imagem" AS "enunciado_url_imagem",
    COALESCE(
      json_agg(
        json_build_object(
          'id', a."id",
          'ordemOriginal', a."ordem_original",
          'conteudoLatex', a."conteudo_latex",
          'urlImagem', a."url_imagem",
          'correta', a."correta"
        )
        ORDER BY a."ordem_original"
      ) FILTER (WHERE a."id" IS NOT NULL),
      '[]'::json
    ) AS "alternativas"
    ,
    (
      SELECT COUNT(DISTINCT pqm."prova_id")
      FROM "prova_questao" pqm
      WHERE pqm."questao_id" = q."id"
    ) AS "times_used",
    COALESCE(
      (
        SELECT ROUND(
          (
            COUNT(ram."id") FILTER (WHERE altm."correta" = TRUE)::numeric
            / NULLIF(COUNT(ram."id") FILTER (WHERE ram."alternativa_id" IS NOT NULL), 0)
          ) * 100,
          0
        )
        FROM "resposta_aluno" ram
        LEFT JOIN "alternativa" altm ON altm."id" = ram."alternativa_id"
        WHERE ram."questao_id" = q."id"
      ),
      0
    ) AS "success_rate"
  FROM "questao" q
  JOIN "enunciado" e ON e."questao_id" = q."id"
  LEFT JOIN "alternativa" a ON a."questao_id" = q."id"
`;

/** Insere as alternativas de uma questão dentro de uma transação.
 *  Percorre o array e executa INSERT individual para cada alternativa. */
const insertAlternativas = async (
  client: PoolClient,
  questaoId: string,
  alternativas: NonNullable<CreateQuestaoInput["alternativas"]>,
) => {
  for (const alternativa of alternativas) {
    await client.query(
      `
        INSERT INTO "alternativa" (
          "questao_id", "ordem_original", "conteudo_latex", "url_imagem", "correta"
        )
        VALUES ($1, $2, $3, $4, $5)
      `,
      [
        questaoId,
        alternativa.ordemOriginal,
        alternativa.conteudoLatex,
        alternativa.urlImagem ?? null,
        alternativa.correta,
      ],
    );
  }
};

let questaoSchemaEnsured = false;

/**
 * Repositório do banco de questões com suporte a transação.
 *
 * A criação/atualização é atômica: opera em questao, enunciado e
 * alternativa na mesma transação. A exclusão lógica (desativação)
 * ocorre quando a questão já está vinculada a uma prova.
 */
export class QuestaoRepository {
  private async ensureSchema() {
    if (questaoSchemaEnsured) return;
    await pool.query('ALTER TABLE "questao" ADD COLUMN IF NOT EXISTS "dificuldade" TEXT NULL');
    questaoSchemaEnsured = true;
  }

  /**
   * Verifica se uma matéria existe pelo ID.
   *
   * @param materiaId - ID da matéria.
   * @returns true se a matéria existir.
   */
  async materiaExists(materiaId: string) {
    await this.ensureSchema();
    const result = await pool.query('SELECT EXISTS (SELECT 1 FROM "materia" WHERE "id" = $1) AS "exists"', [
      materiaId,
    ]);
    return result.rows[0]?.exists ?? false;
  }

  /**
   * Verifica se um tema pertence a uma matéria específica.
   *
   * @param temaId - ID do tema.
   * @param materiaId - ID da matéria.
   * @returns true se o tema pertencer à matéria.
   */
  async temaBelongsToMateria(temaId: string, materiaId: string) {
    await this.ensureSchema();
    const result = await pool.query(
      'SELECT EXISTS (SELECT 1 FROM "tema" WHERE "id" = $1 AND "materia_id" = $2) AS "exists"',
      [temaId, materiaId],
    );
    return result.rows[0]?.exists ?? false;
  }

  /**
   * Verifica se o professor possui vínculo com a matéria.
   *
   * @param professorId - ID do professor.
   * @param materiaId - ID da matéria.
   * @returns true se houver vínculo.
   */
  async professorMateriaVinculados(professorId: string, materiaId: string) {
    await this.ensureSchema();
    const result = await pool.query(
      'SELECT EXISTS (SELECT 1 FROM "materia_professor" WHERE "professor_id" = $1 AND "materia_id" = $2) AS "exists"',
      [professorId, materiaId],
    );
    return result.rows[0]?.exists ?? false;
  }

  /**
   * Cria uma nova questão com enunciado e alternativas em transação.
   *
   * @param input - Dados completos da questão conforme CreateQuestaoInput.
   * @returns A questão recém-criada com todos os relacionamentos.
   */
  async create(input: CreateQuestaoInput) {
    await this.ensureSchema();
    return withTransaction(async (client) => {
      const questao = await client.query<{ id: string }>(
        `
          INSERT INTO "questao" (
            "materia_id", "tema_id", "tipo", "limite_caracteres", "limite_palavras",
            "permite_anexo", "pontuacao_padrao", "ativa", "dificuldade"
          )
          VALUES ($1, $2, $3, $4, $5, COALESCE($6, FALSE), COALESCE($7, 1), COALESCE($8, TRUE), COALESCE($9, 'Media'))
          RETURNING "id"
        `,
        [
          input.materiaId,
          input.temaId ?? null,
          input.tipo,
          input.limiteCaracteres ?? null,
          input.limitePalavras ?? null,
          input.permiteAnexo ?? null,
          input.pontuacaoPadrao ?? null,
          input.ativa ?? null,
          input.dificuldade ?? null,
        ],
      );

      const questaoId = questao.rows[0].id;
      await client.query(
        'INSERT INTO "enunciado" ("questao_id", "conteudo_latex", "url_imagem") VALUES ($1, $2, $3)',
        [questaoId, input.enunciado.conteudoLatex, input.enunciado.urlImagem ?? null],
      );

      await insertAlternativas(client, questaoId, input.alternativas ?? []);
      return this.findById(questaoId, client);
    });
  }

  /**
   * Lista questões com filtros dinâmicos e paginação.
   *
   * @param query - Filtros: materiaId, temaId, tipo, ativa, busca (ILIKE no enunciado).
   * @param user - Usuário autenticado para filtro de autorização.
   * @returns Lista paginada de questões com total de registros.
   */
  async findMany(query: ListQuestoesQuery, user: AuthUser) {
    await this.ensureSchema();
    const params: unknown[] = [];
    const where: string[] = [];

    const addParam = (value: unknown) => {
      params.push(value);
      return `$${params.length}`;
    };

    if (user.perfil === "professor") {
      where.push(
        `EXISTS (
          SELECT 1 FROM "materia_professor" mp
          WHERE mp."materia_id" = q."materia_id" AND mp."professor_id" = ${addParam(user.id)}
        )`,
      );
    }

    if (query.materiaId) where.push(`q."materia_id" = ${addParam(query.materiaId)}`);
    if (query.temaId) where.push(`q."tema_id" = ${addParam(query.temaId)}`);
    if (query.tipo) where.push(`q."tipo" = ${addParam(query.tipo)}`);
    if (query.ativa !== undefined) where.push(`q."ativa" = ${addParam(query.ativa)}`);
    if (query.ativa === undefined) where.push('q."ativa" = TRUE');
    if (query.busca) where.push(`e."conteudo_latex" ILIKE ${addParam(`%${query.busca}%`)}`);

    const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
    const limitParam = addParam(query.limit);
    const offsetParam = addParam((query.page - 1) * query.limit);

    const result = await pool.query<QuestaoRow>(
      `
        ${selectQuestaoSql}
        ${whereSql}
        GROUP BY q."id", e."conteudo_latex", e."url_imagem"
        ORDER BY q."criado_em" DESC
        LIMIT ${limitParam}
        OFFSET ${offsetParam}
      `,
      params,
    );

    const countParams = params.slice(0, params.length - 2);
    const count = await pool.query<{ total: string }>(
      `
        SELECT COUNT(DISTINCT q."id") AS "total"
        FROM "questao" q
        JOIN "enunciado" e ON e."questao_id" = q."id"
        ${whereSql}
      `,
      countParams,
    );

    return {
      data: result.rows.map(mapQuestao),
      total: Number(count.rows[0]?.total ?? 0),
    };
  }

  /**
   * Busca questão por ID com enunciado e alternativas.
   *
   * @param questaoId - ID da questão.
   * @param client - Conexão opcional (para uso dentro de transação).
   * @returns Questão encontrada ou null.
   */
  async findById(questaoId: string, client: PoolClient | typeof pool = pool) {
    await this.ensureSchema();
    const result = await client.query<QuestaoRow>(
      `
        ${selectQuestaoSql}
        WHERE q."id" = $1
        GROUP BY q."id", e."conteudo_latex", e."url_imagem"
      `,
      [questaoId],
    );

    return result.rows[0] ? mapQuestao(result.rows[0]) : null;
  }

  /**
   * Atualiza uma questão, seu enunciado e alternativas em transação.
   *
   * @param questaoId - ID da questão.
   * @param input - Dados para atualização conforme UpdateQuestaoInput.
   * @returns Questão atualizada com todos os relacionamentos.
   */
  async update(questaoId: string, input: UpdateQuestaoInput) {
    await this.ensureSchema();
    return withTransaction(async (client) => {
      await client.query(
        `
          UPDATE "questao"
          SET
            "materia_id" = $1,
            "tema_id" = $2,
            "tipo" = $3,
            "limite_caracteres" = $4,
            "limite_palavras" = $5,
            "permite_anexo" = COALESCE($6, FALSE),
            "pontuacao_padrao" = COALESCE($7, 1),
            "ativa" = COALESCE($8, TRUE),
            "dificuldade" = COALESCE($9, "dificuldade", 'Media')
          WHERE "id" = $10
        `,
        [
          input.materiaId,
          input.temaId ?? null,
          input.tipo,
          input.limiteCaracteres ?? null,
          input.limitePalavras ?? null,
          input.permiteAnexo ?? null,
          input.pontuacaoPadrao ?? null,
          input.ativa ?? null,
          input.dificuldade ?? null,
          questaoId,
        ],
      );

      if (input.enunciado) {
        await client.query(
          `
            INSERT INTO "enunciado" ("questao_id", "conteudo_latex", "url_imagem")
            VALUES ($1, $2, $3)
            ON CONFLICT ("questao_id") DO UPDATE
            SET "conteudo_latex" = EXCLUDED."conteudo_latex",
                "url_imagem" = EXCLUDED."url_imagem"
          `,
          [questaoId, input.enunciado.conteudoLatex, input.enunciado.urlImagem ?? null],
        );
      }

      if (input.alternativas) {
        await client.query('DELETE FROM "alternativa" WHERE "questao_id" = $1', [questaoId]);
        await insertAlternativas(client, questaoId, input.alternativas);
      }
      return this.findById(questaoId, client);
    });
  }

  /**
   * Remove ou desativa uma questão.
   * Se vinculada a alguma prova, desativa (soft delete);
   * caso contrário, exclui fisicamente.
   *
   * @param questaoId - ID da questão.
   * @returns "deleted" se removida, "deactivated" se desativada.
   */
  async deleteOrDeactivate(questaoId: string) {
    await this.ensureSchema();
    const linked = await pool.query(
      'SELECT EXISTS (SELECT 1 FROM "prova_questao" WHERE "questao_id" = $1) AS "exists"',
      [questaoId],
    );

    if (linked.rows[0]?.exists) {
      await pool.query('UPDATE "questao" SET "ativa" = FALSE WHERE "id" = $1', [questaoId]);
      return "deactivated";
    }

    await pool.query('DELETE FROM "questao" WHERE "id" = $1', [questaoId]);
    return "deleted";
  }
}
