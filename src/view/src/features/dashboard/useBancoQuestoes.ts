import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listMaterias } from "../materias/materias.api";
import { createQuestao, deleteQuestao, listQuestoes, updateQuestao } from "../questoes/questoes.api";
import { mapBancoQuestionToUpdatePayload, mapQuestaoToBancoQuestion } from "../questoes/questoes.mappers";
import type { CreateQuestaoPayload } from "../questoes/questoes.types";
import type { BancoQuestion } from "./dashboard.types";

type UseBancoQuestoesParams = {
  selectedExamId: string | null;
};

function toastSuccess(message: string) {
  toast.success?.(message);
}

export function useBancoQuestoes({ selectedExamId }: UseBancoQuestoesParams) {
  const queryClient = useQueryClient();

  const materiasQuery = useQuery({
    queryKey: ["materias"],
    queryFn: listMaterias,
    select: (result) => result.data,
  });

  const questoesQuery = useQuery({
    queryKey: ["questoes"],
    queryFn: () => listQuestoes(),
    select: (result) => result.data,
  });

  const materiaNameById = new Map(
    (materiasQuery.data ?? []).map((materia) => [materia.id, materia.nome]),
  );

  const bancoQuestoes = (questoesQuery.data ?? []).map((questao) =>
    mapQuestaoToBancoQuestion(questao, materiaNameById.get(questao.materiaId) ?? "Matéria"),
  );

  const createQuestaoMutation = useMutation({
    mutationFn: createQuestao,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["questoes"] });
      toastSuccess("Questão salva no banco.");
    },
  });

  const updateQuestaoMutation = useMutation({
    mutationFn: (questao: BancoQuestion) =>
      updateQuestao(questao.id, mapBancoQuestionToUpdatePayload(questao)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["questoes"] });
      if (selectedExamId) {
        void queryClient.invalidateQueries({ queryKey: ["provas", selectedExamId, "questoes"] });
      }
      toastSuccess("Questão atualizada com sucesso.");
    },
  });

  const deleteQuestaoMutation = useMutation({
    mutationFn: deleteQuestao,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["questoes"] });
      if (selectedExamId) {
        void queryClient.invalidateQueries({ queryKey: ["provas", selectedExamId, "questoes"] });
      }
    },
  });

  async function addBancoQuestion(payload: CreateQuestaoPayload) {
    await createQuestaoMutation.mutateAsync(payload);
  }

  async function updateBancoQuestion(questao: BancoQuestion) {
    await updateQuestaoMutation.mutateAsync(questao);
  }

  function deleteBancoQuestion(id: string) {
    deleteQuestaoMutation.mutate(id);
  }

  return {
    materiasQuery,
    questoesQuery,
    materiaNameById,
    bancoQuestoes,
    createQuestaoMutation,
    updateQuestaoMutation,
    deleteQuestaoMutation,
    addBancoQuestion,
    updateBancoQuestion,
    deleteBancoQuestion,
  };
}
