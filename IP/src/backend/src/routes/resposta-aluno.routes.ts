import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { RespostaAlunoController } from "../controllers/resposta-aluno.controller.js";
import { errorResponseSchema, successResponseSchema } from "../schemas/common.schema.js";
import {
  enviarProvaBodySchema,
  envioFinalSchema,
  provaAlunoParamsSchema,
  respostaAlunoParamsSchema,
  respostaAlunoSchema,
  respostaSalvaSchema,
  salvarRespostaBodySchema,
} from "../schemas/resposta-aluno.schema.js";

export async function respostaAlunoRoutes(app: FastifyInstance) {
  const controller = new RespostaAlunoController();

  app.withTypeProvider().put(
    "/public/provas-aluno/:provaAlunoId/respostas/:questaoId",
    {
      schema: {
        tags: ["Respostas"],
        summary: "Salvar ou atualizar resposta do aluno",
        description:
          "Salva ou atualiza a resposta de um aluno para uma questão específica durante a realização da prova. Para questões objetivas, informe o alternativaId. Para discursivas, informe o respostaTexto. O campo rascunho=true indica que é um salvamento parcial. A prova deve estar em andamento. Atende RF011/RF026/RN10/RN12.",
        params: respostaAlunoParamsSchema,
        body: salvarRespostaBodySchema,
        response: {
          200: successResponseSchema(respostaSalvaSchema),
          404: errorResponseSchema,
          409: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.salvar,
  );

  app.withTypeProvider().get(
    "/public/provas-aluno/:provaAlunoId/respostas",
    {
      schema: {
        tags: ["Respostas"],
        summary: "Listar respostas salvas do aluno",
        description:
          "Recupera todas as respostas salvas por um aluno durante a realização da prova. Útil para restaurar o estado do rascunho caso o aluno feche o navegador e retorne depois. Atende RF010/RN10.",
        params: provaAlunoParamsSchema,
        response: {
          200: successResponseSchema(z.array(respostaAlunoSchema)),
          404: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.listar,
  );

  app.withTypeProvider().post(
    "/public/provas-aluno/:provaAlunoId/enviar",
    {
      schema: {
        tags: ["Respostas"],
        summary: "Enviar prova final",
        description:
          "Finaliza a submissão da prova pelo aluno. Após o envio, não é mais possível alterar respostas. Retorna um resumo das questões em branco. O campo confirmarEnvio deve ser true. Atende RF026/RN12.",
        params: provaAlunoParamsSchema,
        body: enviarProvaBodySchema,
        response: {
          200: successResponseSchema(envioFinalSchema),
          404: errorResponseSchema,
          409: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.enviar,
  );
}
