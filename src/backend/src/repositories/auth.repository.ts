import { pool } from "../database/pool.js";
import type { AuthRole, AuthUser } from "../models/auth.model.js";

/** Linha bruta da tabela `professor`/`coordenador`. Campos em snake_case mapeados do PostgreSQL. */
type UserRow = {
  id: string;
  nome: string;
  email: string;
  perfil: AuthRole;
};

/**
 * Repositório de autenticação de usuários (professores e coordenadores).
 *
 * A busca pode ser filtrada por perfil quando o fluxo OAuth informa o papel
 * escolhido pelo usuário no state.
 */
export class AuthRepository {
  /**
   * Localiza o usuário com o email informado.
   *
   * @param email - Email do usuário para busca (case-sensitive).
   * @param perfil - Perfil opcional para desambiguar e-mails cadastrados nas duas tabelas.
   * @returns Dados do usuário com perfil, ou null se não encontrado.
   */
  async findUserByEmail(email: string, perfil?: AuthRole): Promise<AuthUser | null> {
    if (perfil === "professor") {
      const result = await pool.query<UserRow>(
        `
          SELECT "id", "nome", "email", 'professor'::text AS "perfil"
          FROM "professor"
          WHERE "email" = $1
          LIMIT 1
        `,
        [email],
      );

      return result.rows[0] ?? null;
    }

    if (perfil === "coordenador") {
      const result = await pool.query<UserRow>(
        `
          SELECT "id", "nome", "email", 'coordenador'::text AS "perfil"
          FROM "coordenador"
          WHERE "email" = $1
          LIMIT 1
        `,
        [email],
      );

      return result.rows[0] ?? null;
    }

    const result = await pool.query<UserRow>(
      `
        SELECT "id", "nome", "email", 'professor'::text AS "perfil"
        FROM "professor"
        WHERE "email" = $1
        UNION ALL
        SELECT "id", "nome", "email", 'coordenador'::text AS "perfil"
        FROM "coordenador"
        WHERE "email" = $1
        LIMIT 1
      `,
      [email],
    );

    return result.rows[0] ?? null;
  }
}
