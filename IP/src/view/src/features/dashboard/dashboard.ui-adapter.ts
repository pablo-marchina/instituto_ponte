import type { Question } from "../questoes/questao.types";
import type { BancoQuestion, Exam } from "./dashboard.types";

const DRAFT_QUESTION_PREFIX = "draft-question-";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isDraftQuestionId(id: string) {
  return id.startsWith(DRAFT_QUESTION_PREFIX);
}

export function isPersistedId(id: string | null | undefined) {
  return typeof id === "string" && UUID_PATTERN.test(id);
}

export function isPersistedExam(exam: Pick<Exam, "id">) {
  return isPersistedId(exam.id);
}

export function getPersistedExamId(exam: Exam | null) {
  return exam && isPersistedExam(exam) ? exam.id : null;
}

export function getNextDraftQuestionId(questions: Pick<Question, "id">[]) {
  const maxDraft = questions
    .map((question) => question.id)
    .filter(isDraftQuestionId)
    .map((id) => Number.parseInt(id.replace(DRAFT_QUESTION_PREFIX, ""), 10))
    .filter(Number.isFinite)
    .reduce((max, value) => Math.max(max, value), 0);

  return `${DRAFT_QUESTION_PREFIX}${maxDraft + 1}`;
}

export function createDraftQuestionFromBanco(
  bancoQ: BancoQuestion,
  questions: Pick<Question, "id">[],
): Question {
  return {
    id: getNextDraftQuestionId(questions),
    type: bancoQ.type,
    text: bancoQ.text,
    imageUrl: bancoQ.imageUrl,
    options: bancoQ.options,
    answer: bancoQ.answer,
  };
}
