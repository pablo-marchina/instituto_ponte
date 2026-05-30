import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { AnexoExportarController } from "../controllers/anexo-exportar.controller.js";
import { requireRole } from "../middlewares/auth.js";
import { anexoExportarItemSchema } from "../schemas/anexo-exportar.schema.js";
import { errorResponseSchema, successResponseSchema } from "../schemas/common.schema.js";

export async function anexoExportarRoutes(app: FastifyInstance) {
  const controller = new AnexoExportarController();

  app.withTypeProvider().post(
    "/provas/:provaId/anexos/exportar",
    {
      preHandler: requireRole("coordenador"),
      schema: {
        tags: ["Anexos"],
        summary: "Exportar anexos de respostas da prova",
        description:
          "Gera um pacote com todos os anexos enviados pelos alunos nas respostas de uma prova. Apenas coordenadores podem executar esta ação. Atende RF028/RN16.",
        params: z.object({
          provaId: z.string().uuid().describe("Identificador único da prova."),
        }),
        response: {
          200: successResponseSchema(z.array(anexoExportarItemSchema)),
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.exportar,
  );
}
