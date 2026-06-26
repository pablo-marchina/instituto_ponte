export type ExportacaoResultadoDto = {
  id: string;
  urlArquivo: string;
  formato: "xlsx" | "csv";
  pendenciasCorrecao: number;
};

export type ExportarResultadoPayload = {
  formato: "xlsx" | "csv";
};
