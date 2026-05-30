import { pool } from "../database/pool.js";

type MateriaRow = {
  id: string;
  nome: string;
  codigo: string | null;
  descricao: string | null;
  criado_em: Date;
  atualizado_em: Date;
};

const mapMateria = (row: MateriaRow) => ({
  id: row.id,
  nome: row.nome,
  codigo: row.codigo,
  descricao: row.descricao,
  criadoEm: row.criado_em.toISOString(),
  atualizadoEm: row.atualizado_em.toISOString(),
});

export class MateriaRepository {
  async create(input: { nome: string; codigo?: string | null; descricao?: string | null }) {
    const result = await pool.query<MateriaRow>(
      `INSERT INTO "materia" ("nome", "codigo", "descricao")
       VALUES ($1, $2, $3) RETURNING *`,
      [input.nome, input.codigo ?? null, input.descricao ?? null],
    );
    return mapMateria(result.rows[0]);
  }

  async findAll(options?: { page?: number; limit?: number }) {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const offset = (page - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*) AS "count" FROM "materia"');
    const total = parseInt(countResult.rows[0].count, 10);
    const result = await pool.query<MateriaRow>(
      'SELECT * FROM "materia" ORDER BY "nome" ASC LIMIT $1 OFFSET $2',
      [limit, offset],
    );
    return { data: result.rows.map(mapMateria), total };
  }

  async findByName(nome: string) {
    const result = await pool.query<MateriaRow>(
      'SELECT * FROM "materia" WHERE LOWER("nome") = LOWER($1)',
      [nome],
    );
    return result.rows[0] ? mapMateria(result.rows[0]) : null;
  }

  async findById(id: string) {
    const result = await pool.query<MateriaRow>(
      'SELECT * FROM "materia" WHERE "id" = $1',
      [id],
    );
    return result.rows[0] ? mapMateria(result.rows[0]) : null;
  }

  async update(
    id: string,
    input: { nome?: string; codigo?: string | null; descricao?: string | null },
  ) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    if (input.nome !== undefined) {
      fields.push(`"nome" = $${index++}`);
      values.push(input.nome);
    }
    if (input.codigo !== undefined) {
      fields.push(`"codigo" = $${index++}`);
      values.push(input.codigo);
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

    const result = await pool.query<MateriaRow>(
      `UPDATE "materia" SET ${fields.join(", ")} WHERE "id" = $${index} RETURNING *`,
      values,
    );
    return result.rows[0] ? mapMateria(result.rows[0]) : null;
  }

  async delete(id: string) {
    const result = await pool.query(
      'DELETE FROM "materia" WHERE "id" = $1',
      [id],
    );
    return result.rowCount ?? 0 > 0;
  }
}
