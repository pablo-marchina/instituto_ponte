import { z } from "zod";

export const createMateriaBodySchema = z
  .object({
    nome: z.string().trim().min(1, "O nome é obrigatório.").describe("Nome da matéria (ex.: Matemática)."),
    codigo: z.string().trim().min(1, "O código deve ser uma string não vazia.").nullable().optional().describe("Código opcional da matéria."),
    descricao: z.string().trim().nullable().optional().describe("Descrição opcional da matéria."),
  })
  .strict();

export const updateMateriaBodySchema = z
  .object({
    nome: z.string().trim().min(1, "O nome é obrigatório.").optional().describe("Nome da matéria."),
    codigo: z.string().trim().min(1, "O código deve ser uma string não vazia.").nullable().optional().describe("Código da matéria."),
    descricao: z.string().trim().nullable().optional().describe("Descrição da matéria."),
  })
  .strict();

export const materiaParamsSchema = z.object({
  materiaId: z.string().uuid("O materiaId deve ser um UUID válido.").describe("Identificador único da matéria."),
});

export const materiaResponseSchema = z.object({
  id: z.string().uuid().describe("Identificador único da matéria."),
  nome: z.string().describe("Nome da matéria."),
  codigo: z.string().nullable().describe("Código da matéria."),
  descricao: z.string().nullable().describe("Descrição da matéria."),
  criadoEm: z.string().datetime().describe("Data e hora de criação."),
  atualizadoEm: z.string().datetime().describe("Data e hora da última atualização."),
});

export type CreateMateriaInput = z.infer<typeof createMateriaBodySchema>;
export type UpdateMateriaInput = z.infer<typeof updateMateriaBodySchema>;
