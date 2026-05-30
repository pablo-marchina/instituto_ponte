import { pool } from "../database/pool.js";
import type { AuthRole, AuthUser } from "../middlewares/auth.js";

type UserRow = {
  id: string;
  nome: string;
  email: string;
  perfil: AuthRole;
};

export class AuthRepository {
  async findUserByEmail(email: string): Promise<AuthUser | null> {
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
