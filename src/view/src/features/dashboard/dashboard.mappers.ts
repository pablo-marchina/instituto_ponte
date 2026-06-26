import type { Question } from "../questoes/questao.types";
import type { BancoQuestion } from "./dashboard.types";

export function convertBancoToQuestion(bancoQ: BancoQuestion): Question {
  return {
    id: bancoQ.id,
    type: bancoQ.type,
    text: bancoQ.text,
    options: bancoQ.options,
    answer: bancoQ.answer,
  };
}
