import type { FastifyReply, FastifyRequest } from "fastify";
import { unauthorized } from "../errors/api-error.js";
import type { AuthUser } from "../middlewares/auth.js";

export const getAuthenticatedUser = (request: FastifyRequest): AuthUser => {
  if (!request.user) {
    throw unauthorized();
  }
  return request.user;
};

export const sendSuccess = (reply: FastifyReply, data: unknown, meta?: Record<string, unknown>) => {
  return reply.send({
    success: true,
    data,
    ...(meta ? { meta } : {}),
  });
};

export const sendCreated = (reply: FastifyReply, data: unknown) => {
  return reply.status(201).send({
    success: true,
    data,
  });
};
