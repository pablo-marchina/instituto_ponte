import { pool } from "../database/pool.js";
import type { Tema } from "../models/tema.model.js";

/** Linha bruta da tabela `tema`. Campos em snake_case mapeados do PostgreSQL. */
type TemaRow = {
  id: string;
  materia_id: string;
  nome: string;
  descricao: string | null;
  criado_em: Date;
  atualizado_em: Date;
};

/** Converte uma TemaRow (snake_case) para o modelo Tema (camelCase).
 *  Datas são convertidas com toISOString(). */
const mapTema = (row: TemaRow): Tema => ({
  id: row.id,
  materiaId: row.materia_id,
  nome: row.nome,
  descricao: row.descricao,
  criadoEm: row.criado_em.toISOString(),
  atualizadoEm: row.atualizado_em.toISOString(),
});

/**
 * Repositório de temas (assuntos) vinculados a uma matéria.
 *
 * A unicidade é definida pela composição (nome + materia_id).
 * materiaExists previne criação de temas com matéria inexistente.
 */
export class TemaRepository {
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
   * Cria um novo tema vinculado a uma matéria.
   *
   * @param input - Dados do tema: materiaId, nome e descricao opcional.
   * @returns O tema recém-criado.
   */
  async create(input: { materiaId: string; nome: string; descricao?: string | null }) {
    const result = await pool.query<TemaRow>(
      `INSERT INTO "tema" ("materia_id", "nome", "descricao")
       VALUES ($1, $2, $3) RETURNING *`,
      [input.materiaId, input.nome, input.descricao ?? null],
    );
    return mapTema(result.rows[0]);
  }

  /**
   * Lista temas com paginação e filtro opcional por matéria.
   *
   * @param options - Opções: materiaId para filtrar, page e limit para paginação.
   * @returns Lista paginada de temas com total de registros.
   */
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

  /**
   * Busca tema por ID.
   *
   * @param id - ID do tema.
   * @returns Tema encontrado ou null.
   */
  async findById(id: string) {
    const result = await pool.query<TemaRow>(
      'SELECT * FROM "tema" WHERE "id" = $1',
      [id],
    );
    return result.rows[0] ? mapTema(result.rows[0]) : null;
  }

  /**
   * Atualiza um tema, alterando apenas os campos fornecidos.
   *
   * @param id - ID do tema a ser atualizado.
   * @param input - Campos opcionais: nome e descricao.
   * @returns Tema atualizado ou null se não encontrado.
   */
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

  /**
   * Remove um tema pelo ID.
   *
   * @param id - ID do tema a ser removido.
   * @returns true se removido, false se não encontrado.
   */
  async delete(id: string) {
    const result = await pool.query('DELETE FROM "tema" WHERE "id" = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Verifica unicidade composta (nome + materia_id).
   *
   * @param nome - Nome do tema (case-insensitive).
   * @param materiaId - ID da matéria do tema.
   * @param excludeId - ID opcional para excluir da verificação (não utilizado atualmente).
   * @returns Tema duplicado encontrado ou null se único.
   */
  async findByNameAndMateria(nome: string, materiaId: string, excludeId?: string) {
    const result = await pool.query<TemaRow>(
      `SELECT * FROM "tema" WHERE LOWER("nome") = LOWER($1) AND "materia_id" = $2`,
      [nome, materiaId],
    );
    return result.rows[0] ? mapTema(result.rows[0]) : null;
  }
}
