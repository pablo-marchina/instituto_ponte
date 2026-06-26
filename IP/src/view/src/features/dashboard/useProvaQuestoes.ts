import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  addQuestaoToProva,
  listProvaQuestoes,
  removeQuestaoFromProva,
  reorderQuestaoInProva,
} from "../provas/provas.api";
import { mapProvaQuestaoToQuestion } from "../provas/provas.mappers";
import { updateQuestao } from "../questoes/questoes.api";
import { mapQuestionToCreateQuestaoPayload, mapQuestaoToQuestion } from "../questoes/questoes.mappers";
import type { Question } from "../questoes/questao.types";
import type { CreateQuestaoPayload } from "../questoes/questoes.types";
import type { QuestaoBancoDto } from "../questoes/questoes.types";
import type { BancoQuestion } from "./dashboard.types";
import {
  createDraftQuestionFromBanco,
  getNextDraftQuestionId,
  isDraftQuestionId,
  isPersistedId,
} from "./dashboard.ui-adapter";

type UseProvaQuestoesParams = {
  selectedExamId: string | null;
  selectedExamMateriaId?: string;
  examQuestions: Question[];
  setExamQuestions: Dispatch<SetStateAction<Question[]>>;
  createQuestao: (payload: CreateQuestaoPayload) => Promise<QuestaoBancoDto>;
};

function toastSuccess(message: string) {
  toast.success?.(message);
}

function reorderQuestionsLocally(questions: Question[], questionId: string, targetOrder: number) {
  const currentIndex = questions.findIndex((question) => question.id === questionId);
  if (currentIndex === -1) return questions;
  const next = [...questions];
  const [moved] = next.splice(currentIndex, 1);
  const nextIndex = Math.min(Math.max(targetOrder - 1, 0), next.length);
  next.splice(nextIndex, 0, moved);
  return next;
}

