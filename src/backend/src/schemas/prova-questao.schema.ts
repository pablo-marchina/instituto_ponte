import { z } from "zod";
import { questaoResponseSchema } from "./questao.schema.js";

export const provaQuestaoParamsSchema = z.object({
  provaId: z.string().uuid("O provaId deve ser um UUID válido.").describe("Identificador único da prova."),
});

export const provaQuestaoDeleteParamsSchema = provaQuestaoParamsSchema.extend({
  questaoId: z.string().uuid("O questaoId deve ser um UUID válido.").describe("Identificador único da questão."),
});

/**
 * Corpo para associar uma questão a uma prova.
 * pontuacaoMax, quando informado, substitui a pontuacaoPadrao
 * definida na questão original para esta prova específica.
 */
export const addQuestaoProvaBodySchema = z
  .object({
    questaoId: z.string().uuid("O questaoId deve ser um UUID válido.").describe("Identificador único da questão a ser adicionada."),
    ordemOriginal: z.number().int().positive("A ordem original deve ser positiva.").describe("Ordem da questão na prova."),
    pontuacaoMax: z.number().positive("A pontuação máxima deve ser positiva.").optional().describe("Pontuação máxima atribuída à questão nesta prova."),
  })
  .strict();

export const reorderQuestaoProvaBodySchema = z
  .object({
    ordemOriginal: z.number().int().positive("A nova ordem deve ser positiva.").describe("Nova ordem da questao na prova."),
  })
  .strict();

export const provaQuestaoResponseSchema = z.object({
  provaId: z.string().uuid().describe("Identificador único da prova."),
  questaoId: z.string().uuid().describe("Identificador único da questão."),
  ordemOriginal: z.number().int().positive().describe("Ordem da questão na prova."),
  pontuacaoMax: z.number().positive().describe("Pontuação máxima da questão nesta prova."),
  criadoEm: z.string().datetime().describe("Data e hora de associação da questão à prova."),
  questao: questaoResponseSchema.optional().describe("Dados completos da questão."),
});

export type AddQuestaoProvaInput = z.infer<typeof addQuestaoProvaBodySchema>;
export type ReorderQuestaoProvaInput = z.infer<typeof reorderQuestaoProvaBodySchema>;
