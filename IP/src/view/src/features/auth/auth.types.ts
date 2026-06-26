export type AuthRole = "professor" | "coordenador";

export type AuthUser = {
  id: string;
  nome: string;
  email: string;
  perfil: AuthRole;
};

export type AuthSession = {
  accessToken: string;
  usuario: AuthUser;
};

export type GoogleCallbackResult = AuthSession & {
  redirectTo: string;
};
