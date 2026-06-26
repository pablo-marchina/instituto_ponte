import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuthenticatedUser, sendCreated, sendSuccess } from "../helpers/http.js";
import { MateriaService } from "../services/materia.service.js";
import type { CreateMateriaInput, UpdateMateriaInput } from "../schemas/materia.schema.js";

export class MateriaController {
  constructor(private readonly materiaService = new MateriaService()) {}

  criar = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as CreateMateriaInput;
    return sendCreated(
      reply,
      await this.materiaService.criar(body, getAuthenticatedUser(request)),
    );
  };

  listar = async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as { page?: number; limit?: number };
    const result = await this.materiaService.listar(query, getAuthenticatedUser(request));
    return sendSuccess(reply, result.data, { page: query.page ?? 1, limit: query.limit ?? 20, total: result.total });
  };

  buscarPorId = async (request: FastifyRequest, reply: FastifyReply) => {
    const { materiaId } = request.params as { materiaId: string };
    return sendSuccess(reply, await this.materiaService.buscarPorId(materiaId, getAuthenticatedUser(request)));
  };

  atualizar = async (request: FastifyRequest, reply: FastifyReply) => {
    const { materiaId } = request.params as { materiaId: string };
    const body = request.body as UpdateMateriaInput;
    return sendSuccess(
      reply,
      await this.materiaService.atualizar(materiaId, body, getAuthenticatedUser(request)),
    );
  };

  remover = async (request: FastifyRequest, reply: FastifyReply) => {
    const { materiaId } = request.params as { materiaId: string };
    await this.materiaService.remover(materiaId, getAuthenticatedUser(request));
    return reply.status(204).send();
  };
}
