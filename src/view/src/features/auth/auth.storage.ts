import type { AuthRole, AuthSession } from "./auth.types";

const AUTH_STORAGE_KEY = "corrije-ai-auth-session";
const PENDING_ROLE_KEY = "corrije-ai-pending-auth-role";

const storage = typeof window !== "undefined" ? window.sessionStorage : null;

export function getStoredAuthSession(): AuthSession | null {
  const raw = storage?.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    storage?.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function storeAuthSession(session: AuthSession) {
  storage?.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession() {
  storage?.removeItem(AUTH_STORAGE_KEY);
}

export function storePendingAuthRole(role: AuthRole) {
  storage?.setItem(PENDING_ROLE_KEY, role);
}

export function getPendingAuthRole(): AuthRole | null {
  const role = storage?.getItem(PENDING_ROLE_KEY);
  return role === "professor" || role === "coordenador" ? role : null;
}

export function clearPendingAuthRole() {
  storage?.removeItem(PENDING_ROLE_KEY);
}
