export type AnexoExportarItemDto = {
  id: string;
  nomeArquivo: string | null;
  mimeType: string;
  tamanhoBytes: number;
  urlArquivo: string;
  aluno: string;
  alunoId: string;
  questaoId: string;
  respostaId: string;
  criadoEm: string;
};
