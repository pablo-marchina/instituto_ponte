import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ProvaController } from "../controllers/prova.controller.js";
import { requireRole } from "../middlewares/auth.js";
import { errorResponseSchema, successResponseSchema } from "../schemas/common.schema.js";
import { listProvasQuerySchema, provaSchema } from "../schemas/prova.schema.js";

export async function coordenadorRoutes(app: FastifyInstance) {
  const provaController = new ProvaController();

  app.withTypeProvider().get(
    "/coordenador/provas",
    {
      preHandler: requireRole("coordenador"),
      schema: {
        tags: ["Coordenador"],
        summary: "Painel do coordenador — listar todas as provas",
        description:
          "Lista todas as provas do sistema sem restrição por professor. O coordenador pode visualizar provas de qualquer professor e aplicar filtros combinados. Apenas coordenadores têm acesso a este endpoint. Atende RF018/RF020/RN17/RN01.",
        querystring: listProvasQuerySchema,
        response: {
          200: successResponseSchema(z.array(provaSchema)),
          401: errorResponseSchema,
          403: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    provaController.listar,
  );
}
