import { pool } from "../database/pool.js";
import { withTransaction } from "../database/transaction.js";
import type { Professor } from "../models/professor.model.js";

/** Linha bruta da tabela `professor`. Campos em snake_case mapeados do PostgreSQL. */
type ProfessorRow = {
  id: string;
  coordenador_id: string;
  nome: string;
  email: string;
  criado_em: Date;
  atualizado_em: Date;
};

type MateriaProfessorRow = {
  id: string;
  nome: string;
  codigo: string | null;
  descricao: string | null;
  criado_em: Date;
  atualizado_em: Date;
};

/** Converte uma ProfessorRow (snake_case) para o modelo Professor (camelCase).
 *  Datas são convertidas com toISOString(). */
const mapProfessor = (row: ProfessorRow): Professor => ({
  id: row.id,
  coordenadorId: row.coordenador_id,
  nome: row.nome,
  email: row.email,
  criadoEm: row.criado_em.toISOString(),
  atualizadoEm: row.atualizado_em.toISOString(),
});

const mapMateriaProfessor = (row: MateriaProfessorRow) => ({
  id: row.id,
  nome: row.nome,
  codigo: row.codigo,
  descricao: row.descricao,
  criadoEm: row.criado_em.toISOString(),
  atualizadoEm: row.atualizado_em.toISOString(),
});

/**
 * Repositório de professores com gerenciamento de vínculo com matérias.
 *
 * O vínculo (tabela `materia_professor`) é uma associação N:N.
 * A criação exige um coordenador responsável (coordenador_id).
 */
export class ProfessorRepository {
  /**
   * Verifica se um coordenador existe pelo ID.
   *
   * @param coordenadorId - ID do coordenador.
   * @returns true se o coordenador existir.
   */
  async coordenadorExists(coordenadorId: string) {
    const result = await pool.query(
      'SELECT EXISTS (SELECT 1 FROM "coordenador" WHERE "id" = $1) AS "exists"',
      [coordenadorId],
    );
    return result.rows[0].exists as boolean;
  }

  /**
   * Busca professor por email.
   *
   * @param email - Email do professor.
   * @returns Professor encontrado ou null.
   */
  async findByEmail(email: string) {
    const result = await pool.query<ProfessorRow>(
      'SELECT * FROM "professor" WHERE "email" = $1',
      [email],
    );
    return result.rows[0] ? mapProfessor(result.rows[0]) : null;
  }

  /**
   * Cria um novo professor vinculado a um coordenador.
   *
   * @param input - Dados do professor: nome, email e coordenadorId.
   * @returns O professor recém-criado.
   */
  async create(input: { nome: string; email: string; coordenadorId: string }) {
    const result = await pool.query<ProfessorRow>(
      `INSERT INTO "professor" ("nome", "email", "coordenador_id")
       VALUES ($1, $2, $3) RETURNING *`,
      [input.nome, input.email, input.coordenadorId],
    );
    return mapProfessor(result.rows[0]);
  }

  /**
   * Lista todos os professores com paginação.
   *
   * @param options - Opções de paginação (page e limit).
   * @returns Lista paginada de professores com total de registros.
   */
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

  /**
   * Busca professor por ID.
   *
   * @param id - ID do professor.
   * @returns Professor encontrado ou null.
   */
  async findById(id: string) {
    const result = await pool.query<ProfessorRow>(
      'SELECT * FROM "professor" WHERE "id" = $1',
      [id],
    );
    return result.rows[0] ? mapProfessor(result.rows[0]) : null;
  }

  /**
   * Atualiza dados de um professor, alterando apenas os campos fornecidos.
   *
   * @param id - ID do professor a ser atualizado.
   * @param input - Campos opcionais: nome, email, coordenadorId.
   * @returns Professor atualizado ou null se não encontrado.
   */
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

  /**
   * Remove um professor pelo ID.
   *
   * @param id - ID do professor a ser removido.
   * @returns true se removido, false se não encontrado.
   */
  async delete(id: string) {
    const usage = await pool.query<{ provas: string }>(
      'SELECT COUNT(*) AS "provas" FROM "prova" WHERE "professor_id" = $1',
      [id],
    );

    if (Number(usage.rows[0]?.provas ?? 0) > 0) {
      return false;
    }

    return withTransaction(async (client) => {
      await client.query('DELETE FROM "materia_professor" WHERE "professor_id" = $1', [id]);
      const result = await client.query('DELETE FROM "professor" WHERE "id" = $1', [id]);
      return (result.rowCount ?? 0) > 0;
    });
  }

  /**
   * Cria vínculo entre professor e matéria (tabela materia_professor).
   *
   * @param professorId - ID do professor.
   * @param materiaId - ID da matéria.
   * @returns Objeto com materiaId e professorId do vínculo criado.
   */
  async criarVinculo(professorId: string, materiaId: string) {
    const result = await pool.query<{ materia_id: string; professor_id: string }>(
      `INSERT INTO "materia_professor" ("materia_id", "professor_id")
       VALUES ($1, $2) RETURNING *`,
      [materiaId, professorId],
    );
    return { materiaId: result.rows[0].materia_id, professorId: result.rows[0].professor_id };
  }

  /**
   * Verifica se existe vínculo entre professor e matéria.
   *
   * @param professorId - ID do professor.
   * @param materiaId - ID da matéria.
   * @returns true se o vínculo existir.
   */
  async vinculoExists(professorId: string, materiaId: string) {
    const result = await pool.query(
      'SELECT EXISTS (SELECT 1 FROM "materia_professor" WHERE "professor_id" = $1 AND "materia_id" = $2) AS "exists"',
      [professorId, materiaId],
    );
    return result.rows[0].exists as boolean;
  }

  /**
   * Verifica se uma matéria existe pelo ID.
   *
   * @param materiaId - ID da matéria.
   * @returns true se a matéria existir.
   */
  async materiaExists(materiaId: string) {
    const result = await pool.query(
      'SELECT EXISTS (SELECT 1 FROM "materia" WHERE "id" = $1) AS "exists"',
      [materiaId],
    );
    return result.rows[0].exists as boolean;
  }

  /**
   * Lista matérias vinculadas a um professor.
   *
   * @param professorId - ID do professor.
   * @returns Matérias vinculadas ao professor.
   */
  async findMateriasByProfessor(professorId: string) {
    const result = await pool.query<MateriaProfessorRow>(
      `
        SELECT m.*
        FROM "materia" m
        JOIN "materia_professor" mp ON mp."materia_id" = m."id"
        WHERE mp."professor_id" = $1
        ORDER BY m."nome" ASC
      `,
      [professorId],
    );

    return result.rows.map(mapMateriaProfessor);
  }

  /**
   * Remove o vínculo entre professor e matéria.
   *
   * @param professorId - ID do professor.
   * @param materiaId - ID da matéria.
   * @returns true se removido, false se não existia.
   */
  async removerVinculo(professorId: string, materiaId: string) {
    const result = await pool.query(
      'DELETE FROM "materia_professor" WHERE "professor_id" = $1 AND "materia_id" = $2',
      [professorId, materiaId],
    );
    return (result.rowCount ?? 0) > 0;
  }
}
