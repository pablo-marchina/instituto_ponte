import type { FastifyInstance } from "fastify";
import { AlunoPortalController } from "../controllers/aluno-portal.controller.js";
import {
  alunoPortalParamsSchema,
  iniciarProvaBodySchema,
  provaIniciadaSchema,
  provaPublicaSchema,
} from "../schemas/aluno-portal.schema.js";
import { errorResponseSchema, successResponseSchema } from "../schemas/common.schema.js";

export async function alunoPortalRoutes(app: FastifyInstance) {
  const controller = new AlunoPortalController();

  app.withTypeProvider().get(
    "/public/provas/:urlAcesso",
    {
      schema: {
        tags: ["Portal do Aluno"],
        summary: "Obter informações públicas da prova",
        description:
          "Endpoint público que retorna as informações básicas de uma prova a partir da URL de acesso gerada na publicação. O aluno pode visualizar título, instruções, tempo limite e período de realização antes de iniciar. Retorna 404 se o link for inválido e 409 se a prova estiver fora do período. Atende RF009/RF024/RF025/RN08/RN09.",
        params: alunoPortalParamsSchema,
        response: {
          200: successResponseSchema(provaPublicaSchema),
          404: errorResponseSchema,
          409: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.obterProvaPublica,
  );

  app.withTypeProvider().post(
    "/public/provas/:urlAcesso/iniciar",
    {
      schema: {
        tags: ["Portal do Aluno"],
        summary: "Iniciar prova pelo aluno",
        description:
          "Endpoint público que permite ao aluno iniciar uma prova. O aluno se identifica com nome, e-mail e CPF (11 dígitos), e deve aceitar os termos de uso. O sistema cria ou recupera o cadastro do aluno e retorna as questões da prova. Não permite múltiplas submissões para a mesma prova (retorna 409). Atende RF009/RN08.",
        params: alunoPortalParamsSchema,
        body: iniciarProvaBodySchema,
        response: {
          201: successResponseSchema(provaIniciadaSchema),
          404: errorResponseSchema,
          409: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.iniciarProva,
  );
}
