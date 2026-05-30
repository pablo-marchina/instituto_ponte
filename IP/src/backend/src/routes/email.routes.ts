import type { FastifyInstance } from "fastify";
import { EmailResultadoController } from "../controllers/email-resultado.controller.js";
import { requireRole } from "../middlewares/auth.js";
import { errorResponseSchema, successResponseSchema } from "../schemas/common.schema.js";
import {
  emailEnvioIdParamsSchema,
  emailEnvioSchema,
  emailLiberadoSchema,
  emailProvaParamsSchema,
  liberarEmailBodySchema,
} from "../schemas/email.schema.js";

export async function emailRoutes(app: FastifyInstance) {
  const controller = new EmailResultadoController();

  app.withTypeProvider().post(
    "/provas/:provaId/resultados/liberar-email",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["E-mails"],
        summary: "Liberar resultados por e-mail",
        description:
          "Envia e-mails individuais com os resultados para cada aluno que já teve a prova corrigida. Se houver pendências de correção, exige confirmação explícita (confirmarPendencias=true) para prosseguir. Atende RF027/RN15.",
        params: emailProvaParamsSchema,
        body: liberarEmailBodySchema,
        response: {
          200: successResponseSchema(emailLiberadoSchema),
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.liberar,
  );

  app.withTypeProvider().get(
    "/provas/:provaId/emails",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["E-mails"],
        summary: "Listar histórico de envios de e-mail",
        description:
          "Retorna o histórico de envios de e-mail de resultado para uma prova, incluindo status de cada envio (pendente, enviado, erro). Atende RF027.",
        params: emailProvaParamsSchema,
        response: {
          200: successResponseSchema(emailEnvioSchema.array()),
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.listarEnvios,
  );

  app.withTypeProvider().post(
    "/emails/:emailEnvioId/reenviar",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["E-mails"],
        summary: "Reenviar e-mail com falha",
        description:
          "Tenta reenviar um e-mail de resultado que falhou anteriormente. Apenas envios com status 'erro' podem ser reenviados. Atende RF027.",
        params: emailEnvioIdParamsSchema,
        response: {
          200: successResponseSchema(emailEnvioSchema),
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.reenviar,
  );
}
