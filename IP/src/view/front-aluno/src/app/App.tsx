import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  enviarProva,
  getProvaPublica,
  iniciarProva,
  listarRespostas,
  salvarResposta,
  uploadAnexo,
} from "../../../src/features/aluno/aluno.api";
import type {
  ProvaIniciadaDto,
  ProvaPublicaDto,
  QuestaoPublicaDto,
  RespostaAlunoDto,
  SalvarRespostaPayload,
} from "../../../src/features/aluno/aluno.types";
import { TelaAcesso } from "./components/TelaAcesso";
import { TelaInstrucao } from "./components/TelaInstrucao";
import { TelaProva } from "./components/TelaProva";
import { TelaRevisao } from "./components/TelaRevisao";
import { TelaPreEntrega } from "./components/TelaPreEntrega";
import { TelaConfirmacao } from "./components/TelaConfirmacao";
import { useServerTimer } from "./hooks/useServerTimer";
import { useAutosaveQueue } from "./hooks/useAutosaveQueue";
import { stripAppBasePath } from "../../../src/lib/routing";

export type Screen = "acesso" | "instrucao" | "prova" | "revisao" | "pre-entrega" | "confirmacao";

export interface Question {
  id: string;
  displayOrder: number;
  type: QuestaoPublicaDto["tipo"];
  statement: string;
  statementImage: string | null;
  answer: string;
  marked: boolean;
  alternatives: QuestaoPublicaDto["alternativas"];
  permiteAnexo: boolean;
  respostaId?: string;
}

export interface StudentInfo {
  name: string;
  email: string;
  cpf: string;
}

const WARNING_TIME = 600;

function extractUrlAcesso() {
  const path = stripAppBasePath(window.location.pathname);
  const marker = "/aluno/prova/";
  const markerIndex = path.indexOf(marker);
  if (markerIndex >= 0) {
    return decodeURIComponent(path.slice(markerIndex + marker.length).replace(/^\/+|\/+$/g, ""));
  }

  return "";
}

export function formatTime(seconds: number): string {
  const m = Math.max(1, Math.round(seconds / 60));
  return `${m} min`;
}

function hasTimeLimit(tempoLimiteMin?: number | null): tempoLimiteMin is number {
  return typeof tempoLimiteMin === "number" && tempoLimiteMin > 0;
}

function mapQuestoes(questoes: QuestaoPublicaDto[], respostas: RespostaAlunoDto[] = []): Question[] {
  const respostasByQuestao = new Map(respostas.map((resposta) => [resposta.questaoId, resposta]));

  return questoes.map((questao) => {
    const resposta = respostasByQuestao.get(questao.id);
    return {
      id: questao.id,
      displayOrder: questao.ordem,
      type: questao.tipo,
      statement: questao.enunciado.conteudoLatex,
      statementImage: questao.enunciado.urlImagem,
      answer: resposta?.alternativaId ?? resposta?.respostaTexto ?? "",
      marked: false,
      alternatives: questao.alternativas,
      permiteAnexo: questao.permiteAnexo,
      respostaId: resposta?.id,
    };
  });
}

function buildRespostaPayload(question: Question, rascunho = true): SalvarRespostaPayload | null {
  if (!question.answer.trim()) return null;

  if (question.type === "discursiva") {
    return {
      respostaTexto: question.answer.trim(),
      rascunho,
    };
  }

  return {
    alternativaId: question.answer,
    rascunho,
  };
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#F2F2F2] flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
        <p className="text-[#05245F] font-semibold">{message}</p>
      </div>
    </div>
  );
}

function ErrorState({ title, message }: { title: string; message: string }) {
  return (
    <div className="min-h-screen bg-[#F2F2F2] flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm text-center max-w-sm">
        <h1 className="text-[#05245F] font-bold text-xl mb-2">{title}</h1>
        <p className="text-[#666666] text-sm leading-relaxed">{message}</p>
      </div>
    </div>
  );
}

