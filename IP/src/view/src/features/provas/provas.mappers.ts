import type { Exam, ExamBadge } from "../dashboard/dashboard.types";
import type { Question, QuestionType } from "../questoes/questao.types";
import type { ProvaDto, ProvaQuestaoDto, ProvaStatusDto, QuestaoTipoDto } from "./provas.types";

const statusToBadge: Record<ProvaStatusDto, ExamBadge> = {
  rascunho: "Rascunho",
  publicada: "Publicada",
  encerrada: "Encerrada",
  antiga: "Antiga",
};

const badgeToStatus: Record<ExamBadge, ProvaStatusDto> = {
  Rascunho: "rascunho",
  Publicada: "publicada",
  Encerrada: "encerrada",
  Antiga: "antiga",
};

export function mapProvaToExam(prova: ProvaDto): Exam {
  const materiaNome = prova.materia?.nome ?? "Matéria";

  return {
    id: prova.id,
    title: prova.titulo,
    modalidade: prova.modalidade,
    discipline: materiaNome,
    subject: materiaNome,
    turma: prova.turma,
    semester: prova.semestre,
    badge: statusToBadge[prova.status],
    submissions: String(prova.submissoes ?? 0),
    tempoProva: prova.tempoLimiteMin ?? undefined,
    dataInicio: prova.dataInicio ?? undefined,
    dataLimite: prova.dataFim ?? undefined,
    orientacoes: prova.instrucoes ?? undefined,
    materiaId: prova.materiaId,
    professorId: prova.professorId,
    professorName: prova.professor?.nome,
    criadoEm: prova.criadoEm,
    embaralharQuestoes: prova.embaralharQuestoes,
    embaralharAlternativas: prova.embaralharAlternativas,
    urlAcesso: prova.urlAcesso ?? undefined,
    qrCode: prova.qrCode ?? undefined,
  };
}

export function mapExamBadgeToProvaStatus(badge: ExamBadge) {
  return badgeToStatus[badge];
}

const tipoToQuestionType: Record<QuestaoTipoDto, QuestionType> = {
  multipla_escolha: "Alternativa",
  verdadeiro_falso: "V/F",
  discursiva: "Discursiva",
};

function numberToLetter(index: number) {
  return String.fromCharCode(64 + index);
}

export function mapProvaQuestaoToQuestion(item: ProvaQuestaoDto): Question {
  const questao = item.questao;
  const tipo = questao ? tipoToQuestionType[questao.tipo] : "Discursiva";

  const question: Question = {
    id: item.questaoId,
    type: tipo,
    text: questao?.enunciado.conteudoLatex ?? "",
    options: questao?.alternativas.length
      ? questao.alternativas.map((alternativa, index) => ({
        letter: numberToLetter(alternativa.ordemOriginal || index + 1),
        text: alternativa.conteudoLatex,
        correct: alternativa.correta,
        ...(alternativa.urlImagem ? { imageUrl: alternativa.urlImagem } : {}),
      }))
      : undefined,
    answer:
      tipo === "V/F"
        ? questao?.alternativas.find((alternativa) => alternativa.correta)?.conteudoLatex
        : tipo === "Discursiva"
          ? "A ser corrigido"
          : undefined,
  };

  if (questao?.enunciado.urlImagem) {
    question.imageUrl = questao.enunciado.urlImagem;
  }

  return question;
}
