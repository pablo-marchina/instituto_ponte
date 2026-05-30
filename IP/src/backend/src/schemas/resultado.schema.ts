import { z } from "zod";

export const resultadoProvaParamsSchema = z.object({
  provaId: z.string().uuid("O provaId deve ser um UUID válido.").describe("Identificador único da prova."),
});

export const exportarResultadoBodySchema = z
  .object({
    formato: z.enum(["xlsx", "csv"]).default("xlsx").describe("Formato de exportação: XLSX (planilha Excel) ou CSV (valores separados por vírgula)."),
  })
  .strict();

export const resultadoQuestaoSchema = z.object({
  questaoId: z.string().uuid().describe("Identificador único da questão."),
  nota: z.number().nullable().describe("Nota obtida na questão (null se não corrigida)."),
  status: z.enum(["corrigida", "pendente"]).describe("Status da correção da questão."),
});

export const resultadoAlunoSchema = z.object({
  aluno: z.object({
    id: z.string().uuid().describe("Identificador único do aluno."),
    nome: z.string().describe("Nome do aluno."),
    email: z.string().email().describe("E-mail do aluno."),
  }).describe("Dados do aluno."),
  notaTotal: z.number().describe("Nota total obtida pelo aluno na prova."),
  percentual: z.number().describe("Percentual de acerto (0-100)."),
  liberado: z.boolean().describe("Indica se o resultado foi liberado para o aluno."),
  pendenciasCorrecao: z.number().int().nonnegative().describe("Quantidade de questões com correção pendente."),
  questoes: z.array(resultadoQuestaoSchema).describe("Detalhamento da nota por questão."),
});

export const exportacaoResultadoSchema = z.object({
  id: z.string().uuid().describe("Identificador único da exportação."),
  urlArquivo: z.string().describe("URL do arquivo exportado."),
  formato: z.enum(["xlsx", "csv"]).describe("Formato do arquivo exportado."),
  pendenciasCorrecao: z.number().int().nonnegative().describe("Quantidade de pendências de correção no momento da exportação."),
});

export type ExportarResultadoInput = z.infer<typeof exportarResultadoBodySchema>;
