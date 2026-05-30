import { z } from "zod";

export const anexoExportarItemSchema = z.object({
  id: z.string().uuid().describe("Identificador único do anexo."),
  nomeArquivo: z.string().nullable().describe("Nome original do arquivo."),
  mimeType: z.string().describe("Tipo MIME do arquivo."),
  tamanhoBytes: z.number().int().describe("Tamanho do arquivo em bytes."),
  urlArquivo: z.string().describe("URL lógica do arquivo armazenado."),
  aluno: z.string().describe("Nome do aluno que enviou o anexo."),
  alunoId: z.string().uuid().describe("Identificador único do aluno."),
  questaoId: z.string().uuid().describe("Identificador único da questão associada."),
  respostaId: z.string().uuid().describe("Identificador único da resposta associada."),
  criadoEm: z.string().datetime().describe("Data e hora de upload do anexo."),
});

export type AnexoExportarItem = z.infer<typeof anexoExportarItemSchema>;
