import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuthenticatedUser, sendCreated, sendSuccess } from "../helpers/http.js";
import type { ExportarResultadoInput } from "../schemas/resultado.schema.js";
import { ResultadoService } from "../services/resultado.service.js";

export class ResultadoController {
  constructor(private readonly resultadoService = new ResultadoService()) {}

  listarPorProva = async (request: FastifyRequest, reply: FastifyReply) => {
    const { provaId } = request.params as { provaId: string };
    return sendSuccess(reply, await this.resultadoService.consolidarPorProva(provaId, getAuthenticatedUser(request)));
  };

  exportar = async (request: FastifyRequest, reply: FastifyReply) => {
    const { provaId } = request.params as { provaId: string };
    return sendCreated(
      reply,
      await this.resultadoService.exportarPorProva(
        provaId,
        request.body as ExportarResultadoInput,
        getAuthenticatedUser(request),
      ),
    );
  };
}
