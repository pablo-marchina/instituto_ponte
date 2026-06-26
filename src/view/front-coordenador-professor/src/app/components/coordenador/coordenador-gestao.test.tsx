import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GestaoAlunosPage } from "./GestaoAlunosPage";
import { GestaoProfessoresPage } from "./GestaoProfessoresPage";

const {
  createProfessor,
  deleteAluno,
  deleteProfessor,
  getStoredAuthSession,
  listAlunos,
  listProfessores,
  listProvas,
  toastError,
  toastSuccess,
  useAnalyticsSummary,
} = vi.hoisted(() => ({
  createProfessor: vi.fn(),
  deleteAluno: vi.fn(),
  deleteProfessor: vi.fn(),
  getStoredAuthSession: vi.fn(),
  listAlunos: vi.fn(),
  listProfessores: vi.fn(),
  listProvas: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  useAnalyticsSummary: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: toastError,
    success: toastSuccess,
  },
}));

vi.mock("../../../../../src/features/auth/auth.storage", () => ({
  getStoredAuthSession,
}));

vi.mock("../../../../../src/features/alunos/alunos.api", () => ({
  deleteAluno,
  listAlunos,
}));

vi.mock("../../../../../src/features/professores/professores.api", () => ({
  createProfessor,
  deleteProfessor,
  listProfessores,
}));

vi.mock("../../../../../src/features/provas/provas.api", () => ({
  listProvas,
}));

vi.mock("../../../../../src/features/analytics/useAnalyticsSummary", () => ({
  useAnalyticsSummary,
}));

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>,
  );
}

describe("coordenador gestao pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listProvas.mockResolvedValue({
      data: [{ id: "prova-1", status: "publicada" }],
      meta: { total: 1 },
    });
    useAnalyticsSummary.mockReturnValue({
      analyticsByProvaId: new Map(),
      error: null,
      isError: false,
      isLoading: false,
      summary: {
        acessos: 5,
        envios: 3,
        inicios: 4,
        pendenciasCorrecao: 2,
        totalAlunos: 2,
        totalAnexos: 1,
        totalRespostas: 8,
      },
    });
    getStoredAuthSession.mockReturnValue({
      usuario: { id: "coord-1", perfil: "coordenador" },
      accessToken: "token",
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("carrega gestao de alunos, navega para perfil e confirma remocao", async () => {
    const user = userEvent.setup();
    const onNavigateToProfile = vi.fn();
    listAlunos.mockResolvedValue({
      data: [
        { id: "aluno-1", nome: "Ada Lovelace", email: "ada@example.com", cpf: "12345678901" },
        { id: "aluno-2", nome: "Aluno Pendente", email: "pendente@example.com", cpf: null },
      ],
      meta: { total: 2 },
    });
    deleteAluno.mockResolvedValue(undefined);

    renderWithQuery(<GestaoAlunosPage onNavigateToProfile={onNavigateToProfile} />);

    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText(/CPF: 12345678901/)).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    await user.click(screen.getByText("Ada Lovelace"));
    expect(onNavigateToProfile).toHaveBeenCalledWith("aluno-1");

    await user.click(screen.getAllByTitle("Remover aluno")[0]);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remover aluno" }));

    await waitFor(() => expect(deleteAluno).toHaveBeenCalledWith("aluno-1", expect.anything()));
    expect(toastSuccess).toHaveBeenCalledWith("Aluno removido com sucesso.");
  });

  it("cria professor e mostra erro compreensivel quando exclusao retorna conflito", async () => {
    const user = userEvent.setup();
    const onNavigateToProfile = vi.fn();
    listProfessores.mockResolvedValue({
      data: [
        { id: "prof-1", nome: "Grace Hopper", email: "grace@example.com" },
      ],
      meta: { total: 1 },
    });
    createProfessor.mockResolvedValue({ id: "prof-2", nome: "Novo Professor", email: "novo@example.com" });
    deleteProfessor.mockRejectedValue(new Error("Professor possui provas vinculadas."));

    renderWithQuery(<GestaoProfessoresPage onNavigateToProfile={onNavigateToProfile} />);

    expect(await screen.findByText("Grace Hopper")).toBeInTheDocument();
    await user.click(screen.getByText("Grace Hopper"));
    expect(onNavigateToProfile).toHaveBeenCalledWith("prof-1");

    await user.click(screen.getByRole("button", { name: /novo professor/i }));
    await user.type(screen.getByLabelText(/nome/i), "Novo Professor");
    await user.type(screen.getByLabelText(/email/i), "novo@example.com");
    await user.click(screen.getByRole("button", { name: "SALVAR" }));

    await waitFor(() => expect(createProfessor).toHaveBeenCalledWith(
      {
        coordenadorId: "coord-1",
        email: "novo@example.com",
        nome: "Novo Professor",
      },
      expect.anything(),
    ));

    await user.click(screen.getByTitle("Remover professor"));
    await user.click(screen.getByRole("button", { name: "Remover professor" }));

    await waitFor(() => expect(deleteProfessor).toHaveBeenCalledWith("prof-1", expect.anything()));
    expect(toastError).toHaveBeenCalledWith("Professor possui provas vinculadas.");
  });
});
