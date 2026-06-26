import { useEffect, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  arquivarProva,
  createProva,
  deleteProva,
  despublicarProva,
  getProva,
  listProvas,
  publicarProva,
  updateProva,
  updateProvaConfiguracoes,
} from "../provas/provas.api";
import { listarQuestoesCorrecao } from "../correcao/correcao.api";
import { mapProvaToExam } from "../provas/provas.mappers";
import type {
  CreateProvaPayload,
  UpdateProvaConfiguracoesPayload,
  UpdateProvaPayload,
} from "../provas/provas.types";
import type { Exam } from "./dashboard.types";
import { isPersistedExam } from "./dashboard.ui-adapter";

function toIsoOrNull(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function buildUpdateProvaPayload(exam: Exam): UpdateProvaPayload {
  return {
    materiaId: exam.materiaId,
    titulo: exam.title.trim(),
    modalidade: exam.modalidade || undefined,
    turma: exam.turma.trim(),
    semestre: exam.semester.trim(),
    instrucoes: exam.orientacoes?.trim() || null,
  };
}

function buildUpdateProvaConfiguracoesPayload(exam: Exam): UpdateProvaConfiguracoesPayload {
  return {
    tempoLimiteMin: exam.tempoProva && exam.tempoProva > 0 ? exam.tempoProva : null,
    dataInicio: toIsoOrNull(exam.dataInicio),
    dataFim: toIsoOrNull(exam.dataLimite),
    embaralharQuestoes: exam.embaralharQuestoes ?? false,
    embaralharAlternativas: exam.embaralharAlternativas ?? false,
  };
}

function getAlunoBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_ALUNO_BASE_URL as string | undefined;
  if (configuredBaseUrl) return configuredBaseUrl.replace(/\/+$/, "");
  return "https://pablo-marchina.github.io/instituto_ponte/aluno/prova";
}

function toastSuccess(message: string) {
  toast.success?.(message);
}

type UseProvasParams = {
  selectedExam: Exam | null;
  selectedExamId: string | null;
  setExams: Dispatch<SetStateAction<Exam[]>>;
  setSelectedExam: Dispatch<SetStateAction<Exam | null>>;
  setShowPublishModal: Dispatch<SetStateAction<boolean>>;
};

