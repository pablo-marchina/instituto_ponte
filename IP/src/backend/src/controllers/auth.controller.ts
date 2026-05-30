import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuthenticatedUser, sendSuccess } from "../helpers/http.js";
import { AuthService } from "../services/auth.service.js";

export class AuthController {
  constructor(private readonly authService = new AuthService()) {}

  googleStart = async (_request: FastifyRequest, reply: FastifyReply) => {
    return sendSuccess(reply, {
        redirectUrl: this.authService.getGoogleRedirectUrl(),
    });
  };

  googleCallback = async (
    request: FastifyRequest<{ Querystring: { code?: string } }>,
    reply: FastifyReply,
  ) => {
    return sendSuccess(reply, await this.authService.handleGoogleCallback(request.query.code));
  };

  me = async (request: FastifyRequest, reply: FastifyReply) => {
    return sendSuccess(reply, this.authService.getCurrentUser(getAuthenticatedUser(request)));
  };

  logout = async (_request: FastifyRequest, reply: FastifyReply) => {
    return sendSuccess(reply, this.authService.logout());
  };
}
