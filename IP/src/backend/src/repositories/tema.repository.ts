import { pool } from "../database/pool.js";

type TemaRow = {
  id: string;
  materia_id: string;
  nome: string;
  descricao: string | null;
  criado_em: Date;
  atualizado_em: Date;
};

const mapTema = (row: TemaRow) => ({
  id: row.id,
  materiaId: row.materia_id,
  nome: row.nome,
  descricao: row.descricao,
  criadoEm: row.criado_em.toISOString(),
  atualizadoEm: row.atualizado_em.toISOString(),
});

export class TemaRepository {
  async materiaExists(materiaId: string) {
    const result = await pool.query(
      'SELECT EXISTS (SELECT 1 FROM "materia" WHERE "id" = $1) AS "exists"',
      [materiaId],
    );
    return result.rows[0].exists as boolean;
  }

  async create(input: { materiaId: string; nome: string; descricao?: string | null }) {
    const result = await pool.query<TemaRow>(
      `INSERT INTO "tema" ("materia_id", "nome", "descricao")
       VALUES ($1, $2, $3) RETURNING *`,
      [input.materiaId, input.nome, input.descricao ?? null],
    );
    return mapTema(result.rows[0]);
  }

  async findAll(options?: { materiaId?: string; page?: number; limit?: number }) {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const offset = (page - 1) * limit;

    if (options?.materiaId) {
      const countResult = await pool.query(
        'SELECT COUNT(*) AS "count" FROM "tema" WHERE "materia_id" = $1',
        [options.materiaId],
      );
      const total = parseInt(countResult.rows[0].count, 10);
      const result = await pool.query<TemaRow>(
        'SELECT * FROM "tema" WHERE "materia_id" = $1 ORDER BY "nome" ASC LIMIT $2 OFFSET $3',
        [options.materiaId, limit, offset],
      );
      return { data: result.rows.map(mapTema), total };
    }

    const countResult = await pool.query('SELECT COUNT(*) AS "count" FROM "tema"');
    const total = parseInt(countResult.rows[0].count, 10);
    const result = await pool.query<TemaRow>(
      'SELECT * FROM "tema" ORDER BY "nome" ASC LIMIT $1 OFFSET $2',
      [limit, offset],
    );
    return { data: result.rows.map(mapTema), total };
  }

  async findById(id: string) {
    const result = await pool.query<TemaRow>(
      'SELECT * FROM "tema" WHERE "id" = $1',
      [id],
    );
    return result.rows[0] ? mapTema(result.rows[0]) : null;
  }

  async update(id: string, input: { nome?: string; descricao?: string | null }) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    if (input.nome !== undefined) {
      fields.push(`"nome" = $${index++}`);
      values.push(input.nome);
    }
    if (input.descricao !== undefined) {
      fields.push(`"descricao" = $${index++}`);
      values.push(input.descricao);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`"atualizado_em" = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query<TemaRow>(
      `UPDATE "tema" SET ${fields.join(", ")} WHERE "id" = $${index} RETURNING *`,
      values,
    );
    return result.rows[0] ? mapTema(result.rows[0]) : null;
  }

  async delete(id: string) {
    const result = await pool.query('DELETE FROM "tema" WHERE "id" = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async findByNameAndMateria(nome: string, materiaId: string, excludeId?: string) {
    const result = await pool.query<TemaRow>(
      `SELECT * FROM "tema" WHERE LOWER("nome") = LOWER($1) AND "materia_id" = $2`,
      [nome, materiaId],
    );
    return result.rows[0] ? mapTema(result.rows[0]) : null;
  }
}
