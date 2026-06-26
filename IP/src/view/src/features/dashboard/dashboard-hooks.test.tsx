import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import {
  addQuestaoToProva,
  arquivarProva,
  createProva,
  deleteProva,
  despublicarProva,
  getProva,
  listProvaQuestoes,
  listProvas,
  publicarProva,
  removeQuestaoFromProva,
  reorderQuestaoInProva,
  updateProva,
  updateProvaConfiguracoes,
} from "../provas/provas.api";
import type { ProvaDto, ProvaQuestaoDto, QuestaoDto } from "../provas/provas.types";
import { createQuestao, deleteQuestao, listQuestoes, updateQuestao } from "../questoes/questoes.api";
import { listMaterias } from "../materias/materias.api";
import { listarQuestoesCorrecao } from "../correcao/correcao.api";
import { useBancoQuestoes } from "./useBancoQuestoes";
import { useDashboard } from "./useDashboard";
import { useProvaQuestoes } from "./useProvaQuestoes";
import { useProvaSelecionada } from "./useProvaSelecionada";
import { useProvas } from "./useProvas";
import type { BancoQuestion, Exam } from "./dashboard.types";
import type { Question } from "../questoes/questao.types";

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

vi.mock("../materias/materias.api", () => ({
  listMaterias: vi.fn(),
}));

vi.mock("../questoes/questoes.api", () => ({
  createQuestao: vi.fn(),
  deleteQuestao: vi.fn(),
  listQuestoes: vi.fn(),
  updateQuestao: vi.fn(),
}));

vi.mock("../provas/provas.api", () => ({
  addQuestaoToProva: vi.fn(),
  arquivarProva: vi.fn(),
  createProva: vi.fn(),
  deleteProva: vi.fn(),
  despublicarProva: vi.fn(),
  getProva: vi.fn(),
  listProvaQuestoes: vi.fn(),
  listProvas: vi.fn(),
  publicarProva: vi.fn(),
  removeQuestaoFromProva: vi.fn(),
  reorderQuestaoInProva: vi.fn(),
  updateProva: vi.fn(),
  updateProvaConfiguracoes: vi.fn(),
}));

vi.mock("../correcao/correcao.api", () => ({
  listarQuestoesCorrecao: vi.fn(),
}));

const PROVA_ID = "11111111-1111-4111-8111-111111111111";
const QUESTAO_ID = "22222222-2222-4222-8222-222222222222";

const provaDto: ProvaDto = {
  id: PROVA_ID,
  titulo: "Prova final",
  modalidade: "online",
  turma: "A",
  semestre: "2026.1",
  status: "rascunho",
  submissoes: 0,
  tempoLimiteMin: 45,
  dataInicio: null,
  dataFim: null,
  instrucoes: "Boa prova",
  materiaId: "materia-1",
  professorId: "prof-1",
  materia: { id: "materia-1", nome: "Matematica" },
  professor: { id: "prof-1", nome: "Ada" },
  criadoEm: "2026-06-16T00:00:00.000Z",
  atualizadoEm: "2026-06-16T00:00:00.000Z",
  embaralharQuestoes: false,
  embaralharAlternativas: true,
  urlAcesso: null,
  qrCode: null,
};

const questaoDto: QuestaoDto = {
  id: QUESTAO_ID,
  materiaId: "materia-1",
  temaId: null,
  tipo: "discursiva",
  limiteCaracteres: null,
  limitePalavras: null,
  permiteAnexo: true,
  pontuacaoPadrao: 2,
  ativa: true,
  criadoEm: "2026-06-16T00:00:00.000Z",
  atualizadoEm: "2026-06-16T00:00:00.000Z",
  enunciado: { conteudoLatex: "Explique", urlImagem: null },
  alternativas: [],
};

const provaQuestaoDto: ProvaQuestaoDto = {
  provaId: PROVA_ID,
  questaoId: QUESTAO_ID,
  ordemOriginal: 1,
  pontuacaoMax: 2,
  criadoEm: "2026-06-16T00:00:00.000Z",
  questao: questaoDto,
};

