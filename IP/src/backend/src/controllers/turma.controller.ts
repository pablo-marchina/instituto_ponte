import type { FastifyReply, FastifyRequest } from "fastify";
import { sendCreated, sendSuccess } from "../helpers/http.js";
import type { TurmaInput } from "../schemas/turma.schema.js";
import { TurmaService } from "../services/turma.service.js";

export class TurmaController {
  constructor(private readonly service = new TurmaService()) {}

  listar = async (_request: FastifyRequest, reply: FastifyReply) =>
    sendSuccess(reply, await this.service.listar());

  criar = async (request: FastifyRequest, reply: FastifyReply) =>
    sendCreated(reply, await this.service.criar(request.body as TurmaInput));

  atualizar = async (request: FastifyRequest, reply: FastifyReply) => {
    const { turmaId } = request.params as { turmaId: string };
    return sendSuccess(reply, await this.service.atualizar(turmaId, request.body as TurmaInput));
  };

  remover = async (request: FastifyRequest, reply: FastifyReply) => {
    const { turmaId } = request.params as { turmaId: string };
    await this.service.remover(turmaId);
    return reply.status(204).send();
  };
}
