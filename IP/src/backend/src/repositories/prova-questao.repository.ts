import { pool } from "../database/pool.js";
import { toIsoString } from "../helpers/date.js";
import type { AuthUser } from "../middlewares/auth.js";
import type { AddQuestaoProvaInput } from "../schemas/prova-questao.schema.js";

type ProvaResumoRow = {
  id: string;
  materia_id: string;
  status: string;
};

type QuestaoResumoRow = {
  id: string;
  materia_id: string;
  tem_enunciado: boolean;
};

type ProvaQuestaoRow = {
  prova_id: string;
  questao_id: string;
  ordem_original: number;
  pontuacao_max: string | number;
  criado_em: Date | string;
  questao_tipo?: string;
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
      }
    : undefined,
});

const selectProvaQuestaoSql = `
  SELECT
    pq."prova_id",
    pq."questao_id",
    pq."ordem_original",
    pq."pontuacao_max",
    pq."criado_em",
    q."tipo" AS "questao_tipo",
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

export class ProvaQuestaoRepository {
  async findProva(provaId: string) {
    const result = await pool.query<ProvaResumoRow>(
      'SELECT "id", "materia_id", "status" FROM "prova" WHERE "id" = $1',
      [provaId],
    );
    return result.rows[0] ?? null;
  }

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

  async findQuestao(questaoId: string) {
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

  async hasOrdem(provaId: string, ordemOriginal: number) {
    const result = await pool.query(
      'SELECT EXISTS (SELECT 1 FROM "prova_questao" WHERE "prova_id" = $1 AND "ordem_original" = $2) AS "exists"',
      [provaId, ordemOriginal],
    );
    return result.rows[0]?.exists ?? false;
  }

  async hasQuestao(provaId: string, questaoId: string) {
    const result = await pool.query(
      'SELECT EXISTS (SELECT 1 FROM "prova_questao" WHERE "prova_id" = $1 AND "questao_id" = $2) AS "exists"',
      [provaId, questaoId],
    );
    return result.rows[0]?.exists ?? false;
  }

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

  async findByProva(provaId: string) {
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

  async delete(provaId: string, questaoId: string) {
    await pool.query('DELETE FROM "prova_questao" WHERE "prova_id" = $1 AND "questao_id" = $2', [
      provaId,
      questaoId,
    ]);
  }
}
