import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuthenticatedUser, sendCreated, sendSuccess } from "../helpers/http.js";
import { ProvaQuestaoService } from "../services/prova-questao.service.js";
import type { AddQuestaoProvaInput } from "../schemas/prova-questao.schema.js";

export class ProvaQuestaoController {
  constructor(private readonly provaQuestaoService = new ProvaQuestaoService()) {}

  adicionar = async (request: FastifyRequest, reply: FastifyReply) => {
    const { provaId } = request.params as { provaId: string };
    return sendCreated(
      reply,
      await this.provaQuestaoService.adicionar(
        provaId,
        request.body as AddQuestaoProvaInput,
        getAuthenticatedUser(request),
      ),
    );
  };

  listar = async (request: FastifyRequest, reply: FastifyReply) => {
    const { provaId } = request.params as { provaId: string };
    return sendSuccess(reply, await this.provaQuestaoService.listar(provaId, getAuthenticatedUser(request)));
  };

  remover = async (request: FastifyRequest, reply: FastifyReply) => {
    const { provaId, questaoId } = request.params as { provaId: string; questaoId: string };
    await this.provaQuestaoService.remover(provaId, questaoId, getAuthenticatedUser(request));
    return reply.status(204).send();
  };
}
