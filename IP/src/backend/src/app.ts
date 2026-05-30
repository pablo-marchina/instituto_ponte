import Fastify from "fastify";
import { fastifyCors } from "@fastify/cors";
import { fastifySwagger } from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { ZodError } from "zod";
import { ApiError } from "./errors/api-error.js";
import { alunoRoutes } from "./routes/aluno.routes.js";
import { alunoPortalRoutes } from "./routes/aluno-portal.routes.js";
import { analyticsRoutes } from "./routes/analytics.routes.js";
import { anexoExportarRoutes } from "./routes/anexo-exportar.routes.js";
import { authRoutes } from "./routes/auth.routes.js";
import { coordenadorRoutes } from "./routes/coordenador.routes.js";
import { correcaoRoutes } from "./routes/correcao.routes.js";
import { emailRoutes } from "./routes/email.routes.js";
import { healthRoutes } from "./routes/health.routes.js";
import { materiaRoutes } from "./routes/materia.routes.js";
import { professorRoutes } from "./routes/professor.routes.js";
import { provaRoutes } from "./routes/prova.routes.js";
import { temaRoutes } from "./routes/tema.routes.js";
import { questaoRoutes } from "./routes/questao.routes.js";
import { respostaAnexoRoutes } from "./routes/resposta-anexo.routes.js";
import { respostaAlunoRoutes } from "./routes/resposta-aluno.routes.js";
import { resultadoRoutes } from "./routes/resultado.routes.js";

const validationDetails = (error: Error & { validation?: unknown }) => {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => ({
      field: issue.path.length > 0 ? issue.path.join(".") : "body",
      message: issue.message,
    }));
  }

  return [
    {
      field: "request",
      message: error.message,
    },
  ];
};

export function buildApp() {
  const app = Fastify({
    logger: process.env.NODE_ENV !== "test",
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.register(fastifyCors, { origin: "*" });
  app.register(fastifySwagger, {
    openapi: {
      info: {
        title: "Api - Instituto Ponte",
        version: "1.0.0",
      },
    },
    transform: jsonSchemaTransform,
  });
  app.register(fastifySwaggerUi, {
    routePrefix: "/docs",
  });

  app.register(
    async (api) => {
      api.register(healthRoutes);
      api.register(authRoutes);
      api.register(alunoRoutes);
      api.register(coordenadorRoutes);
      api.register(provaRoutes);
      api.register(questaoRoutes);
      api.register(alunoPortalRoutes);
      api.register(respostaAlunoRoutes);
      api.register(respostaAnexoRoutes);
      api.register(correcaoRoutes);
      api.register(resultadoRoutes);
      api.register(analyticsRoutes);
      api.register(anexoExportarRoutes);
      api.register(emailRoutes);
      api.register(professorRoutes);
      api.register(materiaRoutes);
      api.register(temaRoutes);
    },
    { prefix: "/api/v1" },
  );

  app.setNotFoundHandler((_request, reply) => {
    return reply.status(404).send({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Rota não encontrada.",
        details: [],
      },
    });
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ApiError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details.length > 0 ? error.details : undefined,
        },
      });
    }

    const maybeValidationError = error as Error & { validation?: unknown };

    if (error instanceof ZodError || maybeValidationError.validation) {
      return reply.status(422).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Payload inválido.",
          details: validationDetails(maybeValidationError),
        },
      });
    }

    app.log.error(error);
    return reply.status(500).send({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Erro interno não esperado.",
        details: [],
      },
    });
  });

  return app;
}
