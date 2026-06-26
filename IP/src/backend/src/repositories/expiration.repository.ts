import type { PoolClient } from "pg";
import { withTransaction } from "../database/transaction.js";

export type ExpirationSweepResult = {
  submittedAttempts: number;
  closedExams: number;
};

export class ExpirationRepository {
  async sweep(): Promise<ExpirationSweepResult> {
    return withTransaction(async (client) => {
      await client.query("SET LOCAL app.system_expiration = 'true'");
      const attemptIds = await this.findExpiredAttemptIds(client);

      if (attemptIds.length > 0) {
        await client.query(
          `UPDATE "resposta_aluno"
           SET "rascunho" = FALSE, "enviada_final" = TRUE,
               "sincronizada_em" = CURRENT_TIMESTAMP, "atualizado_em" = CURRENT_TIMESTAMP
           WHERE "prova_aluno_id" = ANY($1::uuid[])`,
          [attemptIds],
        );
        await client.query(
          `UPDATE "prova_aluno"
           SET "status" = 'enviada'
           WHERE "id" = ANY($1::uuid[]) AND "status" = 'em_andamento'`,
          [attemptIds],
        );
        await client.query(
          `INSERT INTO "avaliacao_log" ("prova_id", "prova_aluno_id", "ator_tipo", "acao", "detalhes")
           SELECT pa."prova_id", pa."id", 'sistema', 'prova_expirada', '{"automatico":true}'::jsonb
           FROM "prova_aluno" pa WHERE pa."id" = ANY($1::uuid[])`,
          [attemptIds],
        );
      }

      const closed = await client.query(
        `UPDATE "prova"
         SET "status" = 'encerrada'
         WHERE "status" = 'publicada' AND "data_fim" <= CURRENT_TIMESTAMP
         RETURNING "id"`,
      );

      return { submittedAttempts: attemptIds.length, closedExams: closed.rowCount ?? 0 };
    });
  }

  private async findExpiredAttemptIds(client: PoolClient): Promise<string[]> {
    const result = await client.query<{ id: string }>(
      `SELECT pa."id"
       FROM "prova_aluno" pa
       JOIN "prova" p ON p."id" = pa."prova_id"
       WHERE pa."status" = 'em_andamento'
         AND pa."inicio_em" IS NOT NULL
         AND LEAST(
           p."data_fim",
           CASE WHEN p."tempo_limite_min" IS NULL
             THEN p."data_fim"
             ELSE pa."inicio_em" + make_interval(mins => p."tempo_limite_min")
           END
         ) <= CURRENT_TIMESTAMP
       FOR UPDATE OF pa SKIP LOCKED`,
    );
    return result.rows.map((row) => row.id);
  }
}
