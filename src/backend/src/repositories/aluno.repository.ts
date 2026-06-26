import { pool } from "../database/pool.js";
import { withTransaction } from "../database/transaction.js";
import type { Aluno } from "../models/aluno.model.js";
import { decryptCpf, encryptCpf, hashCpf, isEncryptedCpf, normalizeCpf } from "../security/cpf-crypto.js";

/** Linha bruta da tabela `aluno`. Campos em snake_case mapeados do PostgreSQL. */
type AlunoRow = {
  id: string;
  nome: string;
  email: string;
  cpf: string | null;
  turma: string | null;
  aceitou_termos_em: Date | null;
  criado_em: Date;
  atualizado_em: Date;
};

/** Converte uma AlunoRow (snake_case) para o modelo Aluno (camelCase).
 *  aceitou_termos_em é opcional (pode ser null) — usa encadeamento opcional com fallback para null. */
export const safeDecodeCpf = (cpf: string | null): string | null => {
  if (!cpf) return null;

  try {
    if (isEncryptedCpf(cpf)) return decryptCpf(cpf);
    return normalizeCpf(cpf);
  } catch {
    return null;
  }
};

const mapAluno = (row: AlunoRow): Aluno => ({
  id: row.id,
  nome: row.nome,
  email: row.email,
  cpf: safeDecodeCpf(row.cpf),
  turma: row.turma,
  aceitouTermosEm: row.aceitou_termos_em?.toISOString() ?? null,
  criadoEm: row.criado_em.toISOString(),
  atualizadoEm: row.atualizado_em.toISOString(),
});

let alunoSchemaReady = false;

/**
 * Repositório de alunos cadastrados.
 *
 * Oferece CRUD básico e buscas por email e CPF (chaves alternativas).
 * O campo aceitou_termos_em registra a aceitação dos termos de uso.
 */
export class AlunoRepository {
  private async ensureSchema() {
    if (alunoSchemaReady) return;
    await pool.query('ALTER TABLE "aluno" ADD COLUMN IF NOT EXISTS "turma" TEXT NULL');
    await pool.query('ALTER TABLE "aluno" ADD COLUMN IF NOT EXISTS "cpf_hash" TEXT NULL');
    alunoSchemaReady = true;
  }

