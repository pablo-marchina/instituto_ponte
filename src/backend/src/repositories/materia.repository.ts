import { pool } from "../database/pool.js";
import type { Materia } from "../models/materia.model.js";

/** Linha bruta da tabela `materia`. Campos em snake_case mapeados do PostgreSQL. */
type MateriaRow = {
  id: string;
  nome: string;
  codigo: string | null;
  descricao: string | null;
  criado_em: Date;
  atualizado_em: Date;
};

/** Converte uma MateriaRow (snake_case) para o modelo Materia (camelCase).
 *  Campos Date são convertidos com toISOString() para compatibilidade com JSON. */
const mapMateria = (row: MateriaRow): Materia => ({
  id: row.id,
  nome: row.nome,
  codigo: row.codigo,
  descricao: row.descricao,
  criadoEm: row.criado_em.toISOString(),
  atualizadoEm: row.atualizado_em.toISOString(),
});

/**
 * Repositório de matérias (disciplinas).
 *
 * O update constrói dinamicamente a cláusula SET com apenas os campos fornecidos;
 * findByName usa LOWER() para comparação case-insensitive.
 */
export class MateriaRepository {
  /**
   * Cria uma nova matéria.
   *
   * @param input - Dados da matéria: nome obrigatório, código e descrição opcionais.
   * @returns A matéria recém-criada.
   */
  async create(input: { nome: string; codigo?: string | null; descricao?: string | null }) {
    const result = await pool.query<MateriaRow>(
      `INSERT INTO "materia" ("nome", "codigo", "descricao")
       VALUES ($1, $2, $3) RETURNING *`,
      [input.nome, input.codigo ?? null, input.descricao ?? null],
    );
    return mapMateria(result.rows[0]);
  }

  /**
   * Lista todas as matérias com paginação.
   *
   * @param options - Opções de paginação (page e limit).
   * @returns Lista paginada de matérias com total de registros.
   */
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

  async findAllByProfessor(professorId: string, options?: { page?: number; limit?: number }) {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const offset = (page - 1) * limit;
    const countResult = await pool.query(
      `SELECT COUNT(*) AS "count"
       FROM "materia" m
       JOIN "materia_professor" mp ON mp."materia_id" = m."id"
       WHERE mp."professor_id" = $1`,
      [professorId],
    );
    const total = parseInt(countResult.rows[0].count, 10);
    const result = await pool.query<MateriaRow>(
      `SELECT m.*
       FROM "materia" m
       JOIN "materia_professor" mp ON mp."materia_id" = m."id"
       WHERE mp."professor_id" = $1
       ORDER BY m."nome" ASC
       LIMIT $2 OFFSET $3`,
      [professorId, limit, offset],
    );
    return { data: result.rows.map(mapMateria), total };
  }

  /**
   * Busca matéria por nome, ignorando capitalização.
   *
   * @param nome - Nome da matéria para busca (case-insensitive).
   * @returns Matéria encontrada ou null se inexistente.
   */
  async findByName(nome: string) {
    const result = await pool.query<MateriaRow>(
      'SELECT * FROM "materia" WHERE LOWER("nome") = LOWER($1)',
      [nome],
    );
    return result.rows[0] ? mapMateria(result.rows[0]) : null;
  }

  /**
   * Busca matéria por ID.
   *
   * @param id - ID da matéria.
   * @returns Matéria encontrada ou null.
   */
  async findById(id: string) {
    const result = await pool.query<MateriaRow>(
      'SELECT * FROM "materia" WHERE "id" = $1',
      [id],
    );
    return result.rows[0] ? mapMateria(result.rows[0]) : null;
  }

  /**
   * Atualiza uma matéria, alterando apenas os campos fornecidos.
   *
   * @param id - ID da matéria a ser atualizada.
   * @param input - Campos opcionais para alteração (nome, codigo, descricao).
   * @returns Matéria atualizada ou null se não encontrada.
   */
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

  /**
   * Remove uma matéria pelo ID.
   *
   * @param id - ID da matéria a ser removida.
   * @returns true se removida, false se não encontrada.
   */
  async delete(id: string) {
    const result = await pool.query(
      'DELETE FROM "materia" WHERE "id" = $1',
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  }
}
