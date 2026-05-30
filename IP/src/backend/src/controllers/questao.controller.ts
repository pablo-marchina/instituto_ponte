import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuthenticatedUser, sendCreated, sendSuccess } from "../helpers/http.js";
import { QuestaoService } from "../services/questao.service.js";
import type { CreateQuestaoInput, ListQuestoesQuery, UpdateQuestaoInput } from "../schemas/questao.schema.js";

export class QuestaoController {
  constructor(private readonly questaoService = new QuestaoService()) {}

  criar = async (request: FastifyRequest, reply: FastifyReply) => {
    return sendCreated(
      reply,
      await this.questaoService.criar(request.body as CreateQuestaoInput, getAuthenticatedUser(request)),
    );
  };

  listar = async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as ListQuestoesQuery;
    const result = await this.questaoService.listar(query, getAuthenticatedUser(request));

    return sendSuccess(reply, result.data, {
        page: query.page,
        limit: query.limit,
        total: result.total,
    });
  };

  buscarPorId = async (request: FastifyRequest, reply: FastifyReply) => {
    const { questaoId } = request.params as { questaoId: string };
    return sendSuccess(reply, await this.questaoService.buscarPorId(questaoId, getAuthenticatedUser(request)));
  };

  atualizar = async (request: FastifyRequest, reply: FastifyReply) => {
    const { questaoId } = request.params as { questaoId: string };
    return sendSuccess(
      reply,
      await this.questaoService.atualizar(
        questaoId,
        request.body as UpdateQuestaoInput,
        getAuthenticatedUser(request),
      ),
    );
  };

  remover = async (request: FastifyRequest, reply: FastifyReply) => {
    const { questaoId } = request.params as { questaoId: string };
    await this.questaoService.remover(questaoId, getAuthenticatedUser(request));
    return reply.status(204).send();
  };
}