  /**
   * Lista todos os alunos com paginação.
   *
   * @param options - Opções de paginação (page e limit).
   * @returns Lista paginada de alunos com total de registros.
   */
  async findAll(options?: { page?: number; limit?: number }) {
    await this.ensureSchema();
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

  /**
   * Busca aluno por ID.
   *
   * @param id - ID do aluno.
   * @returns Aluno encontrado ou null.
   */
  async findById(id: string) {
    await this.ensureSchema();
    const result = await pool.query<AlunoRow>(
      'SELECT * FROM "aluno" WHERE "id" = $1',
      [id],
    );
    return result.rows[0] ? mapAluno(result.rows[0]) : null;
  }

  /**
   * Busca aluno por email.
   *
   * @param email - Email do aluno.
   * @returns Aluno encontrado ou null.
   */
  async findByEmail(email: string) {
    await this.ensureSchema();
    const result = await pool.query<AlunoRow>(
      'SELECT * FROM "aluno" WHERE "email" = $1',
      [email],
    );
    return result.rows[0] ? mapAluno(result.rows[0]) : null;
  }

  /**
   * Busca aluno por CPF.
   *
   * @param cpf - CPF do aluno.
   * @returns Aluno encontrado ou null.
   */
  async findByCpf(cpf: string) {
    await this.ensureSchema();
    const cpfHash = hashCpf(cpf);
    const result = await pool.query<AlunoRow>(
      'SELECT * FROM "aluno" WHERE "cpf_hash" = $1 OR ("cpf_hash" IS NULL AND "cpf" = $2)',
      [cpfHash, cpf],
    );
    return result.rows[0] ? mapAluno(result.rows[0]) : null;
  }

  /**
   * Atualiza dados de um aluno, alterando apenas os campos fornecidos.
   *
   * @param id - ID do aluno a ser atualizado.
   * @param input - Campos opcionais: nome, email, cpf.
   * @returns Aluno atualizado ou null se não encontrado.
   */
  async update(
    id: string,
    input: { nome?: string; email?: string; cpf?: string | null; turma?: string | null },
  ) {
    await this.ensureSchema();
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
      values.push(input.cpf === null ? null : encryptCpf(input.cpf));
      fields.push(`"cpf_hash" = $${index++}`);
      values.push(input.cpf === null ? null : hashCpf(input.cpf));
    }
    if (input.turma !== undefined) {
      fields.push(`"turma" = $${index++}`);
      values.push(input.turma);
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

  /**
   * Remove um aluno pelo ID.
   *
   * @param id - ID do aluno a ser removido.
   * @returns true se removido, false se não encontrado.
   */
  async delete(id: string) {
    await this.ensureSchema();
    return withTransaction(async (client) => {
      const provaAlunoResult = await client.query<{ id: string }>(
        'SELECT "id" FROM "prova_aluno" WHERE "aluno_id" = $1',
        [id],
      );
      const provaAlunoIds = provaAlunoResult.rows.map((row) => row.id);

      if (provaAlunoIds.length > 0) {
        const tablesResult = await client.query<{ table_name: string }>(
          `SELECT table_name
           FROM information_schema.tables
           WHERE table_schema = 'public'
             AND table_name = ANY($1::text[])`,
          [["avaliacao_log", "resposta_anexo", "feedback", "correcao", "email_envio", "resultado_aluno", "resposta_aluno"]],
        );
        const existingTables = new Set(tablesResult.rows.map((row) => row.table_name));

        if (existingTables.has("avaliacao_log")) {
          await client.query(
          'UPDATE "avaliacao_log" SET "prova_aluno_id" = NULL WHERE "prova_aluno_id" = ANY($1::uuid[])',
          [provaAlunoIds],
          );
        }
        if (existingTables.has("resposta_anexo") && existingTables.has("resposta_aluno")) {
          await client.query(
          `DELETE FROM "resposta_anexo"
           WHERE "resposta_id" IN (
             SELECT "id" FROM "resposta_aluno" WHERE "prova_aluno_id" = ANY($1::uuid[])
           )`,
          [provaAlunoIds],
          );
        }
        if (existingTables.has("feedback") && existingTables.has("correcao") && existingTables.has("resposta_aluno")) {
          await client.query(
          `DELETE FROM "feedback"
           WHERE "correcao_id" IN (
             SELECT c."id"
             FROM "correcao" c
             JOIN "resposta_aluno" ra ON ra."id" = c."resposta_id"
             WHERE ra."prova_aluno_id" = ANY($1::uuid[])
           )`,
          [provaAlunoIds],
          );
        }
        if (existingTables.has("correcao") && existingTables.has("resposta_aluno")) {
          await client.query(
          `DELETE FROM "correcao"
           WHERE "resposta_id" IN (
             SELECT "id" FROM "resposta_aluno" WHERE "prova_aluno_id" = ANY($1::uuid[])
           )`,
          [provaAlunoIds],
          );
        }
        if (existingTables.has("email_envio")) {
          await client.query('DELETE FROM "email_envio" WHERE "prova_aluno_id" = ANY($1::uuid[])', [provaAlunoIds]);
        }
        if (existingTables.has("resultado_aluno")) {
          await client.query('DELETE FROM "resultado_aluno" WHERE "prova_aluno_id" = ANY($1::uuid[])', [provaAlunoIds]);
        }
        if (existingTables.has("resposta_aluno")) {
          await client.query('DELETE FROM "resposta_aluno" WHERE "prova_aluno_id" = ANY($1::uuid[])', [provaAlunoIds]);
        }
        await client.query('DELETE FROM "prova_aluno" WHERE "id" = ANY($1::uuid[])', [provaAlunoIds]);
      }

      const result = await client.query('DELETE FROM "aluno" WHERE "id" = $1', [id]);
      return (result.rowCount ?? 0) > 0;
    });
  }
}