const bancoQuestion: BancoQuestion = {
  id: QUESTAO_ID,
  type: "Discursiva",
  materia: "Matematica",
  materiaId: "materia-1",
  semestre: "Banco",
  dificuldade: "Media",
  text: "Explique",
  answer: "A ser corrigido",
  pontuacaoPadrao: 2,
  timesUsed: 0,
  successRate: 0,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("dashboard hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listMaterias).mockResolvedValue({
      data: [{
        id: "materia-1",
        nome: "Matematica",
        codigo: "MAT",
        descricao: null,
        criadoEm: "2026-06-16T00:00:00.000Z",
        atualizadoEm: "2026-06-16T00:00:00.000Z",
      }],
      meta: undefined,
    });
    vi.mocked(listQuestoes).mockResolvedValue({ data: [questaoDto], meta: undefined });
    vi.mocked(createQuestao).mockResolvedValue(questaoDto);
    vi.mocked(updateQuestao).mockResolvedValue(questaoDto);
    vi.mocked(deleteQuestao).mockResolvedValue(undefined);
    vi.mocked(listProvas).mockResolvedValue({ data: [provaDto], meta: undefined });
    vi.mocked(getProva).mockResolvedValue(provaDto);
    vi.mocked(createProva).mockResolvedValue(provaDto);
    vi.mocked(updateProva).mockResolvedValue(provaDto);
    vi.mocked(updateProvaConfiguracoes).mockResolvedValue(provaDto);
    vi.mocked(deleteProva).mockResolvedValue(undefined);
    vi.mocked(arquivarProva).mockResolvedValue({ ...provaDto, status: "antiga" });
    vi.mocked(publicarProva).mockResolvedValue({
      ...provaDto,
      status: "publicada",
      urlAcesso: "http://localhost/aluno/prova/link",
    });
    vi.mocked(listProvaQuestoes).mockResolvedValue([provaQuestaoDto]);
    vi.mocked(addQuestaoToProva).mockResolvedValue(provaQuestaoDto);
    vi.mocked(removeQuestaoFromProva).mockResolvedValue(undefined);
    vi.mocked(listarQuestoesCorrecao).mockResolvedValue([]);
  });

  it("carrega banco de questoes e executa mutacoes com invalidacao", async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useBancoQuestoes({ selectedExamId: PROVA_ID }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.bancoQuestoes).toHaveLength(1));
    expect(result.current.materiaNameById.get("materia-1")).toBe("Matematica");

    await act(async () => {
      await result.current.addBancoQuestion({
        materiaId: "materia-1",
        tipo: "discursiva",
        permiteAnexo: true,
        pontuacaoPadrao: 2,
        enunciado: { conteudoLatex: "Nova", urlImagem: null },
        alternativas: [],
      });
    });
    await act(async () => {
      await result.current.updateBancoQuestion(bancoQuestion);
    });
    act(() => result.current.deleteBancoQuestion(QUESTAO_ID));

    expect(createQuestao).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(updateQuestao).toHaveBeenCalledWith(QUESTAO_ID, expect.objectContaining({
      tipo: "discursiva",
    })));
    await waitFor(() => expect(deleteQuestao).toHaveBeenCalled());
    expect(vi.mocked(deleteQuestao).mock.calls[0][0]).toBe(QUESTAO_ID);
  });

  it("sincroniza questoes de prova, adiciona, remove e cria questao para prova selecionada", async () => {
    const wrapper = createWrapper();
    const setExamQuestions = vi.fn();
    const { result, rerender } = renderHook(
      ({ examQuestions }) =>
        useProvaQuestoes({
          selectedExamId: PROVA_ID,
          selectedExamMateriaId: "materia-1",
          examQuestions,
          setExamQuestions,
          createQuestao: vi.mocked(createQuestao),
        }),
      { wrapper, initialProps: { examQuestions: [] as Question[] } },
    );

    await waitFor(() => expect(setExamQuestions).toHaveBeenCalled());

    await act(async () => {
      await result.current.addQuestions([
        { id: QUESTAO_ID, type: "Discursiva", text: "Explique" },
      ]);
    });
    expect(addQuestaoToProva).toHaveBeenCalledWith(PROVA_ID, expect.objectContaining({
      questaoId: QUESTAO_ID,
      ordemOriginal: 1,
    }));

    rerender({ examQuestions: [{ id: QUESTAO_ID, type: "Discursiva", text: "Explique" }] });
    await act(async () => {
      await result.current.createQuestionForSelectedExam({
        materiaId: "materia-1",
        tipo: "discursiva",
        permiteAnexo: true,
        pontuacaoPadrao: 2,
        enunciado: { conteudoLatex: "Criada", urlImagem: null },
        alternativas: [],
      });
    });
    act(() => result.current.deleteQuestion(QUESTAO_ID));
    await act(async () =>
      result.current.updateQuestion({
        id: QUESTAO_ID,
        type: "Discursiva",
        text: "Atualizada",
      }),
    );

    expect(createQuestao).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(updateQuestao).toHaveBeenCalledWith(QUESTAO_ID, expect.objectContaining({
      enunciado: expect.objectContaining({ conteudoLatex: "Atualizada" }),
    })));
    await waitFor(() => expect(removeQuestaoFromProva).toHaveBeenCalledWith(PROVA_ID, QUESTAO_ID));
    expect(setExamQuestions).toHaveBeenCalledWith(expect.any(Function));
  });

  it("mantem provas selecionadas e trata publicacao, arquivamento, atualizacao e erro de exclusao", async () => {
    const wrapper = createWrapper();
    const setExams = vi.fn();
    const setSelectedExam = vi.fn();
    const setShowPublishModal = vi.fn();
    const selectedExam: Exam = {
      id: PROVA_ID,
      title: "Prova final",
      modalidade: "online",
      discipline: "Matematica",
      subject: "Matematica",
      turma: "A",
      semester: "2026.1",
      badge: "Rascunho",
      submissions: "0",
      tempoProva: 45,
    };

    vi.mocked(deleteProva).mockRejectedValueOnce(new Error("Prova com vinculos"));

    const { result, rerender } = renderHook(
      ({ selectedExamId }) =>
        useProvas({
          selectedExam,
          selectedExamId,
          setExams,
          setSelectedExam,
          setShowPublishModal,
        }),
      { wrapper, initialProps: { selectedExamId: PROVA_ID as string | null } },
    );

    await waitFor(() => expect(setExams).toHaveBeenCalled());
    await waitFor(() => expect(setSelectedExam).toHaveBeenCalled());

    await act(async () => {
      await result.current.addExam({
        titulo: "Nova",
        modalidade: "online",
        turma: "B",
        semestre: "2026.2",
        materiaId: "materia-1",
        instrucoes: null,
      });
    });
    await act(async () => {
      await result.current.updateExam(selectedExam);
    });
    const publishDeadline = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    act(() => result.current.arquivarExam(PROVA_ID));
    act(() => result.current.publishSelectedExam(publishDeadline));
    act(() => result.current.deleteExam(PROVA_ID));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Prova com vinculos"));
    expect(updateProva).toHaveBeenCalledWith(PROVA_ID, expect.objectContaining({
      titulo: "Prova final",
    }));
    expect(updateProvaConfiguracoes).toHaveBeenCalledWith(PROVA_ID, expect.objectContaining({
      tempoLimiteMin: 45,
    }));
    expect(publicarProva).toHaveBeenCalledWith(PROVA_ID, expect.objectContaining({
      baseUrlAluno: expect.stringContaining("/aluno/prova"),
      dataFim: publishDeadline,
    }));

    rerender({ selectedExamId: null });
    await act(async () => {
      await result.current.updateExam({ ...selectedExam, id: "draft-1" });
    });
    expect(setSelectedExam).toHaveBeenCalledWith(expect.objectContaining({ id: "draft-1" }));
  });

  it("trata ramos alternativos de provas publicadas, arquivamento e configuracoes vazias", async () => {
    const wrapper = createWrapper();
    const setExams = vi.fn();
    const setSelectedExam = vi.fn();
    const setShowPublishModal = vi.fn();
    const selectedExam: Exam = {
      id: PROVA_ID,
      title: " Prova publicada ",
      modalidade: "",
      discipline: "Matematica",
      subject: "Matematica",
      turma: " A ",
      semester: " 2026.1 ",
      badge: "Publicada",
      submissions: "0",
      tempoProva: 0,
      dataInicio: "data-invalida",
      dataLimite: "",
      orientacoes: "   ",
      urlAcesso: "http://localhost/aluno/prova/link",
    };
    vi.mocked(arquivarProva).mockRejectedValueOnce(new Error("Nao pode arquivar"));

    const { result } = renderHook(
      () =>
        useProvas({
          selectedExam,
          selectedExamId: PROVA_ID,
          setExams,
          setSelectedExam,
          setShowPublishModal,
        }),
      { wrapper },
    );

    act(() => result.current.publishSelectedExam());
    expect(setShowPublishModal).toHaveBeenCalledWith(true);
    expect(publicarProva).not.toHaveBeenCalled();

    act(() => result.current.arquivarExam(PROVA_ID));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Nao pode arquivar"));

    await act(async () => {
      await result.current.updateExam(selectedExam);
    });

    expect(updateProva).toHaveBeenCalledWith(PROVA_ID, {
      titulo: "Prova publicada",
      modalidade: undefined,
      turma: "A",
      semestre: "2026.1",
      instrucoes: null,
    });
    expect(updateProvaConfiguracoes).toHaveBeenCalledWith(PROVA_ID, {
      tempoLimiteMin: null,
      dataInicio: null,
      dataFim: null,
      embaralharQuestoes: false,
      embaralharAlternativas: false,
    });
  });

  it("compoe o hook principal do dashboard", async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useDashboard(), { wrapper });

    act(() => {
      result.current.setSelectedExam({
        id: PROVA_ID,
        title: "Prova final",
        modalidade: "online",
        discipline: "Matematica",
        subject: "Matematica",
        turma: "A",
        semester: "2026.1",
        badge: "Rascunho",
        submissions: "0",
      });
    });

    await waitFor(() => expect(result.current.exams).toHaveLength(1));
    expect(result.current.queryClient).toBeDefined();
    expect(result.current.selectedExamId).toBe(PROVA_ID);
  });

  it("controla prova selecionada isoladamente", () => {
    const { result } = renderHook(() => useProvaSelecionada());

    act(() => {
      result.current.setSelectedExam({
        id: "draft-1",
        title: "Rascunho",
        modalidade: "online",
        discipline: "Matematica",
        subject: "Matematica",
        turma: "A",
        semester: "2026.1",
        badge: "Rascunho",
        submissions: "0",
      });
      result.current.setShowCompletionModal(true);
      result.current.setCurrentQuestaoId(QUESTAO_ID);
    });

    expect(result.current.selectedExamId).toBeNull();
    expect(result.current.showCompletionModal).toBe(true);
    expect(result.current.currentQuestaoId).toBe(QUESTAO_ID);
  });
});
