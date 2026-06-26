import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { AlunoController } from "../controllers/aluno.controller.js";
import { requireRole } from "../middlewares/auth.js";
import { alunoParamsSchema, alunoResponseSchema, updateAlunoBodySchema } from "../schemas/aluno.schema.js";
import { errorResponseSchema, successResponseSchema } from "../schemas/common.schema.js";

export async function alunoRoutes(app: FastifyInstance) {
  const controller = new AlunoController();

  app.withTypeProvider().get(
    "/alunos",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Alunos"],
        summary: "Listar alunos",
        description:
          "Lista todos os alunos cadastrados no sistema, criados durante o início de provas no portal público. Professores e coordenadores podem acessar. Suporta paginação.",
        querystring: z.object({
          page: z.coerce.number().int().positive().default(1).optional().describe("Número da página (começa em 1)."),
          limit: z.coerce.number().int().positive().max(100).default(20).optional().describe("Quantidade de itens por página (máx. 100)."),
        }),
        response: {
          200: successResponseSchema(z.array(alunoResponseSchema)),
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    controller.listar,
  );

  app.withTypeProvider().get(
    "/alunos/:alunoId",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Alunos"],
        summary: "Buscar aluno por ID",
        description:
          "Retorna os dados de um aluno específico. Professores e coordenadores podem acessar.",
        params: alunoParamsSchema,
        response: {
          200: successResponseSchema(alunoResponseSchema),
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
    "/alunos/:alunoId",
    {
      preHandler: requireRole("coordenador"),
      schema: {
        tags: ["Alunos"],
        summary: "Atualizar dados do aluno",
        description:
          "Atualiza os dados cadastrais de um aluno. Apenas coordenadores podem executar esta ação. Permite alterar nome, e-mail e CPF.",
        params: alunoParamsSchema,
        body: updateAlunoBodySchema,
        response: {
          200: successResponseSchema(alunoResponseSchema),
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
    "/alunos/:alunoId",
    {
      preHandler: requireRole("coordenador"),
      schema: {
        tags: ["Alunos"],
        summary: "Remover aluno",
        description:
          "Remove um aluno do sistema. Apenas coordenadores podem executar esta ação.",
        params: alunoParamsSchema,
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
