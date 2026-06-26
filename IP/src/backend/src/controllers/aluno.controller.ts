import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuthenticatedUser, sendSuccess } from "../helpers/http.js";
import type { UpdateAlunoInput } from "../schemas/aluno.schema.js";
import { AlunoService } from "../services/aluno.service.js";

export class AlunoController {
  constructor(private readonly service = new AlunoService()) {}

  listar = async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as { page: number; limit: number };
    const result = await this.service.listar(query, getAuthenticatedUser(request));
    return sendSuccess(reply, result.data, { page: query.page, limit: query.limit, total: result.total });
  };

  buscarPorId = async (request: FastifyRequest, reply: FastifyReply) => {
    const { alunoId } = request.params as { alunoId: string };
    return sendSuccess(reply, await this.service.buscarPorId(alunoId, getAuthenticatedUser(request)));
  };

  atualizar = async (request: FastifyRequest, reply: FastifyReply) => {
    const { alunoId } = request.params as { alunoId: string };
    return sendSuccess(
      reply,
      await this.service.atualizar(alunoId, request.body as UpdateAlunoInput, getAuthenticatedUser(request)),
    );
  };

  remover = async (request: FastifyRequest, reply: FastifyReply) => {
    const { alunoId } = request.params as { alunoId: string };
    await this.service.remover(alunoId, getAuthenticatedUser(request));
    return reply.status(204).send();
  };
}
