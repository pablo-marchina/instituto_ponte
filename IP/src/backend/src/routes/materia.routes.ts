import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { MateriaController } from "../controllers/materia.controller.js";
import { requireRole } from "../middlewares/auth.js";
import { errorResponseSchema, successResponseSchema } from "../schemas/common.schema.js";
import {
  createMateriaBodySchema,
  materiaParamsSchema,
  materiaResponseSchema,
  updateMateriaBodySchema,
} from "../schemas/materia.schema.js";

export async function materiaRoutes(app: FastifyInstance) {
  const controller = new MateriaController();

  app.withTypeProvider().post(
    "/materias",
    {
      preHandler: requireRole("coordenador"),
      schema: {
        tags: ["Matérias"],
        summary: "Criar matéria",
        description:
          "Cria uma nova matéria no sistema. Apenas coordenadores podem executar esta ação. O nome da matéria é obrigatório e não pode ser duplicado.",
        body: createMateriaBodySchema,
        response: {
          201: successResponseSchema(materiaResponseSchema),
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
    "/materias",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Matérias"],
        summary: "Listar matérias",
        description:
          "Lista todas as matérias cadastradas no sistema. Professores e coordenadores podem acessar. Suporta paginação.",
        querystring: z.object({
          page: z.coerce.number().int().positive().default(1).optional().describe("Número da página (começa em 1)."),
          limit: z.coerce.number().int().positive().max(100).default(20).optional().describe("Quantidade de itens por página (máx. 100)."),
        }),
        response: {
          200: successResponseSchema(z.array(materiaResponseSchema)),
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    controller.listar,
  );

  app.withTypeProvider().get(
    "/materias/:materiaId",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Matérias"],
        summary: "Buscar matéria por ID",
        description:
          "Retorna os detalhes de uma matéria específica. Professores e coordenadores podem acessar.",
        params: materiaParamsSchema,
        response: {
          200: successResponseSchema(materiaResponseSchema),
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
    "/materias/:materiaId",
    {
      preHandler: requireRole("coordenador"),
      schema: {
        tags: ["Matérias"],
        summary: "Atualizar matéria",
        description:
          "Atualiza os dados de uma matéria existente. Apenas coordenadores podem executar esta ação.",
        params: materiaParamsSchema,
        body: updateMateriaBodySchema,
        response: {
          200: successResponseSchema(materiaResponseSchema),
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
    "/materias/:materiaId",
    {
      preHandler: requireRole("coordenador"),
      schema: {
        tags: ["Matérias"],
        summary: "Remover matéria",
        description:
          "Remove uma matéria do sistema. Apenas coordenadores podem executar esta ação. A remoção pode ser bloqueada se houver vínculos impeditivos (409).",
        params: materiaParamsSchema,
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
