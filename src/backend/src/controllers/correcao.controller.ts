import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuthenticatedUser, sendSuccess } from "../helpers/http.js";
import type { SalvarCorrecaoInput } from "../schemas/correcao.schema.js";
import { CorrecaoService } from "../services/correcao.service.js";

export class CorrecaoController {
  constructor(private readonly correcaoService = new CorrecaoService()) {}

  listarQuestoes = async (request: FastifyRequest, reply: FastifyReply) => {
    const { provaId } = request.params as { provaId: string };
    return sendSuccess(reply, await this.correcaoService.listarQuestoesDaProva(provaId, getAuthenticatedUser(request)));
  };

  listarRespostasPorQuestao = async (request: FastifyRequest, reply: FastifyReply) => {
    const { provaId, questaoId } = request.params as { provaId: string; questaoId: string };
    return sendSuccess(
      reply,
      await this.correcaoService.listarRespostasPorQuestao(provaId, questaoId, getAuthenticatedUser(request)),
    );
  };

  salvar = async (request: FastifyRequest, reply: FastifyReply) => {
    const { respostaId } = request.params as { respostaId: string };
    return sendSuccess(
      reply,
      await this.correcaoService.salvarCorrecao(
        respostaId,
        request.body as SalvarCorrecaoInput,
        getAuthenticatedUser(request),
      ),
    );
  };

  executarObjetivas = async (request: FastifyRequest, reply: FastifyReply) => {
    const { provaId } = request.params as { provaId: string };
    return sendSuccess(
      reply,
      await this.correcaoService.executarCorrecaoAutomatica(provaId, getAuthenticatedUser(request)),
    );
  };
}
