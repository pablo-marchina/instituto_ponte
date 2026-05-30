import { pool } from "../database/pool.js";

type ProfessorRow = {
  id: string;
  coordenador_id: string;
  nome: string;
  email: string;
  criado_em: Date;
  atualizado_em: Date;
};

const mapProfessor = (row: ProfessorRow) => ({
  id: row.id,
  coordenadorId: row.coordenador_id,
  nome: row.nome,
  email: row.email,
  criadoEm: row.criado_em.toISOString(),
  atualizadoEm: row.atualizado_em.toISOString(),
});

export class ProfessorRepository {
  async coordenadorExists(coordenadorId: string) {
    const result = await pool.query(
      'SELECT EXISTS (SELECT 1 FROM "coordenador" WHERE "id" = $1) AS "exists"',
      [coordenadorId],
    );
    return result.rows[0].exists as boolean;
  }

  async findByEmail(email: string) {
    const result = await pool.query<ProfessorRow>(
      'SELECT * FROM "professor" WHERE "email" = $1',
      [email],
    );
    return result.rows[0] ? mapProfessor(result.rows[0]) : null;
  }

  async create(input: { nome: string; email: string; coordenadorId: string }) {
    const result = await pool.query<ProfessorRow>(
      `INSERT INTO "professor" ("nome", "email", "coordenador_id")
       VALUES ($1, $2, $3) RETURNING *`,
      [input.nome, input.email, input.coordenadorId],
    );
    return mapProfessor(result.rows[0]);
  }

  async findAll(options?: { page?: number; limit?: number }) {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const offset = (page - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*) AS "count" FROM "professor"');
    const total = parseInt(countResult.rows[0].count, 10);
    const result = await pool.query<ProfessorRow>(
      'SELECT * FROM "professor" ORDER BY "nome" ASC LIMIT $1 OFFSET $2',
      [limit, offset],
    );
    return { data: result.rows.map(mapProfessor), total };
  }

  async findById(id: string) {
    const result = await pool.query<ProfessorRow>(
      'SELECT * FROM "professor" WHERE "id" = $1',
      [id],
    );
    return result.rows[0] ? mapProfessor(result.rows[0]) : null;
  }

  async update(id: string, input: { nome?: string; email?: string; coordenadorId?: string }) {
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
    if (input.coordenadorId !== undefined) {
      fields.push(`"coordenador_id" = $${index++}`);
      values.push(input.coordenadorId);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`"atualizado_em" = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query<ProfessorRow>(
      `UPDATE "professor" SET ${fields.join(", ")} WHERE "id" = $${index} RETURNING *`,
      values,
    );
    return result.rows[0] ? mapProfessor(result.rows[0]) : null;
  }

  async delete(id: string) {
    const result = await pool.query('DELETE FROM "professor" WHERE "id" = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async criarVinculo(professorId: string, materiaId: string) {
    const result = await pool.query<{ materia_id: string; professor_id: string }>(
      `INSERT INTO "materia_professor" ("materia_id", "professor_id")
       VALUES ($1, $2) RETURNING *`,
      [materiaId, professorId],
    );
    return { materiaId: result.rows[0].materia_id, professorId: result.rows[0].professor_id };
  }

  async vinculoExists(professorId: string, materiaId: string) {
    const result = await pool.query(
      'SELECT EXISTS (SELECT 1 FROM "materia_professor" WHERE "professor_id" = $1 AND "materia_id" = $2) AS "exists"',
      [professorId, materiaId],
    );
    return result.rows[0].exists as boolean;
  }

  async materiaExists(materiaId: string) {
    const result = await pool.query(
      'SELECT EXISTS (SELECT 1 FROM "materia" WHERE "id" = $1) AS "exists"',
      [materiaId],
    );
    return result.rows[0].exists as boolean;
  }

  async removerVinculo(professorId: string, materiaId: string) {
    const result = await pool.query(
      'DELETE FROM "materia_professor" WHERE "professor_id" = $1 AND "materia_id" = $2',
      [professorId, materiaId],
    );
    return (result.rowCount ?? 0) > 0;
  }
}
