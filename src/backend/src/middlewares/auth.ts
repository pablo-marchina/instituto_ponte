import type { FastifyReply, FastifyRequest } from "fastify";
import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify } from "jose";
import { ApiError, forbidden, unauthorized } from "../errors/api-error.js";
import { pool } from "../database/pool.js";

import type { AuthRole, AuthUser } from "../models/auth.model.js";

export type { AuthRole, AuthUser };

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

/** Funções auxiliares para o middleware de autenticação. */

let supabaseJwks: ReturnType<typeof createRemoteJWKSet> | null = null;

const getSupabaseJwtSecret = (): Uint8Array => {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw unauthorized("SUPABASE_JWT_SECRET não configurado no backend.");
  }
  return new TextEncoder().encode(secret);
};

const getSupabaseJwks = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    throw unauthorized("SUPABASE_URL não configurada no backend para validar JWT assimétrico.");
  }

  supabaseJwks ??= createRemoteJWKSet(
    new URL("/auth/v1/.well-known/jwks.json", supabaseUrl),
  );

  return supabaseJwks;
};

const getSupabaseJwtAlg = (token: string) => {
  const { alg } = decodeProtectedHeader(token);
  return alg;
};


const isTestMode = () =>
  process.env.NODE_ENV === "test" || process.env.AUTH_MODE === "test";

const parseTestToken = (authorization?: string): AuthUser | null => {
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();
  const [prefix, id, email = `${id}@local.test`, nome = "Usuário Local"] = token.split(":");

  if (prefix === "test-professor" && id) {
    return { id, email, nome, perfil: "professor" };
  }

  if (prefix === "test-coordenador" && id) {
    return { id, email, nome, perfil: "coordenador" };
  }

  return null;
};

type SupabaseJwtPayload = {
  sub: string;
  email?: string;
  aud?: string;
  iss?: string;
  exp?: number;
  iat?: number;
  role?: string;
};

const parseAuthRoleHeader = (value: unknown): AuthRole | undefined =>
  value === "professor" || value === "coordenador" ? value : undefined;

const validateSupabaseJwt = async (authorization?: string): Promise<SupabaseJwtPayload> => {
  if (!authorization?.startsWith("Bearer ")) {
    throw unauthorized("Token de autenticação não fornecido.");
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    throw unauthorized("Token de autenticação vazio.");
  }

  try {
    const alg = getSupabaseJwtAlg(token);
    const isHmac = alg?.startsWith("HS") ?? false;
    const key = isHmac
      ? getSupabaseJwtSecret()
      : alg?.startsWith("RS") || alg?.startsWith("ES")
        ? getSupabaseJwks()
        : null;

    if (!key) {
      throw unauthorized("Algoritmo do token Supabase não suportado.");
    }

    const { payload } = isHmac
      ? await jwtVerify(token, key as Uint8Array, {
        issuer: process.env.SUPABASE_JWT_ISSUER ?? undefined,
      })
      : await jwtVerify(token, key as ReturnType<typeof createRemoteJWKSet>, {
      issuer: process.env.SUPABASE_JWT_ISSUER ?? undefined,
      });

    if (!payload.sub) {
      throw unauthorized("Token inválido: sem identificador de usuário.");
    }

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      throw unauthorized("Token expirado.");
    }

    return payload as unknown as SupabaseJwtPayload;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw unauthorized("Token de autenticação inválido ou expirado.");
  }
};

const findUserByAuthId = async (
  authUserId: string,
  perfil?: AuthRole,
): Promise<AuthUser | null> => {
  if (perfil === "professor") {
    const result = await pool.query<{ id: string; nome: string; email: string; perfil: AuthRole }>(
      `SELECT "id", "nome", "email", 'professor'::text AS "perfil"
       FROM "professor" WHERE "auth_user_id" = $1
       LIMIT 1`,
      [authUserId],
    );

    return result.rows[0] ?? null;
  }

  if (perfil === "coordenador") {
    const result = await pool.query<{ id: string; nome: string; email: string; perfil: AuthRole }>(
      `SELECT "id", "nome", "email", 'coordenador'::text AS "perfil"
       FROM "coordenador" WHERE "auth_user_id" = $1
       LIMIT 1`,
      [authUserId],
    );

    return result.rows[0] ?? null;
  }

  const result = await pool.query<{ id: string; nome: string; email: string; perfil: AuthRole }>(
    `SELECT "id", "nome", "email", 'professor'::text AS "perfil"
     FROM "professor" WHERE "auth_user_id" = $1
     UNION ALL
     SELECT "id", "nome", "email", 'coordenador'::text AS "perfil"
     FROM "coordenador" WHERE "auth_user_id" = $1
     LIMIT 1`,
    [authUserId],
  );

  return result.rows[0] ?? null;
};

const findUserByEmail = async (email: string, perfil?: AuthRole): Promise<AuthUser | null> => {
  if (perfil === "professor") {
    const result = await pool.query<{ id: string; nome: string; email: string; perfil: AuthRole }>(
      `SELECT "id", "nome", "email", 'professor'::text AS "perfil"
       FROM "professor" WHERE "email" = $1
       LIMIT 1`,
      [email],
    );

    return result.rows[0] ?? null;
  }

  if (perfil === "coordenador") {
    const result = await pool.query<{ id: string; nome: string; email: string; perfil: AuthRole }>(
      `SELECT "id", "nome", "email", 'coordenador'::text AS "perfil"
       FROM "coordenador" WHERE "email" = $1
       LIMIT 1`,
      [email],
    );

    return result.rows[0] ?? null;
  }

  const result = await pool.query<{ id: string; nome: string; email: string; perfil: AuthRole }>(
    `SELECT "id", "nome", "email", 'professor'::text AS "perfil"
     FROM "professor" WHERE "email" = $1
     UNION ALL
     SELECT "id", "nome", "email", 'coordenador'::text AS "perfil"
     FROM "coordenador" WHERE "email" = $1
     LIMIT 1`,
    [email],
  );

  return result.rows[0] ?? null;
};

export const requireAuth = async (request: FastifyRequest, _reply: FastifyReply) => {
  if (isTestMode()) {
    const roleHeader = request.headers["x-user-role"];
    const idHeader = request.headers["x-user-id"];

    if ((roleHeader === "professor" || roleHeader === "coordenador") && typeof idHeader === "string") {
      const emailHeader = request.headers["x-user-email"];
      const nameHeader = request.headers["x-user-name"];

      request.user = {
        id: idHeader,
        perfil: roleHeader,
        email: typeof emailHeader === "string" ? emailHeader : `${idHeader}@local.test`,
        nome: typeof nameHeader === "string" ? nameHeader : "Usuário Local",
      };
      return;
    }

    const testUser = parseTestToken(request.headers.authorization);
    if (testUser) {
      request.user = testUser;
      return;
    }
  }

  const payload = await validateSupabaseJwt(request.headers.authorization);
  const requestedRole = parseAuthRoleHeader(request.headers["x-user-role"]);

  let user: AuthUser | null = null;

  if (payload.sub) {
    user = await findUserByAuthId(payload.sub, requestedRole);
  }

  if (!user && payload.email) {
    user = await findUserByEmail(payload.email, requestedRole);
  }

  if (!user) {
    throw forbidden("Usuário não encontrado ou sem permissão de acesso.");
  }

  request.user = user;
};

export const requireRole =
  (...roles: AuthRole[]) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(request, reply);

    if (!request.user || !roles.includes(request.user.perfil)) {
      throw forbidden();
    }
  };