export function useProvas({
  selectedExam,
  selectedExamId,
  setExams,
  setSelectedExam,
  setShowPublishModal,
}: UseProvasParams) {
  const queryClient = useQueryClient();

  const provasQuery = useQuery({
    queryKey: ["provas"],
    queryFn: listProvas,
    select: (result) => result.data.map(mapProvaToExam),
  });

  const correctionQueries = useQueries({
    queries: (provasQuery.data ?? [])
      .filter(isPersistedExam)
      .map((exam) => ({
        queryKey: ["correcao", "questoes", exam.id],
        queryFn: () => listarQuestoesCorrecao(exam.id),
        enabled: !!exam.id,
      })),
  });
  const correctionSignature = correctionQueries
    .map((query) => JSON.stringify(query.data ?? null))
    .join("|");

  const pendingCorrectionsByExamId = useMemo(() => {
    const map = new Map<string, number>();
    (provasQuery.data ?? []).filter(isPersistedExam).forEach((exam, index) => {
    const stats = correctionQueries[index]?.data;
    if (!stats) return;
    const total = stats.reduce((sum, item) => sum + item.respostas.total, 0);
    const corrected = stats.reduce((sum, item) => sum + item.respostas.corrigidas, 0);
      map.set(exam.id, Math.max(0, total - corrected));
    });
    return map;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provasQuery.data, correctionSignature]);

  const provaDetailQuery = useQuery({
    queryKey: ["provas", selectedExamId],
    queryFn: () => getProva(selectedExamId ?? ""),
    enabled: !!selectedExamId,
    select: mapProvaToExam,
  });

  const createProvaMutation = useMutation({
    mutationFn: createProva,
    onSuccess: (prova) => {
      const exam = mapProvaToExam(prova);
      setExams((prev) => [exam, ...prev.filter((item) => item.id !== exam.id)]);
      void queryClient.invalidateQueries({ queryKey: ["provas"] });
      toastSuccess("Prova salva como rascunho.");
    },
  });

  const deleteProvaMutation = useMutation({
    mutationFn: deleteProva,
    onSuccess: (_data, provaId) => {
      setExams((prev) => prev.filter((exam) => exam.id !== provaId));
      if (selectedExam?.id === provaId) {
        setSelectedExam(null);
      }
      void queryClient.invalidateQueries({ queryKey: ["provas"] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Erro ao excluir prova.";
      toast.error(message);
    },
  });

  const arquivarProvaMutation = useMutation({
    mutationFn: arquivarProva,
    onSuccess: (prova) => {
      const exam = mapProvaToExam(prova);
      setExams((prev) => prev.map((item) => (item.id === exam.id ? exam : item)));
      if (selectedExam?.id === exam.id) {
        setSelectedExam(exam);
      }
      void queryClient.invalidateQueries({ queryKey: ["provas"] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Erro ao arquivar prova.";
      toast.error(message);
    },
  });

  const updateProvaMutation = useMutation({
    mutationFn: async (exam: Exam) => {
      const provaId = exam.id;
      await updateProva(provaId, buildUpdateProvaPayload(exam));
      await updateProvaConfiguracoes(provaId, buildUpdateProvaConfiguracoesPayload(exam));
      return getProva(provaId);
    },
    onSuccess: (prova) => {
      const exam = mapProvaToExam(prova);
      setExams((prev) => prev.map((item) => (item.id === exam.id ? exam : item)));
      setSelectedExam(exam);
      void queryClient.invalidateQueries({ queryKey: ["provas"] });
      void queryClient.invalidateQueries({ queryKey: ["provas", exam.id] });
      void queryClient.invalidateQueries({ queryKey: ["provas", exam.id, "questoes"] });
      toastSuccess("Prova salva com sucesso.");
    },
  });

  const publicarProvaMutation = useMutation({
    mutationFn: ({ provaId, dataFim }: { provaId: string; dataFim: string }) =>
      publicarProva(provaId, { baseUrlAluno: getAlunoBaseUrl(), dataFim }),
    onSuccess: (prova) => {
      const exam = mapProvaToExam(prova);
      setSelectedExam(exam);
      setExams((prev) => prev.map((item) => (item.id === exam.id ? exam : item)));
      setShowPublishModal(true);
      void queryClient.invalidateQueries({ queryKey: ["provas"] });
      void queryClient.invalidateQueries({ queryKey: ["provas", exam.id] });
      toastSuccess("Prova publicada com sucesso.");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Erro ao publicar prova.";
      toast.error(message);
    },
  });

  const despublicarProvaMutation = useMutation({
    mutationFn: despublicarProva,
    onSuccess: (prova) => {
      const exam = mapProvaToExam(prova);
      setSelectedExam(exam);
      setExams((prev) => prev.map((item) => (item.id === exam.id ? exam : item)));
      setShowPublishModal(false);
      void queryClient.invalidateQueries({ queryKey: ["provas"] });
      void queryClient.invalidateQueries({ queryKey: ["provas", exam.id] });
      toastSuccess("Prova retirada da publicacao.");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Erro ao tirar prova da publicacao.";
      toast.error(message);
    },
  });

  useEffect(() => {
    if (provasQuery.data) {
      setExams(provasQuery.data.map((exam) => ({
        ...exam,
        pendingCorrections: pendingCorrectionsByExamId.get(exam.id) ?? exam.pendingCorrections,
      })));
    }
  }, [provasQuery.data, pendingCorrectionsByExamId, setExams]);

  useEffect(() => {
    if (provaDetailQuery.data) {
      setSelectedExam(provaDetailQuery.data);
    }
  }, [provaDetailQuery.data, setSelectedExam]);

  async function addExam(input: CreateProvaPayload) {
    await createProvaMutation.mutateAsync(input);
  }

  async function updateExam(exam: Exam) {
    if (isPersistedExam(exam)) {
      await updateProvaMutation.mutateAsync(exam);
      return;
    }

    setExams((prev) => prev.map((e) => (e.id === exam.id ? exam : e)));
    setSelectedExam(exam);
  }

  function deleteExam(id: string) {
    deleteProvaMutation.mutate(id);
  }

  function arquivarExam(id: string) {
    arquivarProvaMutation.mutate(id);
  }

  function publishSelectedExam(dataFim?: string) {
    if (!selectedExamId) return;

    if (selectedExam?.urlAcesso) {
      setShowPublishModal(true);
      return;
    }

    if (!dataFim) {
      toast.error("Informe uma data limite futura para publicar a prova.");
      return;
    }

    publicarProvaMutation.mutate({ provaId: selectedExamId, dataFim });
  }

  function unpublishSelectedExam() {
    if (!selectedExamId) return;
    despublicarProvaMutation.mutate(selectedExamId);
  }

  return {
    provasQuery,
    provaDetailQuery,
    createProvaMutation,
    deleteProvaMutation,
    updateProvaMutation,
    publicarProvaMutation,
    despublicarProvaMutation,
    addExam,
    updateExam,
    deleteExam,
    arquivarExam,
    publishSelectedExam,
    unpublishSelectedExam,
  };
}
