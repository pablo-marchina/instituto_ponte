import { beforeEach, describe, expect, it } from "vitest";
import {
  clearAuthSession,
  clearPendingAuthRole,
  getPendingAuthRole,
  getStoredAuthSession,
  storeAuthSession,
  storePendingAuthRole,
} from "./auth.storage";

describe("auth.storage", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("persiste, le e limpa sessao autenticada", () => {
    const session = {
      accessToken: "token",
      usuario: { id: "u1", nome: "User", email: "u@example.com", perfil: "professor" as const },
    };

    storeAuthSession(session);
    expect(getStoredAuthSession()).toEqual(session);

    clearAuthSession();
    expect(getStoredAuthSession()).toBeNull();
  });

  it("remove sessao corrompida ao tentar ler", () => {
    sessionStorage.setItem("corrije-ai-auth-session", "{invalid");

    expect(getStoredAuthSession()).toBeNull();
    expect(sessionStorage.getItem("corrije-ai-auth-session")).toBeNull();
  });

  it("aceita somente papeis pendentes conhecidos", () => {
    storePendingAuthRole("coordenador");
    expect(getPendingAuthRole()).toBe("coordenador");

    sessionStorage.setItem("corrije-ai-pending-auth-role", "aluno");
    expect(getPendingAuthRole()).toBeNull();

    storePendingAuthRole("professor");
    clearPendingAuthRole();
    expect(getPendingAuthRole()).toBeNull();
  });
});
