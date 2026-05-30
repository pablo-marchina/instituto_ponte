import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuthenticatedUser, sendCreated, sendSuccess } from "../helpers/http.js";
import { ProfessorService } from "../services/professor.service.js";
import type { CreateProfessorInput, UpdateProfessorInput } from "../schemas/professor.schema.js";

export class ProfessorController {
  constructor(private readonly service = new ProfessorService()) {}

  criar = async (request: FastifyRequest, reply: FastifyReply) => {
    return sendCreated(
      reply,
      await this.service.criar(request.body as CreateProfessorInput, getAuthenticatedUser(request)),
    );
  };

  listar = async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as { page?: number; limit?: number };
    const result = await this.service.listar(query, getAuthenticatedUser(request));
    return sendSuccess(reply, result.data, { page: query.page ?? 1, limit: query.limit ?? 20, total: result.total });
  };

  buscarPorId = async (request: FastifyRequest, reply: FastifyReply) => {
    const { professorId } = request.params as { professorId: string };
    return sendSuccess(reply, await this.service.buscarPorId(professorId, getAuthenticatedUser(request)));
  };

  atualizar = async (request: FastifyRequest, reply: FastifyReply) => {
    const { professorId } = request.params as { professorId: string };
    return sendSuccess(
      reply,
      await this.service.atualizar(professorId, request.body as UpdateProfessorInput, getAuthenticatedUser(request)),
    );
  };

  remover = async (request: FastifyRequest, reply: FastifyReply) => {
    const { professorId } = request.params as { professorId: string };
    await this.service.remover(professorId, getAuthenticatedUser(request));
    return reply.status(204).send();
  };

  criarVinculo = async (request: FastifyRequest, reply: FastifyReply) => {
    const { professorId } = request.params as { professorId: string };
    const { materiaId } = request.body as { materiaId: string };
    return sendCreated(
      reply,
      await this.service.criarVinculo(professorId, materiaId, getAuthenticatedUser(request)),
    );
  };

  removerVinculo = async (request: FastifyRequest, reply: FastifyReply) => {
    const { professorId, materiaId } = request.params as { professorId: string; materiaId: string };
    await this.service.removerVinculo(professorId, materiaId, getAuthenticatedUser(request));
    return reply.status(204).send();
  };
}
