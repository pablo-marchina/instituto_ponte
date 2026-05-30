import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuthenticatedUser, sendSuccess } from "../helpers/http.js";
import { AnexoExportarService } from "../services/anexo-exportar.service.js";

export class AnexoExportarController {
  constructor(private readonly service = new AnexoExportarService()) {}

  exportar = async (request: FastifyRequest, reply: FastifyReply) => {
    const { provaId } = request.params as { provaId: string };
    return sendSuccess(reply, await this.service.exportar(provaId, getAuthenticatedUser(request)));
  };
}
