import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { TemaController } from "../controllers/tema.controller.js";
import { requireRole } from "../middlewares/auth.js";
import { errorResponseSchema, successResponseSchema } from "../schemas/common.schema.js";
import {
  createTemaBodySchema,
  listTemasQuerySchema,
  temaParamsSchema,
  temaResponseSchema,
  updateTemaBodySchema,
} from "../schemas/tema.schema.js";

export async function temaRoutes(app: FastifyInstance) {
  const controller = new TemaController();

  app.withTypeProvider().post(
    "/temas",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Temas"],
        summary: "Criar tema",
        description:
          "Cria um novo tema vinculado a uma matéria. Professores vinculados à matéria e coordenadores podem criar temas.",
        body: createTemaBodySchema,
        response: {
          201: successResponseSchema(temaResponseSchema),
          401: errorResponseSchema,
          403: errorResponseSchema,
          409: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.criar,
  );

  app.withTypeProvider().get(
    "/temas",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Temas"],
        summary: "Listar temas",
        description:
          "Lista todos os temas cadastrados, com suporte a filtro por matéria (materiaId). Professores e coordenadores podem acessar.",
        querystring: listTemasQuerySchema,
        response: {
          200: successResponseSchema(z.array(temaResponseSchema)),
          401: errorResponseSchema,
          403: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.listar,
  );

  app.withTypeProvider().get(
    "/temas/:temaId",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Temas"],
        summary: "Buscar tema por ID",
        description:
          "Retorna os detalhes de um tema específico.",
        params: temaParamsSchema,
        response: {
          200: successResponseSchema(temaResponseSchema),
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.buscarPorId,
  );

  app.withTypeProvider().put(
    "/temas/:temaId",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Temas"],
        summary: "Atualizar tema",
        description:
          "Atualiza os dados de um tema existente. Professores vinculados e coordenadores podem executar esta ação.",
        params: temaParamsSchema,
        body: updateTemaBodySchema,
        response: {
          200: successResponseSchema(temaResponseSchema),
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.atualizar,
  );

  app.withTypeProvider().delete(
    "/temas/:temaId",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Temas"],
        summary: "Remover tema",
        description:
          "Remove um tema do sistema. Apenas coordenadores podem executar esta ação.",
        params: temaParamsSchema,
        response: {
          204: z.null(),
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.remover,
  );
}
