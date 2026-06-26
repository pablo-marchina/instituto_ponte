import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const {
  startGoogleLogin,
  logout,
  clearAuthSession,
  clearPendingAuthRole,
  getStoredAuthSession,
  storePendingAuthRole,
} = vi.hoisted(() => ({
  startGoogleLogin: vi.fn(),
  logout: vi.fn(),
  clearAuthSession: vi.fn(),
  clearPendingAuthRole: vi.fn(),
  getStoredAuthSession: vi.fn(),
  storePendingAuthRole: vi.fn(),
}));

vi.mock("../../../src/features/auth/auth.api", () => ({
  startGoogleLogin,
  logout,
}));

vi.mock("../../../src/features/auth/auth.storage", () => ({
  clearAuthSession,
  clearPendingAuthRole,
  getStoredAuthSession,
  storePendingAuthRole,
}));

vi.mock("./components/professor/ProfessorDashboard", () => ({
  ProfessorDashboard: ({ initialTab, onNavigateTab, onLogout }: {
    initialTab: string;
    onNavigateTab: (tab: string) => void;
    onLogout: () => void;
  }) => (
    <div>
      <h1>Professor {initialTab}</h1>
      <button onClick={() => onNavigateTab("provas")}>Ir provas</button>
      <button onClick={onLogout}>Sair</button>
    </div>
  ),
}));

vi.mock("./components/coordenador/CoordenadorDashboard", () => ({
  CoordenadorDashboard: ({ initialTab, onNavigateTab }: {
    initialTab: string;
    onNavigateTab: (tab: string) => void;
  }) => (
    <div>
      <h1>Coordenador {initialTab}</h1>
      <button onClick={() => onNavigateTab("gestao-alunos")}>Ir alunos</button>
    </div>
  ),
}));

function renderApp(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("coordenador/professor app routing", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    startGoogleLogin.mockResolvedValue({ redirectUrl: "https://google.example" });
    logout.mockResolvedValue({ message: "ok" });
    getStoredAuthSession.mockReturnValue(null);
  });

  it("renderiza login e inicia OAuth guardando papel selecionado", async () => {
    const user = userEvent.setup();
    startGoogleLogin.mockReturnValue(new Promise(() => undefined));
    renderApp("/login");

    await user.click(screen.getByRole("button", { name: "Coordenador" }));
    await user.click(screen.getByRole("button", { name: /Entrar com Google/i }));

    await waitFor(() => expect(startGoogleLogin).toHaveBeenCalledTimes(1));
    expect(storePendingAuthRole).toHaveBeenCalledWith("coordenador");
  });

  it("renderiza cadastro pela rota dedicada", () => {
    renderApp("/cadastro");

    expect(screen.getByText("Cadastro interno")).toBeInTheDocument();
  });

  it("redireciona rota protegida sem sessao para login", () => {
    renderApp("/professor/painel");

    expect(screen.getByText("Acesso interno")).toBeInTheDocument();
  });

  it("renderiza dashboard professor com sessao e executa logout", async () => {
    const user = userEvent.setup();
    getStoredAuthSession.mockReturnValue({
      accessToken: "token-1",
      usuario: { perfil: "professor" },
    });

    renderApp("/professor/provas");

    expect(screen.getByText("Professor provas")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sair" }));

    expect(clearAuthSession).toHaveBeenCalledTimes(1);
    expect(clearPendingAuthRole).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(logout).toHaveBeenCalledWith("token-1"));
  });

  it("renderiza dashboard coordenador com fallback de aba invalida", () => {
    getStoredAuthSession.mockReturnValue({
      accessToken: "token-1",
      usuario: { perfil: "coordenador" },
    });

    renderApp("/coordenador/aba-invalida");

    expect(screen.getByText("Coordenador painel")).toBeInTheDocument();
  });
});
