import type { FastifyReply, FastifyRequest } from "fastify";
import { sendSuccess } from "../helpers/http.js";
import { HealthService } from "../services/health.service.js";

export class HealthController {
  constructor(private readonly healthService = new HealthService()) {}

  check = async (_request: FastifyRequest, reply: FastifyReply) => {
    return sendSuccess(reply, this.healthService.check());
  };

  database = async (_request: FastifyRequest, reply: FastifyReply) => {
    return sendSuccess(reply, await this.healthService.database());
  };
}
