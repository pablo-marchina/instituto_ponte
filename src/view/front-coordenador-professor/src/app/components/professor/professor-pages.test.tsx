import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BancoQuestion, Exam } from "../../../../../src/features/dashboard/dashboard.types";
import type { MateriaDto } from "../../../../../src/features/materias/materias.types";
import { listarQuestoesCorrecao } from "../../../../../src/features/correcao/correcao.api";
import { createTema, listTemas } from "../../../../../src/features/temas/temas.api";
import { BancoQuestoesPage } from "./BancoQuestoesPage";
import { CorrecaoPage } from "./CorrecaoPage";
import { NovaProvaPage } from "./NovaProvaPage";
import { NovaQuestaoPage } from "./NovaQuestaoPage";

vi.mock("../../../../../src/features/correcao/correcao.api", () => ({
  listarQuestoesCorrecao: vi.fn(),
}));

vi.mock("../../../../../src/features/temas/temas.api", () => ({
  createTema: vi.fn(),
  listTemas: vi.fn(),
}));

const PROVA_ID = "11111111-1111-4111-8111-111111111111";
const QUESTAO_ID = "22222222-2222-4222-8222-222222222222";

const materia: MateriaDto = {
  id: "materia-1",
  nome: "Matematica",
  codigo: "MAT",
  descricao: null,
  criadoEm: "2026-06-16T00:00:00.000Z",
  atualizadoEm: "2026-06-16T00:00:00.000Z",
};

const exam: Exam = {
  id: PROVA_ID,
  title: "Prova de Calculo",
  modalidade: "Prova",
  discipline: "Matematica",
  subject: "Matematica",
  turma: "3A",
  semester: "1 Semestre 2026",
  badge: "Publicada",
  submissions: "5",
  tempoProva: 60,
};

const bancoQuestion: BancoQuestion = {
  id: QUESTAO_ID,
  type: "Discursiva",
  materia: "Matematica",
  materiaId: materia.id,
  semestre: "Banco",
  dificuldade: "Media",
  text: "Explique derivadas",
  answer: "A ser corrigido",
  pontuacaoPadrao: 2,
  timesUsed: 3,
  successRate: 80,
};

function wrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("professor large pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listTemas).mockResolvedValue({ data: [], meta: undefined });
    vi.mocked(createTema).mockResolvedValue({
      id: "tema-1",
      materiaId: materia.id,
      nome: "Derivadas",
      descricao: null,
      criadoEm: "2026-06-16T00:00:00.000Z",
      atualizadoEm: "2026-06-16T00:00:00.000Z",
    });
    vi.mocked(listarQuestoesCorrecao).mockResolvedValue([
      {
        questaoId: QUESTAO_ID,
        ordemOriginal: 1,
        pontuacaoMax: 2,
        tipo: "discursiva",
        enunciado: "Explique.",
        imagemUrl: null,
        respostas: { total: 5, corrigidas: 3 },
      },
    ]);
  });

  afterEach(() => {
    cleanup();
  });

  it("filtra banco de questoes e dispara edicao, exclusao e selecao de prova", async () => {
    const onNavigate = vi.fn();
    const onDeleteQuestion = vi.fn();
    const onUpdateQuestion = vi.fn();
    const onAddToProva = vi.fn();

    const { container } = render(
      <BancoQuestoesPage
        bancoQuestoes={[bancoQuestion, { ...bancoQuestion, id: "draft-question-1", text: "Integral", materia: "Fisica" }]}
        provas={[exam]}
        onNavigate={onNavigate}
        onDeleteQuestion={onDeleteQuestion}
        onUpdateQuestion={onUpdateQuestion}
        onAddToProva={onAddToProva}
        isLoading
        errorMessage="Falha controlada"
      />,
    );

    expect(screen.getByText(/carregando banco/i)).toBeInTheDocument();
    expect(screen.getByText("Falha controlada")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /\+ adicionar/i }));
    expect(onNavigate).toHaveBeenCalledWith("nova-questao-banco");

    fireEvent.change(screen.getByPlaceholderText(/buscar quest/i), {
      target: { value: "derivadas" },
    });
    expect(screen.getByText("Explique derivadas")).toBeInTheDocument();
    expect(screen.queryByText("Integral")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Explique derivadas"));
    fireEvent.change(screen.getByDisplayValue("Explique derivadas"), {
      target: { value: "Explique limites" },
    });
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));
    expect(onUpdateQuestion).toHaveBeenCalledWith(expect.objectContaining({ text: "Explique limites" }));

    fireEvent.click(screen.getByRole("button", { name: /incluir na prova/i }));
    fireEvent.click(screen.getByText("Prova de Calculo"));
    expect(onAddToProva).toHaveBeenCalledWith(PROVA_ID, expect.objectContaining({ id: QUESTAO_ID }));

    fireEvent.click(screen.getByTitle("Remover questao"));
    expect(onDeleteQuestion).toHaveBeenCalledWith(QUESTAO_ID);
  });

  it("preenche e salva nova prova com payload normalizado", async () => {
    const onBack = vi.fn();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { container } = render(
      <NovaProvaPage
        onBack={onBack}
        onSave={onSave}
        materias={[materia]}
        errorMessage="Erro de validacao"
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Erro de validacao");
    fireEvent.change(screen.getByPlaceholderText(/prova de/i), {
      target: { value: "Prova de Calculo" },
    });
    fireEvent.change(screen.getByPlaceholderText(/instru/i), {
      target: { value: "Sem consulta" },
    });

    const selects = container.querySelectorAll("select");
    fireEvent.change(selects[0], { target: { value: "Prova" } });
    fireEvent.change(selects[1], { target: { value: materia.id } });
    fireEvent.change(selects[2], { target: { value: "3A" } });
    fireEvent.change(selects[3], { target: { value: selects[3].options[1].value } });
    fireEvent.change(selects[4], { target: { value: "60" } });

    fireEvent.click(screen.getByRole("button", { name: /salvar como rascunho/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      materiaId: materia.id,
      titulo: "Prova de Calculo",
      modalidade: "Prova",
      turma: "3A",
      instrucoes: "Sem consulta",
      tempoLimiteMin: 60,
    })));
    expect(onBack).toHaveBeenCalled();
  });

  it("cria questao, cria tema novo e alterna preview", async () => {
    const onBack = vi.fn();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { container } = render(
      <NovaQuestaoPage
        onBack={onBack}
        onSave={onSave}
        materias={[materia]}
        defaultMateriaId={materia.id}
        errorMessage="Erro ao salvar"
      />,
      { wrapper: wrapper() },
    );

    expect(screen.getByText("Erro ao salvar")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /ocultar preview/i }));
    fireEvent.change(screen.getByPlaceholderText(/derivadas/i), {
      target: { value: "Derivadas" },
    });
    fireEvent.change(screen.getByPlaceholderText(/enunciado/i), {
      target: { value: "Quanto vale 2+2?" },
    });
    fireEvent.change(screen.getByPlaceholderText(/alternativa a/i), {
      target: { value: "4" },
    });
    fireEvent.click(container.querySelectorAll("button")[3]);
    fireEvent.click(screen.getByRole("button", { name: /salvar quest/i }));

    await waitFor(() => expect(createTema).toHaveBeenCalled());
    expect(vi.mocked(createTema).mock.calls[0][0]).toEqual({
      materiaId: materia.id,
      nome: "Derivadas",
    });
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      materiaId: materia.id,
      temaId: "tema-1",
      tipo: "multipla_escolha",
      enunciado: { conteudoLatex: "Quanto vale 2+2?", urlImagem: null },
    }));
    expect(onBack).toHaveBeenCalled();
  });

  it("mostra estatisticas de correcao e navega por questao ou aluno", async () => {
    const onNavigate = vi.fn();
    render(<CorrecaoPage exams={[exam]} onNavigate={onNavigate} />, {
      wrapper: wrapper(),
    });

    await waitFor(() => expect(listarQuestoesCorrecao).toHaveBeenCalledWith(PROVA_ID));
    await waitFor(() => expect(screen.getAllByText("5").length).toBeGreaterThan(0));
    expect(screen.getAllByText("3").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText(/prova de calculo/i));
    expect(onNavigate).toHaveBeenCalledWith(
      "prova-questoes-correcao",
      expect.objectContaining({ id: PROVA_ID, corrected: 3, pending: 2, progress: 60 }),
    );

    fireEvent.click(screen.getByRole("button", { name: /por aluno/i }));
    fireEvent.click(screen.getByText(/prova de calculo/i));
    expect(onNavigate).toHaveBeenLastCalledWith(
      "correcao-aluno",
      expect.objectContaining({ id: PROVA_ID, corrected: 3, pending: 2, progress: 60 }),
    );
  });
});
