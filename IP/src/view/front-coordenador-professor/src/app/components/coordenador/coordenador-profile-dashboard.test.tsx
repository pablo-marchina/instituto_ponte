import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProfessorDashboard } from "../professor/ProfessorDashboard";
import { CoordenadorDashboard } from "./CoordenadorDashboard";
import { PerfilAlunoPage } from "./PerfilAlunoPage";
import { PerfilProfessorPage } from "./PerfilProfessorPage";

const {
  getAluno,
  listAlunos,
  deleteAluno,
  updateAluno,
  createProfessor,
  deleteProfessor,
  getProfessor,
  listProfessores,
  listProfessorMaterias,
  removerProfessorMateria,
  updateProfessor,
  vincularProfessorMateria,
  listMaterias,
  listProvas,
  useDashboard,
  useAnalyticsSummary,
} = vi.hoisted(() => ({
  getAluno: vi.fn(),
  listAlunos: vi.fn(),
  deleteAluno: vi.fn(),
  updateAluno: vi.fn(),
  createProfessor: vi.fn(),
  deleteProfessor: vi.fn(),
  getProfessor: vi.fn(),
  listProfessores: vi.fn(),
  listProfessorMaterias: vi.fn(),
  removerProfessorMateria: vi.fn(),
  updateProfessor: vi.fn(),
  vincularProfessorMateria: vi.fn(),
  listMaterias: vi.fn(),
  listProvas: vi.fn(),
  useDashboard: vi.fn(),
  useAnalyticsSummary: vi.fn(),
}));

vi.mock("../../../../../src/features/alunos/alunos.api", () => ({
  deleteAluno,
  getAluno,
  listAlunos,
  updateAluno,
}));

vi.mock("../../../../../src/features/professores/professores.api", () => ({
  createProfessor,
  deleteProfessor,
  getProfessor,
  listProfessores,
  listProfessorMaterias,
  removerProfessorMateria,
  updateProfessor,
  vincularProfessorMateria,
}));

vi.mock("../../../../../src/features/materias/materias.api", () => ({
  listMaterias,
}));

vi.mock("../../../../../src/features/provas/provas.api", () => ({
  listProvas,
}));

vi.mock("../../../../../src/features/dashboard/useDashboard", () => ({
  useDashboard,
}));

vi.mock("../../../../../src/features/analytics/useAnalyticsSummary", () => ({
  useAnalyticsSummary,
}));

vi.mock("../../../../../src/features/correcao/correcao.api", () => ({
  listarQuestoesCorrecao: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../../../../src/features/temas/temas.api", () => ({
  createTema: vi.fn(),
  listTemas: vi.fn().mockResolvedValue({ data: [] }),
}));

const materia = {
  id: "33333333-3333-4333-8333-333333333333",
  nome: "Matematica",
  codigo: "MAT",
  descricao: null,
  criadoEm: "2026-06-16T00:00:00.000Z",
  atualizadoEm: "2026-06-16T00:00:00.000Z",
};

const exam = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Prova de Calculo",
  modalidade: "Prova",
  discipline: "Matematica",
  subject: "Matematica",
  turma: "3A",
  semester: "1 Semestre 2026",
  badge: "Publicada",
  submissions: "2",
  tempoProva: 60,
  materiaId: materia.id,
};

function wrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function dashboardState(overrides: Record<string, unknown> = {}) {
  const mutation = { isPending: false, isError: false, error: null };
  return {
    materiasQuery: { data: [materia], isError: false, error: null },
    questoesQuery: { isLoading: false, isError: false, error: null },
    bancoQuestoes: [],
    selectedExamId: exam.id,
    provaDetailQuery: { isLoading: false, isError: false, error: null },
    provaQuestoesQuery: { isLoading: false, isError: false, error: null },
    exams: [exam],
    examQuestions: [],
    currentQuestaoId: null,
    setCurrentQuestaoId: vi.fn(),
    selectedExam: exam,
    setSelectedExam: vi.fn(),
    showPublishModal: false,
    setShowPublishModal: vi.fn(),
    showCompletionModal: false,
    setShowCompletionModal: vi.fn(),
    createProvaMutation: mutation,
    updateProvaMutation: mutation,
    publicarProvaMutation: mutation,
    createQuestaoMutation: mutation,
    updateQuestaoMutation: mutation,
    deleteQuestaoMutation: mutation,
    addQuestaoProvaMutation: mutation,
    removeQuestaoProvaMutation: mutation,
    addExam: vi.fn(),
    updateExam: vi.fn(),
    deleteExam: vi.fn(),
    arquivarExam: vi.fn(),
    publishSelectedExam: vi.fn(),
    addQuestions: vi.fn(),
    deleteQuestion: vi.fn(),
    updateQuestion: vi.fn(),
    addBancoQuestion: vi.fn(),
    createQuestionForSelectedExam: vi.fn(),
    updateBancoQuestion: vi.fn(),
    deleteBancoQuestion: vi.fn(),
    addQuestionToExam: vi.fn(),
    ...overrides,
  };
}

