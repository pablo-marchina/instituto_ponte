import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuthenticatedUser, sendCreated, sendSuccess } from "../helpers/http.js";
import { TemaService } from "../services/tema.service.js";
import type { CreateTemaInput, ListTemasQuery, UpdateTemaInput } from "../schemas/tema.schema.js";

export class TemaController {
  constructor(private readonly temaService = new TemaService()) {}

  criar = async (request: FastifyRequest, reply: FastifyReply) => {
    return sendCreated(
      reply,
      await this.temaService.criar(request.body as CreateTemaInput, getAuthenticatedUser(request)),
    );
  };

  listar = async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as ListTemasQuery;
    const result = await this.temaService.listar(query, getAuthenticatedUser(request));
    return sendSuccess(reply, result.data, { page: query.page, limit: query.limit, total: result.total });
  };

  buscarPorId = async (request: FastifyRequest, reply: FastifyReply) => {
    const { temaId } = request.params as { temaId: string };
    return sendSuccess(reply, await this.temaService.buscarPorId(temaId, getAuthenticatedUser(request)));
  };

  atualizar = async (request: FastifyRequest, reply: FastifyReply) => {
    const { temaId } = request.params as { temaId: string };
    return sendSuccess(
      reply,
      await this.temaService.atualizar(temaId, request.body as UpdateTemaInput, getAuthenticatedUser(request)),
    );
  };

  remover = async (request: FastifyRequest, reply: FastifyReply) => {
    const { temaId } = request.params as { temaId: string };
    await this.temaService.remover(temaId, getAuthenticatedUser(request));
    return reply.status(204).send();
  };
}
