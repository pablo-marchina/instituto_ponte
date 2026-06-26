import { getStoredAuthSession } from "./auth.storage";

export function getAuthRequestOptions() {
  const session = getStoredAuthSession();
  if (!session) {
    throw new Error("Sessão não encontrada. Faça login novamente.");
  }

  return {
    token: session.accessToken,
    role: session.usuario.perfil,
  };
}
