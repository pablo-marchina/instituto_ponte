export type CorrecaoQuestaoDto = {
  questaoId: string;
  ordemOriginal: number;
  pontuacaoMax: number;
  tipo: string;
  enunciado: string | null;
  imagemUrl: string | null;
  respostas: {
    total: number;
    corrigidas: number;
  };
};

export type AnexoCorrecaoDto = {
  id: string;
  urlArquivo: string;
  mimeType: string;
};

export type CorrecaoRealizadaDto = {
  id: string;
  nota: number;
  observacao: string | null;
  tipo: string;
  corrigidaEm: string | null;
};

export type AlternativaCorrecaoDto = {
  id: string;
  ordemOriginal: number;
  conteudoLatex: string;
  urlImagem: string | null;
  correta: boolean;
};

export type CorrecaoRespostaDto = {
  respostaId: string;
  questaoId: string;
  questaoTipo: string;
  questaoEnunciado: string | null;
  questaoImagemUrl: string | null;
  pontuacaoMax: number;
  aluno: {
    id: string;
    nome: string;
  };
  respostaTexto: string | null;
  anexos: AnexoCorrecaoDto[];
  alternativaSelecionada: AlternativaCorrecaoDto | null;
  alternativaCorreta: AlternativaCorrecaoDto | null;
  correcao: CorrecaoRealizadaDto | null;
};

export type CorrecaoSalvaDto = {
  id: string;
  nota: number;
  tipo: "manual" | "automatica";
  corrigidaEm: string;
};

export type CorrecaoAutomaticaDto = {
  provaId: string;
  respostasCorrigidas: number;
  discursivasPendentes: number;
};

export type SalvarCorrecaoPayload = {
  nota: number;
  observacao?: string;
  feedback?: string;
};
