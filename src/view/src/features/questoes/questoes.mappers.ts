import type { BancoQuestion } from "../dashboard/dashboard.types";
import type { Question, QuestionType } from "./questao.types";
import type { QuestaoDto, QuestaoTipoDto } from "../provas/provas.types";
import type { CreateQuestaoPayload } from "./questoes.types";

const tipoToQuestionType: Record<QuestaoTipoDto, QuestionType> = {
  multipla_escolha: "Alternativa",
  verdadeiro_falso: "V/F",
  discursiva: "Discursiva",
};

const questionTypeToTipo: Record<QuestionType, QuestaoTipoDto> = {
  Alternativa: "multipla_escolha",
  "V/F": "verdadeiro_falso",
  Discursiva: "discursiva",
};

function numberToLetter(index: number) {
  return String.fromCharCode(64 + index);
}

function letterToNumber(letter: string, fallback: number) {
  const normalized = letter.trim().toUpperCase();
  const value = normalized.charCodeAt(0) - 64;
  return value > 0 ? value : fallback;
}

export function mapQuestaoToQuestion(questao: QuestaoDto): Question {
  const type = tipoToQuestionType[questao.tipo];

  const question: Question = {
    id: questao.id,
    type,
    text: questao.enunciado.conteudoLatex,
    options: questao.alternativas.length
      ? questao.alternativas.map((alternativa, index) => ({
        letter: numberToLetter(alternativa.ordemOriginal || index + 1),
        text: alternativa.conteudoLatex,
        correct: alternativa.correta,
        ...(alternativa.urlImagem ? { imageUrl: alternativa.urlImagem } : {}),
      }))
      : undefined,
    answer:
      type === "V/F"
        ? questao.alternativas.find((alternativa) => alternativa.correta)?.conteudoLatex
        : type === "Discursiva"
          ? "A ser corrigido"
          : undefined,
  };

  if (questao.enunciado.urlImagem) {
    question.imageUrl = questao.enunciado.urlImagem;
  }

  return question;
}

export function mapQuestaoToBancoQuestion(
  questao: QuestaoDto,
  materiaNome = "Matéria",
): BancoQuestion {
  const question = mapQuestaoToQuestion(questao);

  return {
    id: questao.id,
    type: question.type,
    materia: materiaNome,
    materiaId: questao.materiaId,
    semestre: "Banco",
    dificuldade: questao.dificuldade ?? "Média",
    text: question.text,
    imageUrl: question.imageUrl,
    options: question.options,
    answer: question.answer,
    pontuacaoPadrao: questao.pontuacaoPadrao,
    timesUsed: questao.timesUsed ?? 0,
    successRate: questao.successRate ?? 0,
  };
}

export function mapQuestionToCreateQuestaoPayload(
  question: Question,
  materiaId: string,
  pontuacaoPadrao = 1,
  dificuldade?: string,
): CreateQuestaoPayload {
  const tipo = questionTypeToTipo[question.type];

  const alternativas =
    tipo === "discursiva"
      ? []
      : tipo === "verdadeiro_falso"
        ? [
          { ordemOriginal: 1, conteudoLatex: "Verdadeiro", correta: question.answer !== "Falso" },
          { ordemOriginal: 2, conteudoLatex: "Falso", correta: question.answer === "Falso" },
        ]
        : (question.options ?? []).map((option, index) => ({
          ordemOriginal: letterToNumber(option.letter, index + 1),
          conteudoLatex: option.text,
          ...(option.imageUrl ? { urlImagem: option.imageUrl } : {}),
          correta: option.correct,
        }));

  return {
    materiaId,
    tipo,
    ...(dificuldade ? { dificuldade } : {}),
    permiteAnexo: tipo === "discursiva" ? false : undefined,
    pontuacaoPadrao,
      enunciado: {
      conteudoLatex: question.text,
      urlImagem: question.imageUrl ?? null,
    },
    alternativas,
  };
}

export function mapBancoQuestionToUpdatePayload(questao: BancoQuestion): CreateQuestaoPayload {
  return mapQuestionToCreateQuestaoPayload(
    {
      id: questao.id,
      type: questao.type,
      text: questao.text,
      imageUrl: questao.imageUrl,
      options: questao.options,
      answer: questao.answer,
    },
    questao.materiaId,
    questao.pontuacaoPadrao ?? 1,
    questao.dificuldade,
  );
}
