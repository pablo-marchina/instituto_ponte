import { businessRule, forbidden } from "../errors/api-error.js";
import type { AuthRole, AuthUser } from "../models/auth.model.js";
import { AuthRepository } from "../repositories/auth.repository.js";

const isTestMode = () =>
  process.env.NODE_ENV === "test" || process.env.AUTH_MODE === "test";

const parseAuthRole = (value?: string): AuthRole | undefined =>
  value === "professor" || value === "coordenador" ? value : undefined;

const getGoogleClientId = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (clientId) return clientId;
  if (isTestMode()) return "local-client-id";
  throw businessRule("GOOGLE_CLIENT_ID não configurado.");
};

const getGoogleRedirectUri = () =>
  process.env.GOOGLE_REDIRECT_URI ?? "https://pablo-marchina.github.io/instituto_ponte/auth/callback";

/**
 * Autenticação e gerenciamento de sessão via Google OAuth.
 *
 * O fluxo de produção depende do Supabase Auth (login gerenciado
 * externamente); este serviço apenas valida o token JWT recebido
 * e localiza o usuário nas tabelas locais (professor ou coordenador).
 *
 * Em execução normal, o login Google é feito no frontend com Supabase JS.
 * O backend valida o JWT Supabase nas rotas protegidas. Em modo de teste
 * (NODE_ENV=test ou AUTH_MODE=test), este serviço aceita o email diretamente
 * no parâmetro `code` para manter testes automatizados independentes do Google.
 *
 * O redirect pós-login difere por perfil:
 * - coordenador → /coordenador
 * - professor → /professor
 */
export class AuthService {
  constructor(private readonly authRepository = new AuthRepository()) {}

  /**
   * Monta a URL de redirecionamento para o Google OAuth.
   *
   * @returns URL completa de autorização do Google com parâmetros client_id,
   * redirect_uri, response_type e scope configurados.
   */
  getGoogleRedirectUrl(perfil?: string) {
    const requestedRole = parseAuthRole(perfil);
    const params = new URLSearchParams({
      client_id: getGoogleClientId(),
      redirect_uri: getGoogleRedirectUri(),
      response_type: "code",
      scope: "openid email profile",
    });

    if (requestedRole) {
      params.set("state", requestedRole);
    }

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Processa o callback do Google OAuth.
   *
   * @param code - Código de autorização retornado pelo Google.
   *               Em modo de teste, pode ser diretamente um email.
   * @returns accessToken (token simulado em teste), dados do usuário
   *          e a rota de redirecionamento baseada no perfil.
   * @throws forbidden se o fluxo OAuth for chamado fora do modo de teste
   *                   ou se o email não estiver cadastrado.
   */
  async handleGoogleCallback(code?: string, state?: string): Promise<{
    accessToken: string;
    usuario: AuthUser;
    redirectTo: string;
  }> {
    if (!code) {
      throw businessRule("Callback OAuth sem code.");
    }

    if (!isTestMode()) {
      throw forbidden("O login Google deve ser feito no frontend com Supabase JS.");
    }

    if (!code.includes("@")) {
      throw forbidden("Código OAuth não pode ser validado no ambiente local.");
    }

    const email = code;

    const usuario = await this.authRepository.findUserByEmail(email, parseAuthRole(state));
    if (!usuario) {
      throw forbidden("E-mail não autorizado.");
    }

    return {
      accessToken: `test-${usuario.perfil}:${usuario.id}:${usuario.email}:${usuario.nome}`,
      usuario,
      redirectTo: usuario.perfil === "coordenador" ? "/coordenador" : "/professor",
    };
  }

  /**
   * Retorna os dados do usuário atualmente autenticado.
   *
   * @param user - Objeto do usuário autenticado extraído do token JWT.
   * @returns O mesmo objeto do usuário, sem modificações.
   */
  getCurrentUser(user: AuthUser) {
    return user;
  }

  /**
   * Invalida a sessão no frontend (sem efeito no backend com JWT stateless).
   *
   * @returns Objeto com mensagem de confirmação de sessão encerrada.
   */
  logout() {
    return {
      message: "Sessão encerrada com sucesso.",
    };
  }
}
