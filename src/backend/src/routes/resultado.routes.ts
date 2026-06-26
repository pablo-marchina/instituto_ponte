import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ResultadoController } from "../controllers/resultado.controller.js";
import { requireRole } from "../middlewares/auth.js";
import { errorResponseSchema, successResponseSchema } from "../schemas/common.schema.js";
import {
  exportacaoResultadoSchema,
  exportarResultadoBodySchema,
  resultadoAlunoSchema,
  resultadoProvaParamsSchema,
} from "../schemas/resultado.schema.js";

export async function resultadoRoutes(app: FastifyInstance) {
  const controller = new ResultadoController();

  app.withTypeProvider().get(
    "/provas/:provaId/resultados",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Resultados"],
        summary: "Visualizar resultados consolidados da prova",
        description:
          "Retorna os resultados consolidados de todos os alunos de uma prova, incluindo nota total, percentual, pendências de correção e detalhamento por questão. Apenas professores vinculados ou coordenadores podem acessar. Atende RF017/RF019/RN14/RN17.",
        params: resultadoProvaParamsSchema,
        response: {
          200: successResponseSchema(z.array(resultadoAlunoSchema)),
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.listarPorProva,
  );

  app.withTypeProvider().post(
    "/provas/:provaId/resultados/exportar",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Resultados"],
        summary: "Exportar resultados",
        description:
          "Exporta os resultados da prova em formato XLSX ou CSV. Gera uma planilha com alunos nas linhas e notas/questões nas colunas. Apenas coordenadores podem executar esta ação. Atende RF017/RN14.",
        params: resultadoProvaParamsSchema,
        body: exportarResultadoBodySchema,
        response: {
          201: successResponseSchema(exportacaoResultadoSchema),
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
