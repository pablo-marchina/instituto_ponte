import { apiRequest } from "../../lib/apiClient";
import { appAbsoluteUrl } from "../../lib/routing";
import { getSupabaseClient } from "../../lib/supabaseClient";
import type { AuthRole, AuthUser, GoogleCallbackResult } from "./auth.types";

type GoogleStartResult = {
  redirectUrl: string;
};

export async function startGoogleLogin() {
  const supabase = getSupabaseClient();
  const redirectTo = appAbsoluteUrl("/auth/callback");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    throw error;
  }

  if (!data.url) {
    throw new Error("Supabase não retornou a URL de login do Google.");
  }

  return {
    redirectUrl: data.url,
  } satisfies GoogleStartResult;
}

export async function finishGoogleLogin(role?: AuthRole) {
  const supabase = getSupabaseClient();
  const code = new URLSearchParams(window.location.search).get("code");

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      throw error;
    }
  }

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  const accessToken = data.session?.access_token;
  if (!accessToken) {
    throw new Error("Supabase não retornou um token de acesso.");
  }

  const usuario = await getCurrentUser(accessToken, role);

  return {
    accessToken,
    usuario,
    redirectTo: usuario.perfil === "coordenador" ? "/coordenador" : "/professor",
  } satisfies GoogleCallbackResult;
}

export function getCurrentUser(accessToken: string, role?: AuthRole | null) {
  return apiRequest<AuthUser>("/auth/me", {
    token: accessToken,
    role: role ?? undefined,
  });
}

export async function logout(accessToken?: string) {
  const supabase = getSupabaseClient();
  await supabase.auth.signOut();

  if (!accessToken) {
    return { message: "Sessão encerrada com sucesso." };
  }

  return apiRequest<{ message: string }>("/auth/logout", {
    method: "POST",
    token: accessToken,
  });
}
