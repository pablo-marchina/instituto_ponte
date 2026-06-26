import type { FastifyReply, FastifyRequest } from "fastify";
import { sendCreated, sendSuccess } from "../helpers/http.js";
import type { IniciarProvaInput } from "../schemas/aluno-portal.schema.js";
import { AlunoPortalService } from "../services/aluno-portal.service.js";

export class AlunoPortalController {
  constructor(private readonly alunoPortalService = new AlunoPortalService()) {}

  obterProvaPublica = async (request: FastifyRequest, reply: FastifyReply) => {
    const { urlAcesso } = request.params as { urlAcesso: string };
    return sendSuccess(reply, await this.alunoPortalService.obterProvaPublica(urlAcesso));
  };

  iniciarProva = async (request: FastifyRequest, reply: FastifyReply) => {
    const { urlAcesso } = request.params as { urlAcesso: string };
    return sendCreated(reply, await this.alunoPortalService.iniciarProva(urlAcesso, request.body as IniciarProvaInput));
  };
}
