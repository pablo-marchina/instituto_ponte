import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuthenticatedUser, sendCreated, sendSuccess } from "../helpers/http.js";
import { ProvaService } from "../services/prova.service.js";
import type {
  CreateProvaInput,
  ListProvasQuery,
  PublicarProvaInput,
  UpdateProvaConfiguracoesInput,
  UpdateProvaInput,
} from "../schemas/prova.schema.js";

export class ProvaController {
  constructor(private readonly provaService = new ProvaService()) {}

  create = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as CreateProvaInput;
    const prova = await this.provaService.create(body, getAuthenticatedUser(request));
    return sendCreated(reply, prova);
  };

  listar = async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as ListProvasQuery;
    const result = await this.provaService.listar(query, getAuthenticatedUser(request));
    return sendSuccess(reply, result.data, {
        page: query.page,
        limit: query.limit,
        total: result.total,
    });
  };

  buscarPorId = async (request: FastifyRequest, reply: FastifyReply) => {
    const { provaId } = request.params as { provaId: string };
    return sendSuccess(reply, await this.provaService.buscarPorId(provaId, getAuthenticatedUser(request)));
  };

  atualizar = async (request: FastifyRequest, reply: FastifyReply) => {
    const { provaId } = request.params as { provaId: string };
    return sendSuccess(
      reply,
      await this.provaService.atualizar(provaId, request.body as UpdateProvaInput, getAuthenticatedUser(request)),
    );
  };

  atualizarConfiguracoes = async (request: FastifyRequest, reply: FastifyReply) => {
    const { provaId } = request.params as { provaId: string };
    return sendSuccess(
      reply,
      await this.provaService.atualizarConfiguracoes(
        provaId,
        request.body as UpdateProvaConfiguracoesInput,
        getAuthenticatedUser(request),
      ),
    );
  };

  publicar = async (request: FastifyRequest, reply: FastifyReply) => {
    const { provaId } = request.params as { provaId: string };
    return sendSuccess(
      reply,
      await this.provaService.publicar(provaId, request.body as PublicarProvaInput, getAuthenticatedUser(request)),
    );
  };

  encerrar = async (request: FastifyRequest, reply: FastifyReply) => {
    const { provaId } = request.params as { provaId: string };
    return sendSuccess(reply, await this.provaService.encerrar(provaId, getAuthenticatedUser(request)));
  };

  arquivar = async (request: FastifyRequest, reply: FastifyReply) => {
    const { provaId } = request.params as { provaId: string };
    return sendSuccess(reply, await this.provaService.arquivar(provaId, getAuthenticatedUser(request)));
  };

  remover = async (request: FastifyRequest, reply: FastifyReply) => {
    const { provaId } = request.params as { provaId: string };
    await this.provaService.remover(provaId, getAuthenticatedUser(request));
    return reply.status(204).send();
  };

  listarHistorico = async (request: FastifyRequest, reply: FastifyReply) => {
    const { provaId } = request.params as { provaId: string };
    return sendSuccess(reply, await this.provaService.listarHistorico(provaId, getAuthenticatedUser(request)));
  };
}
