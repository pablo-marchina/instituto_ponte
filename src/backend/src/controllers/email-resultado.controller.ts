import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuthenticatedUser, sendSuccess } from "../helpers/http.js";
import type { LiberarEmailInput } from "../schemas/email.schema.js";
import { EmailResultadoService } from "../services/email-resultado.service.js";

export class EmailResultadoController {
  constructor(private readonly emailService = new EmailResultadoService()) {}

  liberar = async (request: FastifyRequest, reply: FastifyReply) => {
    const { provaId } = request.params as { provaId: string };
    return sendSuccess(
      reply,
      await this.emailService.liberar(provaId, request.body as LiberarEmailInput, getAuthenticatedUser(request)),
    );
  };

  listarEnvios = async (request: FastifyRequest, reply: FastifyReply) => {
    const { provaId } = request.params as { provaId: string };
    return sendSuccess(reply, await this.emailService.listarEnvios(provaId, getAuthenticatedUser(request)));
  };

  reenviar = async (request: FastifyRequest, reply: FastifyReply) => {
    const { emailEnvioId } = request.params as { emailEnvioId: string };
    return sendSuccess(reply, await this.emailService.reenviar(emailEnvioId, getAuthenticatedUser(request)));
  };
}
