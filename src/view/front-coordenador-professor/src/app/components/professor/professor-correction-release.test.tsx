import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Exam } from "../../../../../src/features/dashboard/dashboard.types";
import { CorrecaoAlunoPage } from "./CorrecaoAlunoPage";
import { LiberacaoNotasPage } from "./LiberacaoNotasPage";
import { ProvaQuestoesCorrecaoPage } from "./ProvaQuestoesCorrecaoPage";
import { QuestaoCorrecaoPage } from "./QuestaoCorrecaoPage";

const {
  exportarAnexosProva,
  buildAnexosZip,
  getStoredAuthSession,
  liberarEmailsResultado,
  listarEmailsProva,
  reenviarEmailResultado,
  exportarResultados,
  getProvaAnalytics,
  listarQuestoesCorrecao,
  listarRespostasPorQuestao,
  salvarCorrecao,
  useCorrecaoAutomaticaObjetivas,
} = vi.hoisted(() => ({
  exportarAnexosProva: vi.fn(),
  buildAnexosZip: vi.fn(),
  getStoredAuthSession: vi.fn(),
  liberarEmailsResultado: vi.fn(),
  listarEmailsProva: vi.fn(),
  reenviarEmailResultado: vi.fn(),
  exportarResultados: vi.fn(),
  getProvaAnalytics: vi.fn(),
  listarQuestoesCorrecao: vi.fn(),
  listarRespostasPorQuestao: vi.fn(),
  salvarCorrecao: vi.fn(),
  useCorrecaoAutomaticaObjetivas: vi.fn(),
}));

vi.mock("../../../../../src/features/anexos/anexos.api", () => ({ exportarAnexosProva }));
vi.mock("../../../../../src/features/anexos/anexos.zip", () => ({ buildAnexosZip }));
vi.mock("../../../../../src/features/auth/auth.storage", () => ({ getStoredAuthSession }));
vi.mock("../../../../../src/features/emails/emails.api", () => ({
  liberarEmailsResultado,
  listarEmailsProva,
  reenviarEmailResultado,
}));
vi.mock("../../../../../src/features/resultados/resultados.api", () => ({ exportarResultados }));
vi.mock("../../../../../src/features/analytics/analytics.api", () => ({ getProvaAnalytics }));
vi.mock("../../../../../src/features/correcao/correcao.api", () => ({
  listarQuestoesCorrecao,
  listarRespostasPorQuestao,
  salvarCorrecao,
}));
vi.mock("../../../../../src/features/correcao/useCorrecaoAutomaticaObjetivas", () => ({
  useCorrecaoAutomaticaObjetivas,
}));

const PROVA_ID = "11111111-1111-4111-8111-111111111111";
const QUESTAO_ID = "22222222-2222-4222-8222-222222222222";

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
};

const questao = {
  questaoId: QUESTAO_ID,
  ordemOriginal: 1,
  pontuacaoMax: 2,
  tipo: "discursiva",
  enunciado: "Explique o conceito.",
  imagemUrl: null,
  respostas: { total: 2, corrigidas: 1 },
};

const respostas = [
  {
    respostaId: "resposta-1",
    questaoId: QUESTAO_ID,
    questaoTipo: "discursiva",
    questaoEnunciado: "Explique o conceito.",
    questaoImagemUrl: null,
    pontuacaoMax: 2,
    aluno: { id: "aluno-1", nome: "Ada Lovelace" },
    respostaTexto: "Resposta discursiva",
    anexos: [{ id: "anexo-1", nomeArquivo: "rascunho.pdf", urlArquivo: "https://example.com/a.pdf", mimeType: "application/pdf" }],
    alternativaSelecionada: null,
    alternativaCorreta: null,
    correcao: null,
  },
  {
    respostaId: "resposta-2",
    questaoId: QUESTAO_ID,
    questaoTipo: "discursiva",
    questaoEnunciado: "Explique o conceito.",
    questaoImagemUrl: null,
    pontuacaoMax: 2,
    aluno: { id: "aluno-2", nome: "Grace Hopper" },
    respostaTexto: "Outra resposta",
    anexos: [],
    alternativaSelecionada: null,
    alternativaCorreta: null,
    correcao: { id: "correcao-2", nota: 2, observacao: "Boa", tipo: "manual", corrigidaEm: "2026-06-16T10:00:00.000Z" },
  },
];

function wrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("professor correction and release pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getStoredAuthSession.mockReturnValue({ usuario: { perfil: "coordenador" } });
    getProvaAnalytics.mockResolvedValue({
      provaId: PROVA_ID,
      envios: 2,
      pendenciasCorrecao: 0,
      mediaGeral: 8,
      taxaConclusao: 100,
    });
    listarEmailsProva.mockResolvedValue([
      { id: "email-1", provaAlunoId: "pa-1", alunoNome: "Ada Lovelace", alunoEmail: "ada@example.com", status: "erro", criadoEm: "2026-06-16T10:00:00.000Z" },
      { id: "email-2", provaAlunoId: "pa-2", alunoNome: "Grace Hopper", alunoEmail: "grace@example.com", status: "enviado", criadoEm: "2026-06-16T11:00:00.000Z" },
    ]);
    liberarEmailsResultado.mockResolvedValue({ enviados: 2 });
    reenviarEmailResultado.mockResolvedValue({ id: "email-1" });
    exportarResultados.mockResolvedValue({ urlArquivo: "https://example.com/resultados.xlsx", pendenciasCorrecao: 0 });
    exportarAnexosProva.mockResolvedValue([{ id: "anexo-export-1", nomeArquivo: "rascunho.pdf", url: "https://example.com/a.pdf" }]);
    buildAnexosZip.mockResolvedValue(new Blob(["zip"], { type: "application/zip" }));
    listarQuestoesCorrecao.mockResolvedValue([questao]);
    listarRespostasPorQuestao.mockResolvedValue(respostas);
    salvarCorrecao.mockResolvedValue({ id: "correcao-1" });
    useCorrecaoAutomaticaObjetivas.mockReturnValue({ isLoading: false, data: { respostasCorrigidas: 0 } });
    vi.spyOn(window, "open").mockImplementation(() => null);
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn() });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:anexos");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("libera notas, exporta resultados, zip de anexos e reenvia e-mail", async () => {
    render(<LiberacaoNotasPage exams={[exam]} />, { wrapper: wrapper() });

    expect((await screen.findAllByText("Prova de Calculo")).length).toBeGreaterThan(0);
    await waitFor(() => expect(getProvaAnalytics).toHaveBeenCalledWith(PROVA_ID));

    fireEvent.click(screen.getAllByText("Prova de Calculo")[0]);
    fireEvent.click(screen.getByRole("button", { name: /enviar notas/i }));
    await waitFor(() => expect(liberarEmailsResultado).toHaveBeenCalledWith(PROVA_ID, true));
    expect(await screen.findByText(/notas enviadas/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /resultados/i }));
    await waitFor(() => expect(exportarResultados).toHaveBeenCalledWith(PROVA_ID, { formato: "xlsx" }));
    expect(window.open).not.toHaveBeenCalled();
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /zip anexos/i }));
    await waitFor(() => expect(exportarAnexosProva).toHaveBeenCalled());
    expect(exportarAnexosProva.mock.calls[0][0]).toBe(PROVA_ID);
    expect(buildAnexosZip).toHaveBeenCalled();

    fireEvent.click(await screen.findByRole("button", { name: /reenviar/i }));
    await waitFor(() => expect(reenviarEmailResultado).toHaveBeenCalled());
    expect(reenviarEmailResultado.mock.calls[0][0]).toBe("email-1");
  }, 15_000);

  it("lista questoes para correcao e navega para uma questao", async () => {
    const onNavigateToQuestion = vi.fn();
    const onResetCompletionModal = vi.fn();
    render(
      <ProvaQuestoesCorrecaoPage
        onBack={vi.fn()}
        onNavigateToQuestion={onNavigateToQuestion}
        provaId={PROVA_ID}
        examTitle="Prova de Calculo"
        showCompletionModal
        onResetCompletionModal={onResetCompletionModal}
      />,
      { wrapper: wrapper() },
    );

    expect(await screen.findByText(/pontua/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /discursiva/i }));
    expect(onNavigateToQuestion).toHaveBeenCalledWith(QUESTAO_ID, "Discursiva");
    fireEvent.click(screen.getByRole("button", { name: /continuar corrigindo/i }));
    expect(onResetCompletionModal).toHaveBeenCalled();
  });

  it("corrige respostas por questao e aciona conclusao", async () => {
    const onAllCorrected = vi.fn();
    render(<QuestaoCorrecaoPage onBack={vi.fn()} onAllCorrected={onAllCorrected} provaId={PROVA_ID} questaoId={QUESTAO_ID} />, {
      wrapper: wrapper(),
    });

    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "1.5" } });
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Bom raciocinio" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar e avan/i }));
    await waitFor(() => expect(salvarCorrecao).toHaveBeenCalledWith("resposta-1", {
      nota: 1.5,
      observacao: "Bom raciocinio",
    }));
  });

  it("corrige por aluno, filtra estudantes e salva payloads", async () => {
    render(<CorrecaoAlunoPage onBack={vi.fn()} provaId={PROVA_ID} examTitle="Prova de Calculo" />, {
      wrapper: wrapper(),
    });

    expect(await screen.findByText(/corre..o por aluno/i)).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/buscar aluno/i), { target: { value: "Ada" } });
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Ada Lovelace"));
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "2" } });
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Completa" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar corre/i }));

    await waitFor(() => expect(salvarCorrecao).toHaveBeenCalledWith("resposta-1", {
      nota: 2,
      observacao: "Completa",
    }));
  });
});
