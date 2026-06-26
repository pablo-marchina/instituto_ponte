import { z } from "zod";

export const respostaAlunoParamsSchema = z.object({
  provaAlunoId: z.string().uuid("O provaAlunoId deve ser um UUID válido.").describe("Identificador único da relação prova-aluno."),
  questaoId: z.string().uuid("O questaoId deve ser um UUID válido.").describe("Identificador único da questão."),
});

export const provaAlunoParamsSchema = z.object({
  provaAlunoId: z.string().uuid("O provaAlunoId deve ser um UUID válido.").describe("Identificador único da relação prova-aluno."),
});

export const salvarRespostaBodySchema = z
  .object({
    alternativaId: z.string().uuid("O alternativaId deve ser um UUID válido.").optional().describe("Identificador único da alternativa selecionada (para questões objetivas)."),
    respostaTexto: z.string().trim().min(1, "A resposta não pode ser vazia.").optional().describe("Texto da resposta (para questões discursivas)."),
    rascunho: z.boolean().default(true).describe("Indica se é um salvamento parcial (rascunho) ou resposta final."),
  })
  .strict();

export const enviarProvaBodySchema = z
  .object({
    confirmarEnvio: z.literal(true, "A confirmação do envio é obrigatória.").describe("Confirmação do envio final da prova (deve ser true)."),
  })
  .strict();

export const respostaSalvaSchema = z.object({
  id: z.string().uuid().describe("Identificador único da resposta."),
  sincronizadaEm: z.string().datetime().describe("Data e hora da última sincronização."),
  rascunho: z.boolean().describe("Indica se ainda é um rascunho não finalizado."),
});

export const respostaAlunoSchema = respostaSalvaSchema.extend({
  provaAlunoId: z.string().uuid().describe("Identificador único da relação prova-aluno."),
  questaoId: z.string().uuid().describe("Identificador único da questão."),
  alternativaId: z.string().uuid().nullable().describe("Identificador da alternativa selecionada (objetivas)."),
  respostaTexto: z.string().nullable().describe("Texto da resposta (discursivas)."),
});

/**
 * DTO retornado após a confirmação de envio final da prova.
 * Inclui a lista de IDs das questões que ficaram sem resposta
 * (questoesEmBranco) para registro da entrega incompleta.
 */
export const envioFinalSchema = z.object({
  provaAlunoId: z.string().uuid().describe("Identificador único da relação prova-aluno."),
  status: z.literal("enviada").describe("Status final da prova após envio."),
  enviadaEm: z.string().datetime().describe("Data e hora do envio final."),
  questoesEmBranco: z.array(z.string().uuid()).describe("Lista de IDs das questões que ficaram sem resposta."),
});

export type SalvarRespostaInput = z.infer<typeof salvarRespostaBodySchema>;
export type EnviarProvaInput = z.infer<typeof enviarProvaBodySchema>;
