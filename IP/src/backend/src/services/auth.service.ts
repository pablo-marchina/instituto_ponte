import { businessRule, forbidden } from "../errors/api-error.js";
import type { AuthUser } from "../middlewares/auth.js";
import { AuthRepository } from "../repositories/auth.repository.js";

const isTestMode = () =>
  process.env.NODE_ENV === "test" || process.env.AUTH_MODE === "test";

export class AuthService {
  constructor(private readonly authRepository = new AuthRepository()) {}

  getGoogleRedirectUrl() {
    const clientId = process.env.GOOGLE_CLIENT_ID ?? "local-client-id";
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3333/api/v1/auth/google/callback";
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async handleGoogleCallback(code?: string): Promise<{
    accessToken: string;
    usuario: AuthUser;
    redirectTo: string;
  }> {
    if (!code) {
      throw businessRule("Callback OAuth sem code.");
    }

    if (!isTestMode()) {
      throw forbidden(
        "Fluxo OAuth local não disponível em produção. Use o login via Supabase.",
      );
    }

    const email = code.includes("@") ? code : process.env.MOCK_GOOGLE_EMAIL;
    if (!email) {
      throw forbidden("Código OAuth não pode ser validado no ambiente local.");
    }

    const usuario = await this.authRepository.findUserByEmail(email);
    if (!usuario) {
      throw forbidden("E-mail não autorizado.");
    }

    return {
      accessToken: `test-${usuario.perfil}:${usuario.id}:${usuario.email}:${usuario.nome}`,
      usuario,
      redirectTo: usuario.perfil === "coordenador" ? "/coordenador" : "/professor",
    };
  }

  getCurrentUser(user: AuthUser) {
    return user;
  }

  logout() {
    return {
      message: "Sessão encerrada com sucesso.",
    };
  }
}