export default function App() {
  const urlAcesso = extractUrlAcesso();
  const [screen, setScreen] = useState<Screen>("acesso");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [studentInfo, setStudentInfo] = useState<StudentInfo>({ name: "", email: "", cpf: "" });
  const [provaAlunoId, setProvaAlunoId] = useState<string | null>(null);
  const [expiraEm, setExpiraEm] = useState<string | null>(null);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [showSubmitWarning, setShowSubmitWarning] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const questionsRef = useRef(questions);
  const provaAlunoIdRef = useRef(provaAlunoId);
  const queueAutosave = useAutosaveQueue();

  const provaPublicaQuery = useQuery({
    queryKey: ["aluno", "prova-publica", urlAcesso],
    queryFn: ({ signal }) => getProvaPublica(urlAcesso, signal),
    enabled: !!urlAcesso,
  });

  const iniciarProvaMutation = useMutation({
    mutationFn: (info: StudentInfo) =>
      iniciarProva(urlAcesso, {
        nome: info.name,
        email: info.email,
        cpf: info.cpf.replace(/\D/g, ""),
        aceiteTermos: true,
      }),
  });

  const salvarRespostaMutation = useMutation({
    mutationFn: ({ questaoId, payload }: { questaoId: string; payload: SalvarRespostaPayload }) => {
      const id = provaAlunoIdRef.current;
      if (!id) throw new Error("Prova ainda não iniciada.");
      return salvarResposta(id, questaoId, payload);
    },
    onError: (error) => setSyncError(error.message),
    onSuccess: (data, variables) => {
      setSyncError(null);
      if (data?.id) {
        setQuestions((prev) =>
          prev.map((q) => (q.id === variables.questaoId ? { ...q, respostaId: data.id } : q)),
        );
      }
    },
  });

  const uploadAnexoMutation = useMutation({
    mutationFn: async ({ respostaId, files }: { respostaId: string; files: File[] }) => {
      const results = await Promise.allSettled(files.map((file) => uploadAnexo(respostaId, file)));
      const failed = results.filter((result) => result.status === "rejected");

      if (failed.length > 0) {
        throw new Error(
          failed.length === files.length
            ? "Falha ao enviar os anexos selecionados."
            : `${files.length - failed.length} anexo(s) enviado(s), ${failed.length} falharam.`,
        );
      }

      return results.length;
    },
    onMutate: ({ files }) => {
      setUploadStatus(`Processando e enviando ${files.length} anexo(s)...`);
    },
    onSuccess: (count) => {
      setUploadStatus(`${count} anexo(s) enviado(s) com sucesso.`);
    },
    onError: (error) => {
      setUploadStatus(error instanceof Error ? error.message : "Erro ao enviar anexos.");
    },
  });

  const enviarProvaMutation = useMutation({
    mutationFn: async () => {
      const currentQuestions = questionsRef.current;
      const currentProvaAlunoId = provaAlunoIdRef.current;
      if (!currentProvaAlunoId) throw new Error("Prova ainda não iniciada.");

      await Promise.all(
        currentQuestions
          .map((question) => ({ question, payload: buildRespostaPayload(question, false) }))
          .filter((item): item is { question: Question; payload: SalvarRespostaPayload } => !!item.payload)
          .map(({ question, payload }) => salvarResposta(currentProvaAlunoId, question.id, payload)),
      );

      return enviarProva(currentProvaAlunoId);
    },
    onSuccess: () => {
      setShowSubmitWarning(false);
      setScreen("confirmacao");
    },
  });

  const timeLeft = useServerTimer(expiraEm, {
    warningAt: WARNING_TIME,
    onWarning: () => setShowTimeWarning(true),
    onExpire: () => setScreen((current) => current === "confirmacao" ? current : "pre-entrega"),
  });

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  useEffect(() => {
    provaAlunoIdRef.current = provaAlunoId;
  }, [provaAlunoId]);

  async function restoreQuestions(provaIniciada: ProvaIniciadaDto) {
    const respostas = await listarRespostas(provaIniciada.provaAlunoId).catch(() => []);
    setQuestions(mapQuestoes(provaIniciada.questoes, respostas));
  }

  const handleAcesso = async (info: StudentInfo) => {
    try {
      setStudentInfo(info);
      const provaIniciada = await iniciarProvaMutation.mutateAsync(info);
      setProvaAlunoId(provaIniciada.provaAlunoId);
      setExpiraEm(provaIniciada.expiraEm);
      await restoreQuestions(provaIniciada);

      if (provaIniciada.status === "enviada" || provaIniciada.status === "corrigida") {
        setScreen("confirmacao");
        return;
      }

      setScreen("instrucao");
    } catch {
      // Erro exposto via iniciarProvaMutation.isError no TelaAcesso
    }
  };

  const handleStart = () => {
    setScreen("prova");
  };

  const scheduleSave = (question: Question) => {
    const payload = buildRespostaPayload(question, true);
    if (!payload || !provaAlunoIdRef.current) return;

    const delay = question.type === "discursiva" ? 800 : 0;
    queueAutosave(question.id, () => {
      salvarRespostaMutation.mutate({ questaoId: question.id, payload });
    }, delay);
  };

  const handleFileUpload = (questaoId: string) => {
    const question = questions.find((q) => q.id === questaoId);
    if (!question) return;

    if (!question.respostaId) {
      const payload = buildRespostaPayload(question, true);
      if (!payload) return;

      const id = provaAlunoIdRef.current;
      if (!id) return;

      salvarRespostaMutation.mutate(
        { questaoId, payload },
        {
          onSuccess: (data) => {
            if (data?.id) {
              openFilePicker(data.id);
            }
          },
        },
      );
      return;
    }

    openFilePicker(question.respostaId);
  };

  function openFilePicker(respostaId: string) {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = ".jpg,.jpeg,.png,.pdf";
    input.onchange = () => {
      const files = Array.from(input.files ?? []);
      if (files.length > 0) {
        uploadAnexoMutation.mutate({ respostaId, files });
      }
    };
    input.click();
  }

  const updateAnswer = (index: number, answer: string) => {
    setQuestions((prev) => {
      const next = prev.map((q, i) => (i === index ? { ...q, answer } : q));
      scheduleSave(next[index]);
      return next;
    });
  };

  const toggleMark = (index: number) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, marked: !q.marked } : q)));
  };

  const goToQuestion = (index: number) => {
    setCurrentQIndex(Math.max(0, Math.min(questions.length - 1, index)));
    setScreen("prova");
  };

  const handleFinalize = () => {
    setScreen("pre-entrega");
  };

  const handleConfirm = () => {
    setShowSubmitWarning(true);
  };

  const handleSubmit = () => {
    enviarProvaMutation.mutate();
  };

  if (!urlAcesso) {
    return <ErrorState title="Link inválido" message="Abra a prova usando o link ou QR Code enviado pelo professor." />;
  }

  if (provaPublicaQuery.isLoading) {
    return <LoadingState message="Carregando prova..." />;
  }

  if (provaPublicaQuery.isError) {
    return <ErrorState title="Não foi possível abrir a prova" message={provaPublicaQuery.error.message} />;
  }

  const provaPublica = provaPublicaQuery.data as ProvaPublicaDto;
  const markedQuestions = questions.filter((q) => q.marked);
  const blankQuestions = questions.filter((q) => !q.answer.trim());
  const timerStr = hasTimeLimit(provaPublica.tempoLimiteMin) ? formatTime(timeLeft) : "Sem limite";
  const accessError = iniciarProvaMutation.isError ? iniciarProvaMutation.error.message : undefined;
  const submitError = enviarProvaMutation.isError ? enviarProvaMutation.error.message : undefined;

  return (
    <div className="min-h-screen bg-[#F2F2F2] flex justify-center">
      <div className="w-full max-w-[480px] min-h-screen flex flex-col relative bg-[#F2F2F2]">
        {screen === "acesso" && (
          <TelaAcesso
            onNext={handleAcesso}
            isLoading={iniciarProvaMutation.isPending}
            errorMessage={accessError}
          />
        )}

        {screen === "instrucao" && (
          <TelaInstrucao prova={provaPublica} onStart={handleStart} />
        )}

        {screen === "prova" && (
          <TelaProva
            questions={questions}
            currentQIndex={currentQIndex}
            timeLeft={timerStr}
            showTimeWarning={showTimeWarning}
            studentInfo={studentInfo}
            syncMessage={
              salvarRespostaMutation.isPending
                ? "Salvando rascunho..."
                : syncError
                  ? syncError
                  : undefined
            }
            uploadMessage={
              uploadAnexoMutation.isPending ? uploadStatus ?? "Processando e enviando anexos..." : uploadStatus ?? undefined
            }
            onAnswerChange={updateAnswer}
            onToggleMark={toggleMark}
            onNext={() => {
              if (currentQIndex < questions.length - 1) setCurrentQIndex((c) => c + 1);
            }}
            onPrev={() => {
              if (currentQIndex > 0) setCurrentQIndex((c) => c - 1);
            }}
            onFinalize={handleFinalize}
            onGoToQuestion={goToQuestion}
            onReviewMarked={() => setScreen("revisao")}
            onDismissTimeWarning={() => setShowTimeWarning(false)}
            onTimeWarningFinalize={handleFinalize}
            onFileUpload={handleFileUpload}
          />
        )}

        {screen === "revisao" && (
          <TelaRevisao
            questions={questions}
            markedQuestions={markedQuestions}
            timeLeft={timerStr}
            onGoToQuestion={goToQuestion}
            onBack={() => setScreen("prova")}
            onFinalize={handleFinalize}
          />
        )}

        {screen === "pre-entrega" && (
          <TelaPreEntrega
            questions={questions}
            blankQuestions={blankQuestions}
            timeLeft={timerStr}
            showSubmitWarning={showSubmitWarning}
            isSubmitting={enviarProvaMutation.isPending}
            errorMessage={submitError}
            onGoToQuestion={goToQuestion}
            onBack={() => setScreen("prova")}
            onConfirm={handleConfirm}
            onDismissWarning={() => setShowSubmitWarning(false)}
            onSubmit={handleSubmit}
          />
        )}

        {screen === "confirmacao" && <TelaConfirmacao studentInfo={studentInfo} />}
      </div>
    </div>
  );
}
