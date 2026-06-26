import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ProvaController } from "../controllers/prova.controller.js";
import { ProvaQuestaoController } from "../controllers/prova-questao.controller.js";
import { requireRole } from "../middlewares/auth.js";
import { errorResponseSchema, successResponseSchema } from "../schemas/common.schema.js";
import {
  addQuestaoProvaBodySchema,
  provaQuestaoDeleteParamsSchema,
  provaQuestaoParamsSchema,
  provaQuestaoResponseSchema,
  reorderQuestaoProvaBodySchema,
} from "../schemas/prova-questao.schema.js";
import {
  createProvaBodySchema,
  listProvasQuerySchema,
  publicarProvaBodySchema,
  provaConfiguracoesSchema,
  provaDetailSchema,
  provaHistoricoSchema,
  provaParamsSchema,
  provaSchema,
  updateProvaConfiguracoesBodySchema,
  updateProvaBodySchema,
} from "../schemas/prova.schema.js";

export async function provaRoutes(app: FastifyInstance) {
  const controller = new ProvaController();
  const provaQuestaoController = new ProvaQuestaoController();

  app.withTypeProvider().post(
    "/provas",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Provas"],
        summary: "Criar prova em rascunho",
        description:
          "Cria uma nova prova no estado 'rascunho'. Apenas professores autenticados e vinculados à matéria informada podem executar esta ação. A prova criada ainda não fica disponível para alunos até ser publicada. Atende RF001/RF021/RN18.",
        body: createProvaBodySchema,
        response: {
          201: successResponseSchema(provaSchema),
          401: errorResponseSchema,
          403: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.create,
  );

  app.withTypeProvider().get(
    "/provas",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Provas"],
        summary: "Listar provas",
        description:
          "Lista as provas disponíveis para o usuário autenticado. Professores visualizam apenas suas próprias provas e provas de matérias às quais estão vinculados. Coordenadores visualizam todas as provas. Suporta filtros combinados por status, turma, semestre, matéria e professor. Atende RF001/RN01/RN02.",
        querystring: listProvasQuerySchema,
        response: {
          200: successResponseSchema(z.array(provaSchema)),
          401: errorResponseSchema,
          403: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.listar,
  );

  app.withTypeProvider().get(
    "/provas/:provaId",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Provas"],
        summary: "Detalhar prova",
        description:
          "Retorna os detalhes completos de uma prova específica, incluindo configurações de tempo, datas, embaralhamento e lista de questões. Apenas professores vinculados ou coordenadores podem acessar. Atende RF001/RN01.",
        params: provaParamsSchema,
        response: {
          200: successResponseSchema(provaDetailSchema),
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
    "/provas/:provaId",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Provas"],
        summary: "Atualizar metadados da prova",
        description:
          "Atualiza os metadados de uma prova existente. Apenas provas em estado 'rascunho' podem ser editadas. Provas 'encerrada' ou 'antiga' retornam erro 409. Atende RF021/RN18.",
        params: provaParamsSchema,
        body: updateProvaBodySchema,
        response: {
          200: successResponseSchema(provaSchema),
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
    "/provas/:provaId",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Provas"],
        summary: "Excluir prova",
        description:
          "Remove permanentemente uma prova em estado 'rascunho'. Não é possível excluir provas que já possuem submissões de alunos — nesse caso retorna 409. Atende RF021/RN18.",
        params: provaParamsSchema,
        response: {
          204: z.null(),
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.remover,
  );

  app.withTypeProvider().get(
    "/provas/:provaId/status-historico",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Provas"],
        summary: "Histórico de status da prova",
        description:
          "Retorna o histórico de mudanças de status de uma prova (rascunho → publicada → encerrada → antiga). Útil para auditoria e rastreamento do ciclo de vida da avaliação. Atende RF001/RN01.",
        params: provaParamsSchema,
        response: {
          200: successResponseSchema(z.array(provaHistoricoSchema)),
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.listarHistorico,
  );

  app.withTypeProvider().patch(
    "/provas/:provaId/configuracoes",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Provas"],
        summary: "Atualizar configurações da prova",
        description:
          "Define ou atualiza as configurações de aplicação de uma prova: tempo limite, data de início, data de fim e flags de embaralhamento de questões/alternativas. A data de fim deve ser posterior à data de início. Atende RF007/RF023/RN05/RN06.",
        params: provaParamsSchema,
        body: updateProvaConfiguracoesBodySchema,
        response: {
          200: successResponseSchema(provaConfiguracoesSchema),
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.atualizarConfiguracoes,
  );

  app.withTypeProvider().post(
    "/provas/:provaId/publicar",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Publicação"],
        summary: "Publicar prova",
        description:
          "Publica uma prova, alterando seu status de 'rascunho' para 'publicada'. A prova deve ter pelo menos uma questão, todas as questões devem ter enunciado válido, questões objetivas precisam de gabarito, e as configurações de data devem estar definidas. Gera URL única de acesso e payload de QR Code. Atende RF008/RF001/RN07.",
        params: provaParamsSchema,
        body: publicarProvaBodySchema,
        response: {
          200: successResponseSchema(provaSchema),
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.publicar,
  );

  app.withTypeProvider().post(
    "/provas/:provaId/despublicar",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Publicacao"],
        summary: "Tirar prova da publicacao",
        description:
          "Remove o link publico de uma prova publicada e retorna a prova para rascunho. A operacao e bloqueada quando ja existem tentativas ou submissoes de alunos.",
        params: provaParamsSchema,
        response: {
          200: successResponseSchema(provaSchema),
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.despublicar,
  );

  app.withTypeProvider().post(
    "/provas/:provaId/encerrar",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Provas"],
        summary: "Encerrar prova",
        description:
          "Encerra uma prova publicada, alterando seu status para 'encerrada'. Alunos não conseguem mais acessar ou responder uma prova encerrada. Professores e coordenadores podem executar esta ação. Atende RF001/RF007/RN01/RN05.",
        params: provaParamsSchema,
        response: {
          200: successResponseSchema(provaSchema),
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.encerrar,
  );

  app.withTypeProvider().post(
    "/provas/:provaId/arquivar",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Provas"],
        summary: "Arquivar prova como antiga",
        description:
          "Arquiva uma prova encerrada, alterando seu status para 'antiga'. Provas antigas são mantidas para consulta histórica, mas não podem mais ser editadas ou reativadas. Atende RF001/RN01.",
        params: provaParamsSchema,
        response: {
          200: successResponseSchema(provaSchema),
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.arquivar,
  );

  app.withTypeProvider().post(
    "/provas/:provaId/questoes",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Questões"],
        summary: "Adicionar questão à prova",
        description:
          "Adiciona uma questão existente do banco de questões a uma prova. A prova deve estar em estado 'rascunho', a questão deve pertencer à mesma matéria da prova, e a ordem não pode duplicar dentro da mesma prova. Atende RF003/RF004/RF005/RF006/RN03/RN04/RN20.",
        params: provaQuestaoParamsSchema,
        body: addQuestaoProvaBodySchema,
        response: {
          201: successResponseSchema(provaQuestaoResponseSchema),
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    provaQuestaoController.adicionar,
  );

  app.withTypeProvider().get(
    "/provas/:provaId/questoes",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Questões"],
        summary: "Listar questões da prova",
        description:
          "Lista todas as questões associadas a uma prova específica, com seus respectivos enunciados, alternativas e pontuação máxima. Atende RF003/RF004/RF005.",
        params: provaQuestaoParamsSchema,
        response: {
          200: successResponseSchema(z.array(provaQuestaoResponseSchema)),
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    provaQuestaoController.listar,
  );

  app.withTypeProvider().delete(
    "/provas/:provaId/questoes/:questaoId",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Questões"],
        summary: "Remover questão da prova",
        description:
          "Remove uma questão de uma prova em estado 'rascunho'. A questão permanece no banco de questões, apenas o vínculo com a prova é removido. Atende RF003.",
        params: provaQuestaoDeleteParamsSchema,
        response: {
          204: z.null(),
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    provaQuestaoController.remover,
  );

  app.withTypeProvider().patch(
    "/provas/:provaId/questoes/:questaoId/ordem",
    {
      preHandler: requireRole("professor", "coordenador"),
      schema: {
        tags: ["Questoes"],
        summary: "Reordenar questao da prova",
        description:
          "Move uma questao dentro da prova e recompata a ordem das demais questoes. A prova deve estar em rascunho.",
        params: provaQuestaoDeleteParamsSchema,
        body: reorderQuestaoProvaBodySchema,
        response: {
          200: successResponseSchema(z.array(provaQuestaoResponseSchema)),
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    provaQuestaoController.reordenar,
  );
}
