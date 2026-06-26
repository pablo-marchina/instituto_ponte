import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { CorrecaoController } from "../controllers/correcao.controller.js";
import { requireRole } from "../middlewares/auth.js";
import {
  correcaoProvaParamsSchema,
  correcaoAutomaticaSchema,
  correcaoQuestaoSchema,
  correcaoRespostaParamsSchema,
  correcaoRespostaSchema,
  correcaoRespostasParamsSchema,
  correcaoSalvaSchema,
  salvarCorrecaoBodySchema,
} from "../schemas/correcao.schema.js";
import { errorResponseSchema, successResponseSchema } from "../schemas/common.schema.js";

export async function correcaoRoutes(app: FastifyInstance) {
  const controller = new CorrecaoController();

  app.withTypeProvider().get(
    "/provas/:provaId/correcao/questoes",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Correção"],
        summary: "Listar questões para correção",
        description:
          "Lista as questões de uma prova que possuem respostas de alunos para correção. Cada item retorna a quantidade total de respostas e quantas já foram corrigidas. Apenas professores vinculados ou coordenadores podem acessar. Atende RF014/RN13.",
        params: correcaoProvaParamsSchema,
        response: {
          200: successResponseSchema(z.array(correcaoQuestaoSchema)),
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.listarQuestoes,
  );

  app.withTypeProvider().post(
    "/provas/:provaId/correcao/objetivas",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Correção"],
        summary: "Executar correção automática de objetivas",
        description:
          "Executa a correção automática das questões objetivas (múltipla escolha e verdadeiro/falso) de uma prova. Discursivas permanecem pendentes para correção manual. Permite recálculo antes da liberação dos resultados. Professores vinculados e coordenadores podem executar. Atende RF013/RN14.",
        params: correcaoProvaParamsSchema,
        response: {
          200: successResponseSchema(correcaoAutomaticaSchema),
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.executarObjetivas,
  );

  app.withTypeProvider().get(
    "/provas/:provaId/questoes/:questaoId/respostas",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Correção"],
        summary: "Listar respostas de uma questão para correção",
        description:
          "Lista todas as respostas dos alunos para uma questão específica, incluindo anexos enviados e correção já existente (se houver). Útil para o professor corrigir manualmente cada resposta. Atende RF014/RF016/RN13.",
        params: correcaoRespostasParamsSchema,
        response: {
          200: successResponseSchema(z.array(correcaoRespostaSchema)),
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.listarRespostasPorQuestao,
  );

  app.withTypeProvider().put(
    "/respostas/:respostaId/correcao",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Correção"],
        summary: "Corrigir resposta manualmente",
        description:
          "Salva a correção manual de uma resposta do aluno. A nota deve ser maior ou igual a zero e não pode ultrapassar a pontuação máxima da questão. O professor deve estar vinculado à prova ou matéria. Atende RF015/RN13.",
        params: correcaoRespostaParamsSchema,
        body: salvarCorrecaoBodySchema,
        response: {
          200: successResponseSchema(correcaoSalvaSchema),
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.salvar,
  );
}
