import { useState } from "react";
import type { Question } from "../questoes/questao.types";
import type { Exam } from "./dashboard.types";
import { getPersistedExamId } from "./dashboard.ui-adapter";

export function useProvaSelecionada() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [currentQuestaoId, setCurrentQuestaoId] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);

  const selectedExamId = getPersistedExamId(selectedExam);

  return {
    exams,
    setExams,
    examQuestions,
    setExamQuestions,
    currentQuestaoId,
    setCurrentQuestaoId,
    selectedExam,
    setSelectedExam,
    showCompletionModal,
    setShowCompletionModal,
    showPublishModal,
    setShowPublishModal,
    selectedExamId,
  };
}
