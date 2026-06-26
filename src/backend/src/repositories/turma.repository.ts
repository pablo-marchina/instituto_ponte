import { pool } from "../database/pool.js";
import type { Turma } from "../models/turma.model.js";
import type { TurmaInput } from "../schemas/turma.schema.js";

type TurmaRow = {
  id: string;
  nome: string;
  descricao: string | null;
  criado_em: Date | string;
  atualizado_em: Date | string;
};

const toIso = (value: Date | string) => (value instanceof Date ? value.toISOString() : new Date(value).toISOString());

const mapTurma = (row: TurmaRow): Turma => ({
  id: row.id,
  nome: row.nome,
  descricao: row.descricao,
  criadoEm: toIso(row.criado_em),
  atualizadoEm: toIso(row.atualizado_em),
});

let schemaReady = false;

export class TurmaRepository {
  private async ensureSchema() {
    if (schemaReady) return;

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "turma" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "nome" TEXT NOT NULL,
        "descricao" TEXT NULL,
        "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "turma_nome_check" CHECK (char_length(btrim("nome")) > 0),
        CONSTRAINT "turma_nome_unique" UNIQUE ("nome")
      )
    `);

    await pool.query('ALTER TABLE "aluno" ADD COLUMN IF NOT EXISTS "turma" TEXT NULL');

    await pool.query(`
      INSERT INTO "turma" ("nome")
      SELECT DISTINCT btrim("turma")
      FROM "prova"
      WHERE "turma" IS NOT NULL
        AND char_length(btrim("turma")) > 0
      ON CONFLICT ("nome") DO NOTHING
    `);

    await pool.query(`
      INSERT INTO "turma" ("nome")
      SELECT DISTINCT btrim("turma")
      FROM "aluno"
      WHERE "turma" IS NOT NULL
        AND char_length(btrim("turma")) > 0
      ON CONFLICT ("nome") DO NOTHING
    `);

    schemaReady = true;
  }

  async findAll() {
    await this.ensureSchema();
    const result = await pool.query<TurmaRow>('SELECT * FROM "turma" ORDER BY "nome" ASC');
    return result.rows.map(mapTurma);
  }

  async findById(id: string) {
    await this.ensureSchema();
    const result = await pool.query<TurmaRow>('SELECT * FROM "turma" WHERE "id" = $1', [id]);
    return result.rows[0] ? mapTurma(result.rows[0]) : null;
  }

  async findByNome(nome: string) {
    await this.ensureSchema();
    const result = await pool.query<TurmaRow>('SELECT * FROM "turma" WHERE lower("nome") = lower($1) LIMIT 1', [nome]);
    return result.rows[0] ? mapTurma(result.rows[0]) : null;
  }

  async create(input: TurmaInput) {
    await this.ensureSchema();
    const result = await pool.query<TurmaRow>(
      `
        INSERT INTO "turma" ("nome", "descricao")
        VALUES ($1, $2)
        RETURNING *
      `,
      [input.nome, input.descricao ?? null],
    );
    return mapTurma(result.rows[0]);
  }

  async update(id: string, input: TurmaInput) {
    await this.ensureSchema();
    const result = await pool.query<TurmaRow>(
      `
        UPDATE "turma"
        SET "nome" = $1,
            "descricao" = $2,
            "atualizado_em" = CURRENT_TIMESTAMP
        WHERE "id" = $3
        RETURNING *
      `,
      [input.nome, input.descricao ?? null, id],
    );
    return result.rows[0] ? mapTurma(result.rows[0]) : null;
  }

  async delete(id: string) {
    await this.ensureSchema();
    const result = await pool.query('DELETE FROM "turma" WHERE "id" = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
