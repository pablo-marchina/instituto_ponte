import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { QuestaoController } from "../controllers/questao.controller.js";
import { requireRole } from "../middlewares/auth.js";
import { errorResponseSchema, successResponseSchema } from "../schemas/common.schema.js";
import {
  createQuestaoBodySchema,
  listQuestoesQuerySchema,
  questaoParamsSchema,
  questaoResponseSchema,
  updateQuestaoBodySchema,
} from "../schemas/questao.schema.js";

export async function questaoRoutes(app: FastifyInstance) {
  const controller = new QuestaoController();

  app.withTypeProvider().post(
    "/questoes",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Questões"],
        summary: "Criar questão",
        description:
          "Cria uma nova questão no banco de questões. Suporta os tipos: múltipla escolha (mínimo 2 alternativas, exatamente 1 correta), verdadeiro/falso (exatamente 2 alternativas, exatamente 1 correta) e discursiva (não deve ter alternativas). O enunciado em LaTeX é obrigatório. Atende RF003/RF004/RF005/RN03/RN20.",
        body: createQuestaoBodySchema,
        response: {
          201: successResponseSchema(questaoResponseSchema),
          401: errorResponseSchema,
          403: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.criar,
  );

  app.withTypeProvider().get(
    "/questoes",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Questões"],
        summary: "Listar questões do banco",
        description:
          "Lista as questões do banco de questões com suporte a filtros combinados por matéria, tema, tipo e busca textual. Coordenador vê todas; professor vê apenas questões de matérias às quais está vinculado. Atende RF003/RN20.",
        querystring: listQuestoesQuerySchema,
        response: {
          200: successResponseSchema(z.array(questaoResponseSchema)),
          401: errorResponseSchema,
          403: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.listar,
  );

  app.withTypeProvider().get(
    "/questoes/:questaoId",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Questões"],
        summary: "Buscar questão por ID",
        description:
          "Retorna os detalhes completos de uma questão específica, incluindo enunciado e alternativas. Atende RF003.",
        params: questaoParamsSchema,
        response: {
          200: successResponseSchema(questaoResponseSchema),
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
    "/questoes/:questaoId",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Questões"],
        summary: "Atualizar questão",
        description:
          "Atualiza os dados de uma questão existente. O body segue o mesmo contrato da criação. Permite alterar tipo, enunciado, alternativas e demais campos. Atende RF003/RF004/RF005.",
        params: questaoParamsSchema,
        body: updateQuestaoBodySchema,
        response: {
          200: successResponseSchema(questaoResponseSchema),
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.atualizar,
  );

  app.withTypeProvider().delete(
    "/questoes/:questaoId",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Questões"],
        summary: "Remover ou desativar questão",
        description:
          "Remove permanentemente uma questão que não esteja vinculada a nenhuma prova. Caso a questão já esteja associada a uma prova, realiza soft delete (ativa = false) para preservar a integridade dos dados. Atende RF003.",
        params: questaoParamsSchema,
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
