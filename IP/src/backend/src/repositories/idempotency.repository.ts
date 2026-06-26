import { pool } from "../database/pool.js";

export type IdempotencyRecord = {
  requestHash: string;
  state: "processing" | "completed";
  responseStatus: number | null;
  responseBody: unknown;
  owned: boolean;
};

export class IdempotencyRepository {
  async acquire(key: string, method: string, route: string, requestHash: string): Promise<IdempotencyRecord> {
    const inserted = await pool.query(
      `INSERT INTO "idempotency_request" ("key", "method", "route", "request_hash")
       VALUES ($1, $2, $3, $4)
       ON CONFLICT ("key", "method", "route") DO NOTHING
       RETURNING "request_hash", "state", "response_status", "response_body"`,
      [key, method, route, requestHash],
    );

    if (inserted.rows[0]) {
      return {
        requestHash: inserted.rows[0].request_hash,
        state: inserted.rows[0].state,
        responseStatus: inserted.rows[0].response_status,
        responseBody: inserted.rows[0].response_body,
        owned: true,
      };
    }

    const existing = await pool.query(
      `SELECT "request_hash", "state", "response_status", "response_body"
       FROM "idempotency_request"
       WHERE "key" = $1 AND "method" = $2 AND "route" = $3 AND "expires_at" > CURRENT_TIMESTAMP`,
      [key, method, route],
    );

    const row = existing.rows[0];
    if (!row) {
      await pool.query(
        `DELETE FROM "idempotency_request"
         WHERE "key" = $1 AND "method" = $2 AND "route" = $3`,
        [key, method, route],
      );
      return this.acquire(key, method, route, requestHash);
    }

    return {
      requestHash: row.request_hash,
      state: row.state,
      responseStatus: row.response_status,
      responseBody: row.response_body,
      owned: false,
    };
  }

  async complete(key: string, method: string, route: string, status: number, body: unknown) {
    await pool.query(
      `UPDATE "idempotency_request"
       SET "state" = 'completed', "response_status" = $4, "response_body" = $5::jsonb
       WHERE "key" = $1 AND "method" = $2 AND "route" = $3`,
      [key, method, route, status, JSON.stringify(body)],
    );
  }

  async release(key: string, method: string, route: string) {
    await pool.query(
      `DELETE FROM "idempotency_request"
       WHERE "key" = $1 AND "method" = $2 AND "route" = $3 AND "state" = 'processing'`,
      [key, method, route],
    );
  }
}
