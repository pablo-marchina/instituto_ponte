import type { PoolClient } from "pg";
import { pool } from "../database/pool.js";
import { withTransaction } from "../database/transaction.js";
import { toIsoString } from "../helpers/date.js";
import type { SalvarRespostaInput } from "../schemas/resposta-aluno.schema.js";

type ProvaAlunoContextRow = {
  id: string;
  prova_id: string;
  status: string;
  prova_status: string;
  data_inicio: Date | string | null;
  data_fim: Date | string | null;
};

type QuestaoRespostaRow = {
  id: string;
  tipo: "multipla_escolha" | "verdadeiro_falso" | "discursiva";
  limite_caracteres: number | null;
};

type RespostaRow = {
  id: string;
  prova_aluno_id: string;
  questao_id: string;
  alternativa_id: string | null;
  resposta_texto: string | null;
  rascunho: boolean;
  sincronizada_em: Date | string;
};

type EnvioRow = {
  id: string;
  status: "enviada";
  enviada_em: Date | string | null;
};

const mapRespostaSalva = (row: RespostaRow) => ({
  id: row.id,
  sincronizadaEm: toIsoString(row.sincronizada_em) ?? "",
  rascunho: row.rascunho,
});

const mapResposta = (row: RespostaRow) => ({
  ...mapRespostaSalva(row),
  provaAlunoId: row.prova_aluno_id,
  questaoId: row.questao_id,
  alternativaId: row.alternativa_id,
  respostaTexto: row.resposta_texto,
});

export class RespostaAlunoRepository {
  async findProvaAlunoContext(provaAlunoId: string, client: PoolClient | typeof pool = pool) {
    const result = await client.query<ProvaAlunoContextRow>(
      `
        SELECT
          pa."id",
          pa."prova_id",
          pa."status",
          p."status" AS "prova_status",
          p."data_inicio",
          p."data_fim"
        FROM "prova_aluno" pa
        JOIN "prova" p ON p."id" = pa."prova_id"
        WHERE pa."id" = $1
      `,
      [provaAlunoId],
    );

    return result.rows[0]
      ? {
          id: result.rows[0].id,
          provaId: result.rows[0].prova_id,
          status: result.rows[0].status,
          provaStatus: result.rows[0].prova_status,
          dataInicio: toIsoString(result.rows[0].data_inicio),
          dataFim: toIsoString(result.rows[0].data_fim),
        }
      : null;
  }

  async findQuestaoDaProva(provaAlunoId: string, questaoId: string) {
    const result = await pool.query<QuestaoRespostaRow>(
      `
        SELECT q."id", q."tipo", q."limite_caracteres"
        FROM "prova_aluno" pa
        JOIN "prova_questao" pq ON pq."prova_id" = pa."prova_id"
        JOIN "questao" q ON q."id" = pq."questao_id"
        WHERE pa."id" = $1 AND q."id" = $2
      `,
      [provaAlunoId, questaoId],
    );

    return result.rows[0]
      ? {
          id: result.rows[0].id,
          tipo: result.rows[0].tipo,
          limiteCaracteres: result.rows[0].limite_caracteres,
        }
      : null;
  }

  async alternativaBelongsToQuestao(alternativaId: string, questaoId: string) {
    const result = await pool.query(
      'SELECT EXISTS (SELECT 1 FROM "alternativa" WHERE "id" = $1 AND "questao_id" = $2) AS "exists"',
      [alternativaId, questaoId],
    );
    return result.rows[0]?.exists ?? false;
  }

  async upsert(provaAlunoId: string, questaoId: string, input: SalvarRespostaInput) {
    const result = await pool.query<RespostaRow>(
      `
        INSERT INTO "resposta_aluno" (
          "prova_aluno_id", "questao_id", "alternativa_id", "resposta_texto", "rascunho", "sincronizada_em"
        )
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        ON CONFLICT ("prova_aluno_id", "questao_id") DO UPDATE
        SET "alternativa_id" = EXCLUDED."alternativa_id",
            "resposta_texto" = EXCLUDED."resposta_texto",
            "rascunho" = EXCLUDED."rascunho",
            "sincronizada_em" = CURRENT_TIMESTAMP
        RETURNING *
      `,
      [provaAlunoId, questaoId, input.alternativaId ?? null, input.respostaTexto ?? null, input.rascunho],
    );

    return mapRespostaSalva(result.rows[0]);
  }

  async findByProvaAluno(provaAlunoId: string) {
    const result = await pool.query<RespostaRow>(
      `
        SELECT *
        FROM "resposta_aluno"
        WHERE "prova_aluno_id" = $1
        ORDER BY "criado_em" ASC
      `,
      [provaAlunoId],
    );

    return result.rows.map(mapResposta);
  }

  async findQuestoesEmBranco(provaAlunoId: string, client: PoolClient | typeof pool = pool) {
    const result = await client.query<{ questao_id: string }>(
      `
        SELECT pq."questao_id"
        FROM "prova_aluno" pa
        JOIN "prova_questao" pq ON pq."prova_id" = pa."prova_id"
        LEFT JOIN "resposta_aluno" ra
          ON ra."prova_aluno_id" = pa."id"
          AND ra."questao_id" = pq."questao_id"
        WHERE pa."id" = $1
          AND ra."id" IS NULL
        ORDER BY pq."ordem_original" ASC
      `,
      [provaAlunoId],
    );

    return result.rows.map((row) => row.questao_id);
  }

  async markAsSubmitted(provaAlunoId: string) {
    return withTransaction(async (client) => {
      const questoesEmBranco = await this.findQuestoesEmBranco(provaAlunoId, client);

      await client.query(
        'UPDATE "resposta_aluno" SET "rascunho" = FALSE, "enviada_final" = TRUE WHERE "prova_aluno_id" = $1',
        [provaAlunoId],
      );

      const result = await client.query<EnvioRow>(
        `
          UPDATE "prova_aluno"
          SET "status" = 'enviada'
          WHERE "id" = $1
          RETURNING "id", "status", "enviada_em"
        `,
        [provaAlunoId],
      );

      return {
        provaAlunoId: result.rows[0].id,
        status: result.rows[0].status,
        enviadaEm: toIsoString(result.rows[0].enviada_em) ?? "",
        questoesEmBranco,
      };
    });
  }
}
