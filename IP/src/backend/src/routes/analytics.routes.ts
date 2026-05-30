import type { FastifyInstance } from "fastify";
import { AnalyticsController } from "../controllers/analytics.controller.js";
import { requireRole } from "../middlewares/auth.js";
import { errorResponseSchema, successResponseSchema } from "../schemas/common.schema.js";
import {
  analyticsDataSchema,
  analyticsParamsSchema,
  criarLogBodySchema,
  logCriadoSchema,
} from "../schemas/analytics.schema.js";

export async function analyticsRoutes(app: FastifyInstance) {
  const controller = new AnalyticsController();

  app.withTypeProvider().get(
    "/provas/:provaId/analytics",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Analytics"],
        summary: "Consultar analytics de uma prova",
        description:
          "Retorna métricas e estatísticas de uma prova: total de alunos, acessos, inícios, envios, total de respostas, anexos e pendências de correção. Coordenadores e professores vinculados podem acessar. Atende RF019/RF020/RN17.",
        params: analyticsParamsSchema,
        response: {
          200: successResponseSchema(analyticsDataSchema),
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    controller.obterPorProva,
  );

  app.withTypeProvider().post(
    "/logs",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Analytics"],
        summary: "Registrar log operacional",
        description:
          "Persiste um evento de log no sistema para auditoria e rastreamento. Os atores podem ser aluno, professor, coordenador ou sistema. Útil para registrar ações como uploads, falhas e eventos importantes. Atende RF019/RF020.",
        body: criarLogBodySchema,
        response: {
          201: successResponseSchema(logCriadoSchema),
          401: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.registrarLog,
  );
}