export function useProvaQuestoes({
  selectedExamId,
  selectedExamMateriaId,
  examQuestions,
  setExamQuestions,
  createQuestao,
}: UseProvaQuestoesParams) {
  const queryClient = useQueryClient();

  const provaQuestoesQuery = useQuery({
    queryKey: ["provas", selectedExamId, "questoes"],
    queryFn: () => listProvaQuestoes(selectedExamId ?? ""),
    enabled: !!selectedExamId,
    select: (items) => items.map(mapProvaQuestaoToQuestion),
  });

  const addQuestaoProvaMutation = useMutation({
    mutationFn: ({
      provaId,
      questaoId,
      ordemOriginal,
      pontuacaoMax,
    }: {
      provaId: string;
      questaoId: string;
      ordemOriginal: number;
      pontuacaoMax?: number;
    }) => addQuestaoToProva(provaId, { questaoId, ordemOriginal, pontuacaoMax }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["provas", variables.provaId, "questoes"] });
      toastSuccess("Questão adicionada à prova.");
    },
  });

  const removeQuestaoProvaMutation = useMutation({
    mutationFn: ({ provaId, questaoId }: { provaId: string; questaoId: string }) =>
      removeQuestaoFromProva(provaId, questaoId),
    onSuccess: (_data, variables) => {
      setExamQuestions((prev) => prev.filter((question) => question.id !== variables.questaoId));
      void queryClient.invalidateQueries({ queryKey: ["provas", variables.provaId, "questoes"] });
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: ["provas"] });
    },
  });

  const reorderQuestaoProvaMutation = useMutation({
    mutationFn: ({
      provaId,
      questaoId,
      ordemOriginal,
    }: {
      provaId: string;
      questaoId: string;
      ordemOriginal: number;
    }) => reorderQuestaoInProva(provaId, questaoId, { ordemOriginal }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["provas", variables.provaId, "questoes"] });
      const previousQuestions = examQuestions;
      setExamQuestions((prev) => reorderQuestionsLocally(prev, variables.questaoId, variables.ordemOriginal));
      return { previousQuestions };
    },
    onSuccess: (items, variables) => {
      setExamQuestions(items.map(mapProvaQuestaoToQuestion));
      void queryClient.invalidateQueries({ queryKey: ["provas", variables.provaId, "questoes"] });
      toastSuccess("Ordem das questoes atualizada.");
    },
    onError: (error, variables, context) => {
      if (context?.previousQuestions) {
        setExamQuestions(context.previousQuestions);
      }
      const message = error instanceof Error ? error.message : "Erro ao atualizar ordem das questoes.";
      toast.error(message);
      void queryClient.invalidateQueries({ queryKey: ["provas", variables.provaId, "questoes"] });
    },
  });

  const updateQuestaoProvaMutation = useMutation({
    mutationFn: ({ question, materiaId }: { question: Question; materiaId: string }) =>
      updateQuestao(question.id, mapQuestionToCreateQuestaoPayload(question, materiaId)),
    onSuccess: (_questao, variables) => {
      setExamQuestions((prev) => prev.map((question) => (
        question.id === variables.question.id ? variables.question : question
      )));
      void queryClient.invalidateQueries({ queryKey: ["questoes"] });
      if (selectedExamId) {
        void queryClient.invalidateQueries({ queryKey: ["provas", selectedExamId, "questoes"] });
      }
      toastSuccess("Questao atualizada com sucesso.");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Erro ao atualizar questao.";
      toast.error(message);
    },
  });

  useEffect(() => {
    if (provaQuestoesQuery.data) {
      setExamQuestions(provaQuestoesQuery.data);
    }
  }, [provaQuestoesQuery.data, setExamQuestions]);

  function addQuestion(q: Question) {
    setExamQuestions((prev) => [...prev, { ...q, id: getNextDraftQuestionId(prev) }]);
  }

  async function addQuestions(questions: Question[]) {
    if (selectedExamId) {
      await Promise.all(
        questions
          .filter((question) => !isDraftQuestionId(question.id))
          .map((question, index) =>
            addQuestaoProvaMutation.mutateAsync({
              provaId: selectedExamId,
              questaoId: question.id,
              ordemOriginal: examQuestions.length + index + 1,
            }),
          ),
      );
      return;
    }

    setExamQuestions((prev) => {
      let nextQuestions = prev;
      const draftQuestions = questions.map((question) => {
        const nextQuestion = { ...question, id: getNextDraftQuestionId(nextQuestions) };
        nextQuestions = [...nextQuestions, nextQuestion];
        return nextQuestion;
      });
      return [...prev, ...draftQuestions];
    });
  }

  function deleteQuestion(id: string) {
    if (selectedExamId && !isDraftQuestionId(id)) {
      removeQuestaoProvaMutation.mutate({ provaId: selectedExamId, questaoId: id });
      return;
    }

    setExamQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  async function updateQuestion(question: Question) {
    if (selectedExamId && isPersistedId(question.id)) {
      if (!selectedExamMateriaId) {
        toast.error("Nao foi possivel identificar a materia da prova para atualizar a questao.");
        return;
      }
      await updateQuestaoProvaMutation.mutateAsync({ question, materiaId: selectedExamMateriaId });
      return;
    }

    setExamQuestions((prev) =>
      prev.map((q) => (q.id === question.id ? question : q))
    );
    toastSuccess("Questao atualizada com sucesso.");
  }

  function reorderQuestion(questionId: string, targetOrder: number) {
    if (selectedExamId && isPersistedId(questionId)) {
      reorderQuestaoProvaMutation.mutate({
        provaId: selectedExamId,
        questaoId: questionId,
        ordemOriginal: targetOrder,
      });
      return;
    }

    setExamQuestions((prev) => reorderQuestionsLocally(prev, questionId, targetOrder));
    toastSuccess("Ordem das questoes atualizada.");
  }

  async function createQuestionForSelectedExam(payload: CreateQuestaoPayload) {
    const questao = await createQuestao(payload);

    if (selectedExamId) {
      await addQuestaoProvaMutation.mutateAsync({
        provaId: selectedExamId,
        questaoId: questao.id,
        ordemOriginal: examQuestions.length + 1,
        pontuacaoMax: questao.pontuacaoPadrao,
      });
      return;
    }

    addQuestion(mapQuestaoToQuestion(questao));
    toastSuccess("Questão adicionada à prova.");
  }

  async function addQuestionToExam(provaId: string, bancoQ: BancoQuestion) {
    if (isPersistedId(provaId) && isPersistedId(bancoQ.id)) {
      const currentQuestoes =
        selectedExamId === provaId
          ? examQuestions
          : await queryClient.fetchQuery({
            queryKey: ["provas", provaId, "questoes"],
            queryFn: () => listProvaQuestoes(provaId),
          });

      await addQuestaoProvaMutation.mutateAsync({
        provaId,
        questaoId: bancoQ.id,
        ordemOriginal: currentQuestoes.length + 1,
        pontuacaoMax: bancoQ.pontuacaoPadrao,
      });
      return;
    }

    const newQuestion = createDraftQuestionFromBanco(bancoQ, examQuestions);
    await addQuestions([newQuestion]);
  }

  return {
    provaQuestoesQuery,
    addQuestaoProvaMutation,
    removeQuestaoProvaMutation,
    reorderQuestaoProvaMutation,
    updateQuestaoProvaMutation,
    addQuestion,
    addQuestions,
    deleteQuestion,
    updateQuestion,
    reorderQuestion,
    createQuestionForSelectedExam,
    addQuestionToExam,
  };
}
