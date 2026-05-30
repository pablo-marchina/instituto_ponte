import type { PoolClient } from "pg";
import { pool } from "../database/pool.js";
import { withTransaction } from "../database/transaction.js";
import { toIsoString } from "../helpers/date.js";
import type { IniciarProvaInput } from "../schemas/aluno-portal.schema.js";

type ProvaPublicaRow = {
  id: string;
  titulo: string;
  instrucoes: string | null;
  tempo_limite_min: number | null;
  data_inicio: Date | string | null;
  data_fim: Date | string | null;
  status: string;
};

type ProvaAlunoRow = {
  id: string;
  status: "nao_iniciada" | "em_andamento" | "enviada" | "corrigida";
};

type AlternativaPublica = {
  id: string;
  ordem: number;
  conteudoLatex: string;
  urlImagem: string | null;
};

type QuestaoPublicaRow = {
  id: string;
  ordem: number;
  tipo: "multipla_escolha" | "verdadeiro_falso" | "discursiva";
  enunciado_conteudo_latex: string;
  enunciado_url_imagem: string | null;
  alternativas: AlternativaPublica[] | null;
};

const normalizeUrlAcesso = (urlAcesso: string) => {
  const decoded = decodeURIComponent(urlAcesso.trim());
  const slug = decoded.split("/").filter(Boolean).at(-1) ?? decoded;
  return { original: decoded, slug };
};

const mapProvaPublica = (row: ProvaPublicaRow) => ({
  id: row.id,
  titulo: row.titulo,
  instrucoes: row.instrucoes,
  tempoLimiteMin: row.tempo_limite_min,
  dataInicio: toIsoString(row.data_inicio),
  dataFim: toIsoString(row.data_fim),
  status: row.status,
});

const mapQuestaoPublica = (row: QuestaoPublicaRow) => ({
  id: row.id,
  ordem: row.ordem,
  tipo: row.tipo,
  enunciado: {
    conteudoLatex: row.enunciado_conteudo_latex,
    urlImagem: row.enunciado_url_imagem,
  },
  alternativas: row.alternativas ?? [],
});

export class AlunoPortalRepository {
  async findPublicByUrl(urlAcesso: string) {
    const normalized = normalizeUrlAcesso(urlAcesso);
    const result = await pool.query<ProvaPublicaRow>(
      `
        SELECT "id", "titulo", "instrucoes", "tempo_limite_min", "data_inicio", "data_fim", "status"
        FROM "prova"
        WHERE "url_acesso" = $1
          OR "url_acesso" = $2
          OR regexp_replace("url_acesso", '^.*/', '') = $2
      `,
      [normalized.original, normalized.slug],
    );

    return result.rows[0] ? mapProvaPublica(result.rows[0]) : null;
  }

  async findQuestoesPublicas(provaId: string, client: PoolClient | typeof pool = pool) {
    const result = await client.query<QuestaoPublicaRow>(
      `
        SELECT
          q."id",
          pq."ordem_original" AS "ordem",
          q."tipo",
          e."conteudo_latex" AS "enunciado_conteudo_latex",
          e."url_imagem" AS "enunciado_url_imagem",
          COALESCE(
            json_agg(
              json_build_object(
                'id', a."id",
                'ordem', a."ordem_original",
                'conteudoLatex', a."conteudo_latex",
                'urlImagem', a."url_imagem"
              )
              ORDER BY a."ordem_original"
            ) FILTER (WHERE a."id" IS NOT NULL),
            '[]'::json
          ) AS "alternativas"
        FROM "prova_questao" pq
        JOIN "questao" q ON q."id" = pq."questao_id"
        JOIN "enunciado" e ON e."questao_id" = q."id"
        LEFT JOIN "alternativa" a ON a."questao_id" = q."id"
        WHERE pq."prova_id" = $1
        GROUP BY q."id", pq."ordem_original", e."conteudo_latex", e."url_imagem"
        ORDER BY pq."ordem_original" ASC
      `,
      [provaId],
    );

    return result.rows.map(mapQuestaoPublica);
  }

  async iniciarProva(provaId: string, input: IniciarProvaInput) {
    return withTransaction(async (client) => {
      const alunoId = await this.upsertAluno(client, input);
      const provaAluno = await this.findProvaAluno(client, provaId, alunoId);

      if (provaAluno?.status === "enviada" || provaAluno?.status === "corrigida") {
        return {
          provaAluno,
          finalizada: true,
        };
      }

      if (provaAluno?.status === "em_andamento") {
        return {
          provaAluno,
          finalizada: false,
        };
      }

      const created = await client.query<ProvaAlunoRow>(
        `
          INSERT INTO "prova_aluno" ("prova_id", "aluno_id", "status")
          VALUES ($1, $2, 'em_andamento')
          RETURNING "id", "status"
        `,
        [provaId, alunoId],
      );

      await client.query(
        `
          INSERT INTO "avaliacao_log" ("prova_id", "prova_aluno_id", "ator_tipo", "ator_id", "acao", "detalhes")
          VALUES ($1, $2, 'aluno', $3, 'prova_iniciada', $4::jsonb)
        `,
        [provaId, created.rows[0].id, alunoId, JSON.stringify({ email: input.email })],
      );

      return {
        provaAluno: created.rows[0],
        finalizada: false,
      };
    });
  }

  private async upsertAluno(client: PoolClient, input: IniciarProvaInput) {
    const result = await client.query<{ id: string }>(
      `
        INSERT INTO "aluno" ("nome", "email", "cpf", "aceitou_termos_em")
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT ("cpf") DO UPDATE
        SET "nome" = EXCLUDED."nome",
            "email" = EXCLUDED."email",
            "aceitou_termos_em" = CURRENT_TIMESTAMP
        RETURNING "id"
      `,
      [input.nome, input.email, input.cpf],
    );

    return result.rows[0].id;
  }

  private async findProvaAluno(client: PoolClient, provaId: string, alunoId: string) {
    const result = await client.query<ProvaAlunoRow>(
      'SELECT "id", "status" FROM "prova_aluno" WHERE "prova_id" = $1 AND "aluno_id" = $2',
      [provaId, alunoId],
    );
    return result.rows[0] ?? null;
  }
}
