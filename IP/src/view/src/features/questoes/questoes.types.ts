import type { QuestaoDto, QuestaoTipoDto } from "../provas/provas.types";

export type QuestaoPayload = {
  materiaId: string;
  temaId?: string | null;
  tipo: QuestaoTipoDto;
  dificuldade?: string;
  limiteCaracteres?: number | null;
  limitePalavras?: number | null;
  permiteAnexo?: boolean;
  pontuacaoPadrao?: number;
  ativa?: boolean;
  enunciado: {
    conteudoLatex: string;
    urlImagem?: string | null;
  };
  alternativas?: Array<{
    ordemOriginal: number;
    conteudoLatex: string;
    urlImagem?: string | null;
    correta: boolean;
  }>;
};

export type CreateQuestaoPayload = QuestaoPayload;
export type UpdateQuestaoPayload = Partial<QuestaoPayload>;

export type ListQuestoesParams = {
  materiaId?: string;
  tipo?: QuestaoTipoDto;
  busca?: string;
  ativa?: boolean;
};

export type QuestaoBancoDto = QuestaoDto;