describe("coordenador/professor dashboards and profiles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAluno.mockResolvedValue({
      id: "aluno-1",
      nome: "Ada Lovelace",
      email: "ada@example.com",
      cpf: "12345678901",
      aceitouTermosEm: "2026-06-15T00:00:00.000Z",
      criadoEm: "2026-06-10T00:00:00.000Z",
      atualizadoEm: "2026-06-16T00:00:00.000Z",
    });
    listAlunos.mockResolvedValue({
      data: [{
        id: "aluno-1",
        nome: "Ada Lovelace",
        email: "ada@example.com",
        cpf: "12345678901",
        aceitouTermosEm: "2026-06-15T00:00:00.000Z",
        criadoEm: "2026-06-10T00:00:00.000Z",
        atualizadoEm: "2026-06-16T00:00:00.000Z",
      }],
      total: 1,
      page: 1,
      limit: 20,
    });
    deleteAluno.mockResolvedValue(undefined);
    updateAluno.mockResolvedValue(undefined);
    createProfessor.mockResolvedValue(undefined);
    deleteProfessor.mockResolvedValue(undefined);
    getProfessor.mockResolvedValue({
      id: "prof-1",
      nome: "Grace Hopper",
      email: "grace@example.com",
      criadoEm: "2026-06-10T00:00:00.000Z",
      atualizadoEm: "2026-06-16T00:00:00.000Z",
    });
    listProfessores.mockResolvedValue({
      data: [{
        id: "prof-1",
        nome: "Grace Hopper",
        email: "grace@example.com",
        criadoEm: "2026-06-10T00:00:00.000Z",
        atualizadoEm: "2026-06-16T00:00:00.000Z",
      }],
      total: 1,
      page: 1,
      limit: 20,
    });
    listProfessorMaterias.mockResolvedValue([]);
    vincularProfessorMateria.mockResolvedValue(undefined);
    removerProfessorMateria.mockResolvedValue(undefined);
    updateProfessor.mockResolvedValue(undefined);
    listMaterias.mockResolvedValue({ data: [materia], total: 1, page: 1, limit: 20 });
    listProvas.mockResolvedValue({ data: [{ ...exam, professorId: "prof-1", status: "publicada" }], total: 1, page: 1, limit: 20 });
    useAnalyticsSummary.mockReturnValue({
      isLoading: false,
      summary: { pendenciasCorrecao: 1, envios: 2 },
    });
    useDashboard.mockReturnValue(dashboardState());
  });

  afterEach(() => {
    cleanup();
  });

  it("renderiza dashboard do professor, navega por abas e faz logout", () => {
    const onLogout = vi.fn();
    const onNavigateTab = vi.fn();
    render(<ProfessorDashboard onLogout={onLogout} onNavigateTab={onNavigateTab} />, { wrapper: wrapper() });

    expect(screen.getByText("Painel")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /provas/i }));
    expect(onNavigateTab).toHaveBeenCalledWith("provas");
    expect(screen.getByText(/prova de calculo/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /banco de quest/i }));
    expect(onNavigateTab).toHaveBeenCalledWith("banco");
    expect(screen.getAllByText(/banco de quest/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /sair/i }));
    expect(onLogout).toHaveBeenCalled();
  });

  it("renderiza rotas internas do professor a partir da aba inicial", () => {
    const tabs = [
      "nova-prova",
      "prova-detail",
      "nova-questao",
      "nova-questao-banco",
      "correcao",
      "liberacao",
      "prova-questoes-correcao",
      "questao-correcao",
      "correcao-aluno",
    ] as const;

    for (const tab of tabs) {
      const { unmount } = render(
        <ProfessorDashboard onLogout={vi.fn()} initialTab={tab} />,
        { wrapper: wrapper() },
      );
      expect(document.querySelector("main")).not.toBeEmptyDOMElement();
      unmount();
    }
  });

  it("renderiza dashboard do coordenador e acessa gestoes", () => {
    const onNavigateTab = vi.fn();
    render(<CoordenadorDashboard onLogout={vi.fn()} onNavigateTab={onNavigateTab} />, { wrapper: wrapper() });

    fireEvent.click(screen.getByRole("button", { name: /gest.o de professores/i }));
    expect(onNavigateTab).toHaveBeenCalledWith("gestao-professores");
    expect(screen.getAllByText(/gest.o de professores/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /gest.o de alunos/i }));
    expect(onNavigateTab).toHaveBeenCalledWith("gestao-alunos");
    expect(screen.getAllByText(/gest.o de alunos/i).length).toBeGreaterThan(0);
  });

  it("renderiza rotas internas do coordenador a partir da aba inicial", () => {
    const tabs = [
      "provas",
      "banco",
      "correcao",
      "liberacao",
      "nova-prova",
      "prova-detail",
      "nova-questao",
      "nova-questao-banco",
      "prova-questoes-correcao",
      "questao-correcao",
      "perfil-aluno",
      "perfil-professor",
    ] as const;

    for (const tab of tabs) {
      const { unmount } = render(
        <CoordenadorDashboard onLogout={vi.fn()} initialTab={tab} />,
        { wrapper: wrapper() },
      );
      expect(document.querySelector("main")).not.toBeNull();
      unmount();
    }
  });

  it("carrega perfil do aluno e salva edicao", async () => {
    render(<PerfilAlunoPage alunoId="aluno-1" onBack={vi.fn()} />, { wrapper: wrapper() });

    expect((await screen.findAllByText("Ada Lovelace")).length).toBeGreaterThan(0);
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button")[1]);
    fireEvent.change(screen.getByDisplayValue("Ada Lovelace"), { target: { value: "Ada Byron" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => expect(updateAluno).toHaveBeenCalledWith("aluno-1", expect.objectContaining({
      nome: "Ada Byron",
    })));
  });

  it("carrega perfil do professor, vincula materia e salva edicao", async () => {
    render(<PerfilProfessorPage professorId="prof-1" onBack={vi.fn()} />, { wrapper: wrapper() });

    expect((await screen.findAllByText("Grace Hopper")).length).toBeGreaterThan(0);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: materia.id } });
    fireEvent.click(screen.getByRole("button", { name: /vincular/i }));
    await waitFor(() => expect(vincularProfessorMateria).toHaveBeenCalledWith("prof-1", materia.id));

    fireEvent.click(screen.getAllByRole("button")[1]);
    fireEvent.change(screen.getByDisplayValue("Grace Hopper"), { target: { value: "Grace M. Hopper" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => expect(updateProfessor).toHaveBeenCalledWith("prof-1", expect.objectContaining({
      nome: "Grace M. Hopper",
    })));
  });
});
