import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuthenticatedUser, sendCreated, sendSuccess } from "../helpers/http.js";
import type { CriarLogInput } from "../schemas/analytics.schema.js";
import { AnalyticsService } from "../services/analytics.service.js";
import { AvaliacaoLogService } from "../services/avaliacao-log.service.js";

export class AnalyticsController {
  constructor(
    private readonly analyticsService = new AnalyticsService(),
    private readonly logService = new AvaliacaoLogService(),
  ) {}

  obterPorProva = async (request: FastifyRequest, reply: FastifyReply) => {
    const { provaId } = request.params as { provaId: string };
    return sendSuccess(reply, await this.analyticsService.obterPorProva(provaId, getAuthenticatedUser(request)));
  };

  registrarLog = async (request: FastifyRequest, reply: FastifyReply) => {
    return sendCreated(reply, await this.logService.registrar(request.body as CriarLogInput));
  };
}
