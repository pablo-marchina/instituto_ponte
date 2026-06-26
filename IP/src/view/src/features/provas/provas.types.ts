export type ProvaStatusDto = "rascunho" | "publicada" | "encerrada" | "antiga";

export type ProvaDto = {
  id: string;
  professorId: string;
  materiaId: string;
  titulo: string;
  modalidade: string;
  turma: string;
  semestre: string;
  instrucoes: string | null;
  tempoLimiteMin: number | null;
  dataInicio: string | null;
  dataFim: string | null;
  embaralharQuestoes: boolean;
  embaralharAlternativas: boolean;
  status: ProvaStatusDto;
  urlAcesso: string | null;
  qrCode: string | null;
  submissoes: number;
  criadoEm: string;
  atualizadoEm: string;
  materia?: {
    id: string;
    nome: string;
  };
  professor?: {
    id: string;
    nome: string;
  };
};

export type CreateProvaPayload = {
  professorId?: string;
  materiaId: string;
  titulo: string;
  modalidade?: string;
  turma: string;
  semestre: string;
  instrucoes?: string | null;
  tempoLimiteMin?: number | null;
  dataInicio?: string | null;
  dataFim?: string | null;
  embaralharQuestoes?: boolean;
  embaralharAlternativas?: boolean;
};

export type UpdateProvaPayload = Partial<
  Pick<CreateProvaPayload, "materiaId" | "titulo" | "modalidade" | "turma" | "semestre" | "instrucoes">
>;

export type UpdateProvaConfiguracoesPayload = Partial<
  Pick<
    CreateProvaPayload,
    "tempoLimiteMin" | "dataInicio" | "dataFim" | "embaralharQuestoes" | "embaralharAlternativas"
  >
>;

export type PublicarProvaPayload = {
  baseUrlAluno: string;
  dataFim: string;
};

export type ProvaConfiguracoesDto = {
  id: string;
  tempoLimiteMin: number | null;
  dataInicio: string | null;
  dataFim: string | null;
  embaralharQuestoes: boolean;
  embaralharAlternativas: boolean;
};

export type QuestaoTipoDto = "multipla_escolha" | "verdadeiro_falso" | "discursiva";

export type QuestaoDto = {
  id: string;
  materiaId: string;
  temaId: string | null;
  tipo: QuestaoTipoDto;
  dificuldade?: string;
  limiteCaracteres: number | null;
  limitePalavras: number | null;
  permiteAnexo: boolean;
  pontuacaoPadrao: number;
  ativa: boolean;
  criadoEm: string;
  atualizadoEm: string;
  enunciado: {
    conteudoLatex: string;
    urlImagem: string | null;
  };
  alternativas: Array<{
    id: string;
    ordemOriginal: number;
    conteudoLatex: string;
    urlImagem: string | null;
    correta: boolean;
  }>;
  timesUsed?: number;
  successRate?: number;
};

export type ProvaQuestaoDto = {
  provaId: string;
  questaoId: string;
  ordemOriginal: number;
  pontuacaoMax: number;
  criadoEm: string;
  questao?: QuestaoDto;
};

export type AddQuestaoProvaPayload = {
  questaoId: string;
  ordemOriginal: number;
  pontuacaoMax?: number;
};

export type ReorderQuestaoProvaPayload = {
  ordemOriginal: number;
};
