import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ProfessorController } from "../controllers/professor.controller.js";
import { requireRole } from "../middlewares/auth.js";
import { errorResponseSchema, successResponseSchema } from "../schemas/common.schema.js";
import {
  createProfessorBodySchema,
  professorMateriaResponseSchema,
  professorParamsSchema,
  professorResponseSchema,
  updateProfessorBodySchema,
} from "../schemas/professor.schema.js";

export async function professorRoutes(app: FastifyInstance) {
  const controller = new ProfessorController();

  app.withTypeProvider().post(
    "/professores",
    {
      preHandler: requireRole("coordenador"),
      schema: {
        tags: ["Professores"],
        summary: "Criar professor",
        description:
          "Cadastra um novo professor no sistema, vinculando-o a um coordenador. Apenas coordenadores podem executar esta ação. O e-mail deve ser único.",
        body: createProfessorBodySchema,
        response: {
          201: successResponseSchema(professorResponseSchema),
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
    "/professores",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Professores"],
        summary: "Listar professores",
        description:
          "Lista todos os professores cadastrados. Professores e coordenadores podem acessar. Suporta paginação.",
        querystring: z.object({
          page: z.coerce.number().int().positive().default(1).optional().describe("Número da página (começa em 1)."),
          limit: z.coerce.number().int().positive().max(100).default(20).optional().describe("Quantidade de itens por página (máx. 100)."),
        }),
        response: {
          200: successResponseSchema(z.array(professorResponseSchema)),
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    controller.listar,
  );

  app.withTypeProvider().get(
    "/professores/:professorId",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Professores"],
        summary: "Buscar professor por ID",
        description:
          "Retorna os dados de um professor específico.",
        params: professorParamsSchema,
        response: {
          200: successResponseSchema(professorResponseSchema),
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.buscarPorId,
  );

  app.withTypeProvider().get(
    "/professores/:professorId/materias",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Professores"],
        summary: "Listar matérias vinculadas ao professor",
        description:
          "Lista as matérias vinculadas a um professor. Coordenadores usam para gestão de vínculos; professores usam para conferir suas matérias.",
        params: professorParamsSchema,
        response: {
          200: successResponseSchema(z.array(professorMateriaResponseSchema)),
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.listarMaterias,
  );

  app.withTypeProvider().put(
    "/professores/:professorId",
    {
      preHandler: requireRole("coordenador"),
      schema: {
        tags: ["Professores"],
        summary: "Atualizar professor",
        description:
          "Atualiza os dados de um professor existente. Apenas coordenadores podem executar esta ação.",
        params: professorParamsSchema,
        body: updateProfessorBodySchema,
        response: {
          200: successResponseSchema(professorResponseSchema),
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
    "/professores/:professorId",
    {
      preHandler: requireRole("coordenador"),
      schema: {
        tags: ["Professores"],
        summary: "Remover professor",
        description:
          "Remove um professor do sistema. Apenas coordenadores podem executar esta ação.",
        params: professorParamsSchema,
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

  app.withTypeProvider().post(
    "/professores/:professorId/materias",
    {
      preHandler: requireRole("coordenador"),
      schema: {
        tags: ["Professores"],
        summary: "Vincular professor a matéria",
        description:
          "Cria um vínculo entre um professor e uma matéria, permitindo que o professor crie provas e questões para essa matéria. Apenas coordenadores podem executar esta ação.",
        params: professorParamsSchema,
        body: z.object({ materiaId: z.string().uuid().describe("Identificador único da matéria.") }).strict(),
        response: {
          201: successResponseSchema(
            z.object({
              materiaId: z.string().uuid().describe("Identificador único da matéria."),
              professorId: z.string().uuid().describe("Identificador único do professor."),
            }),
          ),
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.criarVinculo,
  );

  app.withTypeProvider().delete(
    "/professores/:professorId/materias/:materiaId",
    {
      preHandler: requireRole("coordenador"),
      schema: {
        tags: ["Professores"],
        summary: "Remover vínculo professor-matéria",
        description:
          "Remove o vínculo entre um professor e uma matéria. Apenas coordenadores podem executar esta ação.",
        params: z.object({
          professorId: z.string().uuid().describe("Identificador único do professor."),
          materiaId: z.string().uuid().describe("Identificador único da matéria."),
        }),
        response: {
          204: z.null(),
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.removerVinculo,
  );
}
