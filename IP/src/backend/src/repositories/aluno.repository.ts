import { pool } from "../database/pool.js";

type AlunoRow = {
  id: string;
  nome: string;
  email: string;
  cpf: string | null;
  aceitou_termos_em: Date | null;
  criado_em: Date;
  atualizado_em: Date;
};

const mapAluno = (row: AlunoRow) => ({
  id: row.id,
  nome: row.nome,
  email: row.email,
  cpf: row.cpf,
  aceitouTermosEm: row.aceitou_termos_em?.toISOString() ?? null,
  criadoEm: row.criado_em.toISOString(),
  atualizadoEm: row.atualizado_em.toISOString(),
});

export class AlunoRepository {
  async findAll(options?: { page?: number; limit?: number }) {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const offset = (page - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*) AS "count" FROM "aluno"');
    const total = parseInt(countResult.rows[0].count, 10);
    const result = await pool.query<AlunoRow>(
      'SELECT * FROM "aluno" ORDER BY "nome" ASC LIMIT $1 OFFSET $2',
      [limit, offset],
    );
    return { data: result.rows.map(mapAluno), total };
  }

  async findById(id: string) {
    const result = await pool.query<AlunoRow>(
      'SELECT * FROM "aluno" WHERE "id" = $1',
      [id],
    );
    return result.rows[0] ? mapAluno(result.rows[0]) : null;
  }

  async findByEmail(email: string) {
    const result = await pool.query<AlunoRow>(
      'SELECT * FROM "aluno" WHERE "email" = $1',
      [email],
    );
    return result.rows[0] ? mapAluno(result.rows[0]) : null;
  }

  async findByCpf(cpf: string) {
    const result = await pool.query<AlunoRow>(
      'SELECT * FROM "aluno" WHERE "cpf" = $1',
      [cpf],
    );
    return result.rows[0] ? mapAluno(result.rows[0]) : null;
  }

  async update(
    id: string,
    input: { nome?: string; email?: string; cpf?: string | null },
  ) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    if (input.nome !== undefined) {
      fields.push(`"nome" = $${index++}`);
      values.push(input.nome);
    }
    if (input.email !== undefined) {
      fields.push(`"email" = $${index++}`);
      values.push(input.email);
    }
    if (input.cpf !== undefined) {
      fields.push(`"cpf" = $${index++}`);
      values.push(input.cpf);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push('"atualizado_em" = CURRENT_TIMESTAMP');
    values.push(id);

    const result = await pool.query<AlunoRow>(
      `UPDATE "aluno" SET ${fields.join(", ")} WHERE "id" = $${index} RETURNING *`,
      values,
    );
    return result.rows[0] ? mapAluno(result.rows[0]) : null;
  }

  async delete(id: string) {
    const result = await pool.query(
      'DELETE FROM "aluno" WHERE "id" = $1',
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  }
}
