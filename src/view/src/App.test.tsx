import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const {
  clearAuthSession,
  clearPendingAuthRole,
  finishGoogleLogin,
  getPendingAuthRole,
  listenerRef,
  storeAuthSession,
  toastError,
} = vi.hoisted(() => ({
  clearAuthSession: vi.fn(),
  clearPendingAuthRole: vi.fn(),
  finishGoogleLogin: vi.fn(),
  getPendingAuthRole: vi.fn(),
  listenerRef: { current: undefined as undefined | (() => void) },
  storeAuthSession: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("./modules/AlunoModule", () => ({
  AlunoModule: () => <main>Modulo aluno carregado</main>,
}));

vi.mock("./modules/CoordenadorProfessorModule", () => ({
  CoordenadorProfessorModule: () => <main>Modulo interno carregado</main>,
}));

vi.mock("./components/ui/sonner", () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

vi.mock("sonner", () => ({
  toast: {
    error: toastError,
  },
}));

vi.mock("./features/auth/auth.api", () => ({
  finishGoogleLogin,
}));

vi.mock("./features/auth/auth.events", () => ({
  listenSessionExpired: (listener: () => void) => {
    listenerRef.current = listener;
    return () => {
      listenerRef.current = undefined;
    };
  },
}));

vi.mock("./features/auth/auth.storage", () => ({
  clearAuthSession,
  clearPendingAuthRole,
  getPendingAuthRole,
  storeAuthSession,
}));

function setPath(path: string) {
  window.history.pushState({}, "", path);
}

describe("root App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listenerRef.current = undefined;
    getPendingAuthRole.mockReturnValue("professor");
    finishGoogleLogin.mockResolvedValue({
      accessToken: "token-1",
      redirectTo: "/professor",
      usuario: { id: "user-1", perfil: "professor" },
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("roteia modulo do aluno", async () => {
    setPath("/aluno/prova/link-publico");

    render(<App />);

    expect(await screen.findByText("Modulo aluno carregado")).toBeInTheDocument();
    expect(screen.getByTestId("toaster")).toBeInTheDocument();
  });

  it("roteia modulo interno por padrao", async () => {
    setPath("/login");

    render(<App />);

    expect(await screen.findByText("Modulo interno carregado")).toBeInTheDocument();
  });

  it("finaliza callback OAuth e redireciona para painel", async () => {
    setPath("/auth/callback?code=abc");

    render(<App />);

    expect(screen.getByText("Finalizando login")).toBeInTheDocument();
    await waitFor(() => expect(finishGoogleLogin).toHaveBeenCalledWith("professor"));
    expect(storeAuthSession).toHaveBeenCalledWith({
      accessToken: "token-1",
      usuario: { id: "user-1", perfil: "professor" },
    });
    expect(clearPendingAuthRole).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(window.location.pathname).toBe("/professor/painel"));
  });

  it("mostra erro recebido do provedor no callback", async () => {
    setPath("/auth/callback?error_description=Acesso%20negado");

    render(<App />);

    expect(await screen.findByText("Login não concluído")).toBeInTheDocument();
    expect(screen.getByText("Acesso negado")).toBeInTheDocument();
    expect(finishGoogleLogin).not.toHaveBeenCalled();
  });

  it("mostra erro quando callback OAuth falha no backend", async () => {
    finishGoogleLogin.mockRejectedValueOnce(new Error("Usuario sem perfil"));
    setPath("/auth/callback?code=abc");

    render(<App />);

    expect(await screen.findByRole("heading", { name: /autenticar/i })).toBeInTheDocument();
    expect(screen.getByText("Usuario sem perfil")).toBeInTheDocument();
  });

  it("limpa sessao e navega ao expirar autenticacao", async () => {
    setPath("/login");
    render(<App />);

    await screen.findByText("Modulo interno carregado");
    act(() => {
      listenerRef.current?.();
    });

    expect(clearAuthSession).toHaveBeenCalledTimes(1);
    expect(clearPendingAuthRole).toHaveBeenCalledTimes(1);
    expect(toastError).toHaveBeenCalledWith("Sua sessão expirou. Faça login novamente.");
    expect(window.location.pathname).toBe("/login");
  });
});
