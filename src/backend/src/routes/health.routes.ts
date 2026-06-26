import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { HealthController } from "../controllers/health.controller.js";
import { errorResponseSchema, successResponseSchema } from "../schemas/common.schema.js";

const healthDataSchema = z.object({
  status: z.literal("ok"),
  service: z.literal("corrije-ai-api"),
});

const databaseDataSchema = z.object({
  database: z.literal("ok"),
});

export async function healthRoutes(app: FastifyInstance) {
  const controller = new HealthController();

  app.withTypeProvider().get(
    "/health",
    {
      schema: {
        tags: ["Infraestrutura"],
        summary: "Health check da API",
        description:
          "Endpoint público que verifica se o servidor está operacional. Retorna status 200 com a indicação de que o serviço está no ar. Útil para monitoramento e balanceadores de carga.",
        response: {
          200: successResponseSchema(healthDataSchema),
        },
      },
    },
    controller.check,
  );

  app.withTypeProvider().get(
    "/health/db",
    {
      schema: {
        tags: ["Infraestrutura"],
        summary: "Health check do banco de dados",
        description:
          "Endpoint público que verifica a conectividade com o banco de dados PostgreSQL. Retorna 200 quando a conexão está ativa e 500 em caso de falha de conexão.",
        response: {
          200: successResponseSchema(databaseDataSchema),
          500: errorResponseSchema,
        },
      },
    },
    controller.database,
  );
}
