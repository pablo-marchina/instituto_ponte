export type ProvaAnalyticsDto = {
  provaId: string;
  totalAlunos: number;
  acessos: number;
  inicios: number;
  envios: number;
  totalRespostas: number;
  totalAnexos: number;
  pendenciasCorrecao: number;
};

export type AnalyticsSummary = {
  totalAlunos: number;
  acessos: number;
  inicios: number;
  envios: number;
  totalRespostas: number;
  totalAnexos: number;
  pendenciasCorrecao: number;
};
