import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { AuthController } from "../controllers/auth.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { errorResponseSchema, successResponseSchema } from "../schemas/common.schema.js";

const usuarioSchema = z.object({
  id: z.string().uuid().describe("Identificador único do usuário."),
  nome: z.string().describe("Nome completo do usuário."),
  email: z.string().describe("E-mail do usuário."),
  perfil: z.enum(["professor", "coordenador"]).describe("Perfil de acesso do usuário."),
});

const callbackQuerySchema = z.object({
  code: z.string().describe("Código de autorização retornado pelo Google OAuth."),
  state: z.enum(["professor", "coordenador"]).optional().describe("Perfil escolhido antes do redirecionamento OAuth."),
});

const googleStartQuerySchema = z.object({
  perfil: z.enum(["professor", "coordenador"]).optional().describe("Perfil escolhido para desambiguar o login."),
});

export async function authRoutes(app: FastifyInstance) {
  const controller = new AuthController();

  app.withTypeProvider().get(
    "/auth/google",
    {
      schema: {
        tags: ["Autenticação"],
        summary: "Iniciar autenticação OAuth Google",
        description:
          "Endpoint público que inicia o fluxo de autenticação OAuth com o Google. Retorna a URL de redirecionamento para a página de login do Google. Atende RF002/RN19.",
        querystring: googleStartQuerySchema,
        response: {
          200: successResponseSchema(z.object({ redirectUrl: z.string().url().describe("URL de redirecionamento para o Google OAuth.") })),
        },
      },
    },
    controller.googleStart,
  );

  app.withTypeProvider().get(
    "/auth/google/callback",
    {
      schema: {
        tags: ["Autenticação"],
        summary: "Callback OAuth Google",
        description:
          "Endpoint público que recebe o callback do Google após autenticação. Valida o código recebido, verifica se o e-mail pertence a um professor ou coordenador cadastrado e retorna um token de acesso. Atende RF002/RN19.",
        querystring: callbackQuerySchema,
        response: {
          200: successResponseSchema(
            z.object({
              accessToken: z.string().describe("Token de acesso JWT para autenticação nas rotas protegidas."),
              usuario: usuarioSchema,
              redirectTo: z.string().describe("Caminho de redirecionamento baseado no perfil do usuário."),
            }),
          ),
          403: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.googleCallback,
  );

  app.withTypeProvider().get(
    "/auth/me",
    {
      preHandler: requireAuth,
      schema: {
        tags: ["Autenticação"],
        summary: "Consultar usuário autenticado",
        description:
          "Retorna os dados do usuário atualmente autenticado (id, nome, e-mail e perfil). Requer token de acesso válido no header Authorization. Atende RF002/RN18/RN19.",
        response: {
          200: successResponseSchema(usuarioSchema),
          401: errorResponseSchema,
        },
      },
    },
    controller.me,
  );

  app.withTypeProvider().post(
    "/auth/logout",
    {
      preHandler: requireAuth,
      schema: {
        tags: ["Autenticação"],
        summary: "Encerrar sessão",
        description:
          "Encerra a sessão do usuário autenticado, invalidando o token atual. Requer token de acesso válido no header Authorization. Atende RF002/RN19.",
        response: {
          200: successResponseSchema(z.object({ message: z.string().describe("Mensagem de confirmação de sessão encerrada.") })),
          401: errorResponseSchema,
        },
      },
    },
    controller.logout,
  );
}
