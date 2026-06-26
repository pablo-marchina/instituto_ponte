import type { Question } from "../questoes/questao.types";

export type ExamBadge = "Rascunho" | "Publicada" | "Encerrada" | "Antiga";
export type ExamDisplayStatus = ExamBadge | "Correção pendente";

export interface Exam {
  id: string;
  title: string;
  modalidade: string;
  discipline: string;
  subject: string;
  turma: string;
  semester: string;
  badge: ExamBadge;
  submissions: string;
  tempoProva?: number;
  dataInicio?: string;
  dataLimite?: string;
  orientacoes?: string;
  materiaId?: string;
  professorId?: string;
  professorName?: string;
  criadoEm?: string;
  embaralharQuestoes?: boolean;
  embaralharAlternativas?: boolean;
  urlAcesso?: string;
  qrCode?: string;
  pendingCorrections?: number;
}

export interface BancoQuestion {
  id: string;
  type: Question["type"];
  materia: string;
  materiaId: string;
  semestre: string;
  dificuldade: string;
  text: string;
  imageUrl?: string | null;
  options?: Question["options"];
  answer?: string;
  pontuacaoPadrao?: number;
  timesUsed: number;
  successRate: number;
}
