export type ProvaPublicaDto = {
  titulo: string;
  instrucoes: string | null;
  tempoLimiteMin: number | null;
  dataInicio: string;
  dataFim: string;
  disponivel: boolean;
};

export type IniciarProvaPayload = {
  nome: string;
  email: string;
  cpf: string;
  aceiteTermos: true;
};

export type QuestaoPublicaDto = {
  id: string;
  ordem: number;
  tipo: "multipla_escolha" | "verdadeiro_falso" | "discursiva";
  permiteAnexo: boolean;
  enunciado: {
    conteudoLatex: string;
    urlImagem: string | null;
  };
  alternativas: Array<{
    id: string;
    ordem: number;
    conteudoLatex: string;
    urlImagem: string | null;
  }>;
};

export type ProvaIniciadaDto = {
  provaAlunoId: string;
  status: "em_andamento" | "enviada" | "corrigida";
  inicioEm: string;
  expiraEm: string;
  questoes: QuestaoPublicaDto[];
};

export type RespostaAlunoDto = {
  id: string;
  sincronizadaEm: string;
  rascunho: boolean;
  provaAlunoId: string;
  questaoId: string;
  alternativaId: string | null;
  respostaTexto: string | null;
};

export type SalvarRespostaPayload = {
  alternativaId?: string;
  respostaTexto?: string;
  rascunho?: boolean;
};

export type RespostaSalvaDto = {
  id: string;
  sincronizadaEm: string;
  rascunho: boolean;
};

export type EnvioFinalDto = {
  provaAlunoId: string;
  status: "enviada";
  enviadaEm: string;
  questoesEmBranco: string[];
};
