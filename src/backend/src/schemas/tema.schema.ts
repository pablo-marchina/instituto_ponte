import { z } from "zod";
import { paginationQuerySchema } from "./common.schema.js";

export const createTemaBodySchema = z
  .object({
    materiaId: z.string().uuid("O materiaId deve ser um UUID válido.").describe("Identificador único da matéria à qual o tema pertence."),
    nome: z.string().trim().min(1, "O nome é obrigatório.").describe("Nome do tema."),
    descricao: z.string().trim().nullable().optional().describe("Descrição opcional do tema."),
  })
  .strict();

export const updateTemaBodySchema = z
  .object({
    nome: z.string().trim().min(1, "O nome é obrigatório.").optional().describe("Nome do tema."),
    descricao: z.string().trim().nullable().optional().describe("Descrição do tema."),
  })
  .strict();

export const temaParamsSchema = z.object({
  temaId: z.string().uuid("O temaId deve ser um UUID válido.").describe("Identificador único do tema."),
});

export const temaResponseSchema = z.object({
  id: z.string().uuid().describe("Identificador único do tema."),
  materiaId: z.string().uuid().describe("Identificador único da matéria associada."),
  nome: z.string().describe("Nome do tema."),
  descricao: z.string().nullable().describe("Descrição do tema."),
  criadoEm: z.string().datetime().describe("Data e hora de criação."),
  atualizadoEm: z.string().datetime().describe("Data e hora da última atualização."),
});

export const listTemasQuerySchema = paginationQuerySchema.extend({
  materiaId: z.string().uuid("O materiaId deve ser um UUID válido.").optional().describe("Filtrar temas por matéria."),
});

export type CreateTemaInput = z.infer<typeof createTemaBodySchema>;
export type UpdateTemaInput = z.infer<typeof updateTemaBodySchema>;
export type ListTemasQuery = z.infer<typeof listTemasQuerySchema>;
