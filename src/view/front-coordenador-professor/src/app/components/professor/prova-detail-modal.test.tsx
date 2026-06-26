import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BancoQuestion, Exam } from "../../../../../src/features/dashboard/dashboard.types";
import type { Question } from "../../../../../src/features/questoes/questao.types";
import { ProvaDetailPage } from "./ProvaDetailPage";
import { SelecionarDoBancoModal } from "./SelecionarDoBancoModal";

const { getProvaAnalytics, listarQuestoesCorrecao } = vi.hoisted(() => ({
  getProvaAnalytics: vi.fn(),
  listarQuestoesCorrecao: vi.fn(),
}));

vi.mock("../../../../../src/features/analytics/analytics.api", () => ({ getProvaAnalytics }));
vi.mock("../../../../../src/features/correcao/correcao.api", () => ({ listarQuestoesCorrecao }));

const PROVA_ID = "11111111-1111-4111-8111-111111111111";

const exam: Exam = {
  id: PROVA_ID,
  title: "Prova de Calculo",
  modalidade: "Prova",
  discipline: "Matematica",
  subject: "Matematica",
  turma: "3A",
  semester: "1 Semestre 2026",
  badge: "Publicada",
  submissions: "2",
  tempoProva: 60,
  dataInicio: "2026-06-16T10:00:00.000Z",
  dataLimite: "2026-06-16T11:00:00.000Z",
  orientacoes: "Sem consulta",
  urlAcesso: "https://example.com/prova",
};

const question: Question = {
  id: "questao-1",
  type: "Alternativa",
  text: "Quanto vale 2+2?",
  answer: "4",
  options: [
    { letter: "A", text: "3", correct: false },
    { letter: "B", text: "4", correct: true },
  ],
};

const bancoQuestion: BancoQuestion = {
  id: "banco-1",
  type: "Discursiva",
  materia: "Matematica",
  materiaId: "materia-1",
  semestre: "1 Semestre 2026",
  dificuldade: "Media",
  text: "Explique limites",
  answer: "Resposta esperada",
  pontuacaoPadrao: 2,
  timesUsed: 1,
  successRate: 75,
};

function wrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("prova detail and bank modal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getProvaAnalytics.mockResolvedValue({
      provaId: PROVA_ID,
      envios: 2,
      pendenciasCorrecao: 1,
      mediaGeral: 7.5,
      taxaConclusao: 80,
    });
    listarQuestoesCorrecao.mockResolvedValue([
      {
        questaoId: "questao-1",
        ordemOriginal: 1,
        pontuacaoMax: 1,
        tipo: "multipla_escolha",
        respostas: { total: 2, corrigidas: 1 },
      },
    ]);
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });

  afterEach(() => {
    cleanup();
  });

  it("interage com detalhe da prova, abas, questoes e configuracoes", async () => {
    const onBack = vi.fn();
    const onNavigate = vi.fn();
    const onDeleteQuestion = vi.fn();
    const onUpdateQuestion = vi.fn();
    const onAddQuestions = vi.fn().mockResolvedValue(undefined);
    const onUpdateExam = vi.fn().mockResolvedValue(undefined);
    const onPublish = vi.fn();

    const { container } = render(
      <ProvaDetailPage
        onBack={onBack}
        onNavigate={onNavigate}
        questions={[question]}
        onDeleteQuestion={onDeleteQuestion}
        onUpdateQuestion={onUpdateQuestion}
        onAddQuestions={onAddQuestions}
        bancoQuestoes={[bancoQuestion]}
        selectedExam={exam}
        examTitle={exam.title}
        examSubject={exam.subject}
        examSemester={exam.semester}
        examTurma={exam.turma}
        examModalidade={exam.modalidade}
        examTempoProva={exam.tempoProva}
        examDataInicio={exam.dataInicio}
        examDataLimite={exam.dataLimite}
        examOrientacoes={exam.orientacoes}
        onUpdateExam={onUpdateExam}
        onPublish={onPublish}
        onClosePublishModal={vi.fn()}
      />,
      { wrapper: wrapper() },
    );

    expect(await screen.findByText("Prova de Calculo")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /voltar/i }));
    expect(onBack).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /compartilhar/i }));
    expect(onPublish).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /editar dados/i }));
    fireEvent.change(screen.getByDisplayValue("Prova de Calculo"), { target: { value: "Prova final" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));
    await waitFor(() => expect(onUpdateExam).toHaveBeenCalledWith(expect.objectContaining({ title: "Prova final" })));

    fireEvent.click(screen.getAllByTitle("Editar")[0]);
    fireEvent.change(screen.getByDisplayValue("Quanto vale 2+2?"), { target: { value: "Quanto vale 3+3?" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));
    expect(onUpdateQuestion).toHaveBeenCalledWith(expect.objectContaining({ text: "Quanto vale 3+3?" }));

    fireEvent.click(screen.getAllByTitle("Excluir")[0]);
    expect(onDeleteQuestion).toHaveBeenCalledWith("questao-1");

    fireEvent.click(screen.getByRole("button", { name: /submiss/i }));
    await waitFor(() => expect(getProvaAnalytics).toHaveBeenCalledWith(PROVA_ID));
    expect(screen.getAllByText(/submiss/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /respostas/i }));
    await waitFor(() => expect(listarQuestoesCorrecao).toHaveBeenCalledWith(PROVA_ID));
    fireEvent.click(screen.getByRole("button", { name: /abrir corre/i }));
    expect(onNavigate).toHaveBeenCalledWith("correcao");

    fireEvent.click(screen.getByRole("button", { name: /configura/i }));
    expect(screen.getAllByText(/configura/i).length).toBeGreaterThan(0);
  });

  it("filtra e adiciona questoes do banco", async () => {
    const onAddQuestions = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    const { container } = render(
      <SelecionarDoBancoModal
        isOpen
        onClose={onClose}
        onAddQuestions={onAddQuestions}
        bancoQuestoes={[bancoQuestion, { ...bancoQuestion, id: "banco-2", text: "Cinematica", materia: "Fisica" }]}
      />,
    );

    expect(screen.getByText(/2 quest/i)).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/buscar/i), { target: { value: "limites" } });
    expect(screen.getByText("Explique limites")).toBeInTheDocument();
    expect(screen.queryByText("Cinematica")).not.toBeInTheDocument();

    const selects = container.querySelectorAll("select");
    fireEvent.change(selects[0], { target: { value: "Matematica" } });
    fireEvent.change(selects[1], { target: { value: "Discursiva" } });
    fireEvent.click(screen.getByRole("button", { name: /limpar filtros/i }));
    expect(screen.getByText("Cinematica")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Explique limites"));
    fireEvent.click(screen.getByRole("button", { name: /adicionar/i }));
    await waitFor(() => expect(onAddQuestions).toHaveBeenCalledWith([
      expect.objectContaining({ text: "Explique limites", type: "Discursiva" }),
    ]));
    expect(onClose).toHaveBeenCalled();
  });
});
