import { useQueryClient } from "@tanstack/react-query";
import { useBancoQuestoes } from "./useBancoQuestoes";
import { useProvaQuestoes } from "./useProvaQuestoes";
import { useProvas } from "./useProvas";
import { useProvaSelecionada } from "./useProvaSelecionada";

export function useDashboard() {
  const queryClient = useQueryClient();
  const provaSelecionada = useProvaSelecionada();

  const provas = useProvas({
    selectedExam: provaSelecionada.selectedExam,
    selectedExamId: provaSelecionada.selectedExamId,
    setExams: provaSelecionada.setExams,
    setSelectedExam: provaSelecionada.setSelectedExam,
    setShowPublishModal: provaSelecionada.setShowPublishModal,
  });

  const banco = useBancoQuestoes({
    selectedExamId: provaSelecionada.selectedExamId,
  });

  const provaQuestoes = useProvaQuestoes({
    selectedExamId: provaSelecionada.selectedExamId,
    selectedExamMateriaId: provaSelecionada.selectedExam?.materiaId,
    examQuestions: provaSelecionada.examQuestions,
    setExamQuestions: provaSelecionada.setExamQuestions,
    createQuestao: banco.createQuestaoMutation.mutateAsync,
  });

  return {
    queryClient,
    ...provaSelecionada,
    ...provas,
    ...banco,
    ...provaQuestoes,
  };
}
