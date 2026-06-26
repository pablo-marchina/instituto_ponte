import { z } from "zod";

export const createProfessorBodySchema = z
  .object({
    nome: z.string().trim().min(1, "O nome é obrigatório.").describe("Nome completo do professor."),
    email: z.string().email("E-mail inválido.").describe("E-mail do professor (usado no login OAuth)."),
    coordenadorId: z.string().uuid("O coordenadorId deve ser um UUID válido.").describe("Identificador único do coordenador responsável."),
  })
  .strict();

export const updateProfessorBodySchema = z
  .object({
    nome: z.string().trim().min(1, "O nome é obrigatório.").optional().describe("Nome completo do professor."),
    email: z.string().email("E-mail inválido.").optional().describe("E-mail do professor."),
    coordenadorId: z.string().uuid("O coordenadorId deve ser um UUID válido.").optional().describe("Identificador único do coordenador responsável."),
  })
  .strict();

export const professorParamsSchema = z.object({
  professorId: z.string().uuid("O professorId deve ser um UUID válido.").describe("Identificador único do professor."),
});

export const professorResponseSchema = z.object({
  id: z.string().uuid().describe("Identificador único do professor."),
  nome: z.string().describe("Nome completo do professor."),
  email: z.string().describe("E-mail do professor."),
  coordenadorId: z.string().uuid().describe("Identificador único do coordenador responsável."),
  criadoEm: z.string().datetime().describe("Data e hora de criação."),
  atualizadoEm: z.string().datetime().describe("Data e hora da última atualização."),
});

export const professorMateriaResponseSchema = z.object({
  id: z.string().uuid().describe("Identificador único da matéria."),
  nome: z.string().describe("Nome da matéria."),
  codigo: z.string().nullable().describe("Código da matéria."),
  descricao: z.string().nullable().describe("Descrição da matéria."),
  criadoEm: z.string().datetime().describe("Data e hora de criação."),
  atualizadoEm: z.string().datetime().describe("Data e hora da última atualização."),
});

export type CreateProfessorInput = z.infer<typeof createProfessorBodySchema>;
export type UpdateProfessorInput = z.infer<typeof updateProfessorBodySchema>;
