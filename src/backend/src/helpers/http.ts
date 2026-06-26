import type { FastifyReply, FastifyRequest } from "fastify";
import { unauthorized } from "../errors/api-error.js";
import type { AuthUser } from "../models/auth.model.js";

/** Extrai o usuário autenticado da requisição ou lança 401. */
export const getAuthenticatedUser = (request: FastifyRequest): AuthUser => {
  if (!request.user) {
    throw unauthorized();
  }
  return request.user;
};

/** Resposta 200 padrão com envelope { success, data, meta? }. */
export const sendSuccess = (reply: FastifyReply, data: unknown, meta?: Record<string, unknown>) => {
  return reply.send({
    success: true,
    data,
    ...(meta ? { meta } : {}),
  });
};

/** Resposta 201 padrão com envelope { success, data }. */
export const sendCreated = (reply: FastifyReply, data: unknown) => {
  return reply.status(201).send({
    success: true,
    data,
  });
};
