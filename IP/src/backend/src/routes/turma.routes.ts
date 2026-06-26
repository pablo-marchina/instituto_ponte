import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { TurmaController } from "../controllers/turma.controller.js";
import { requireRole } from "../middlewares/auth.js";
import { errorResponseSchema, successResponseSchema } from "../schemas/common.schema.js";
import { turmaBodySchema, turmaParamsSchema, turmaResponseSchema } from "../schemas/turma.schema.js";

export async function turmaRoutes(app: FastifyInstance) {
  const controller = new TurmaController();

  app.withTypeProvider().get(
    "/turmas",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Turmas"],
        summary: "Listar turmas",
        response: { 200: successResponseSchema(z.array(turmaResponseSchema)), 401: errorResponseSchema, 403: errorResponseSchema },
      },
    },
    controller.listar,
  );

  app.withTypeProvider().post(
    "/turmas",
    {
      preHandler: requireRole("coordenador"),
      schema: {
        tags: ["Turmas"],
        summary: "Criar turma",
        body: turmaBodySchema,
        response: { 201: successResponseSchema(turmaResponseSchema), 401: errorResponseSchema, 403: errorResponseSchema, 409: errorResponseSchema, 422: errorResponseSchema },
      },
    },
    controller.criar,
  );

  app.withTypeProvider().put(
    "/turmas/:turmaId",
    {
      preHandler: requireRole("coordenador"),
      schema: {
        tags: ["Turmas"],
        summary: "Atualizar turma",
        params: turmaParamsSchema,
        body: turmaBodySchema,
        response: { 200: successResponseSchema(turmaResponseSchema), 401: errorResponseSchema, 403: errorResponseSchema, 404: errorResponseSchema, 409: errorResponseSchema, 422: errorResponseSchema },
      },
    },
    controller.atualizar,
  );

  app.withTypeProvider().delete(
    "/turmas/:turmaId",
    {
      preHandler: requireRole("coordenador"),
      schema: {
        tags: ["Turmas"],
        summary: "Remover turma",
        params: turmaParamsSchema,
        response: { 204: z.null(), 401: errorResponseSchema, 403: errorResponseSchema, 404: errorResponseSchema, 422: errorResponseSchema },
      },
    },
    controller.remover,
  );
}
