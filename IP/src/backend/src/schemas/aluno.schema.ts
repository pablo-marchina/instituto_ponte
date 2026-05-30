import { z } from "zod";

export const alunoParamsSchema = z.object({
  alunoId: z.string().uuid("O alunoId deve ser um UUID válido.").describe("Identificador único do aluno."),
});

export const updateAlunoBodySchema = z
  .object({
    nome: z.string().trim().min(1, "O nome é obrigatório.").optional().describe("Nome completo do aluno."),
    email: z.string().trim().email("O e-mail deve ser válido.").optional().describe("E-mail do aluno."),
    cpf: z
      .string()
      .regex(/^\d{11}$/, "O CPF deve conter 11 dígitos numéricos.")
      .nullable()
      .optional()
      .describe("CPF do aluno com 11 dígitos numéricos."),
  })
  .strict();

export const alunoResponseSchema = z.object({
  id: z.string().uuid().describe("Identificador único do aluno."),
  nome: z.string().describe("Nome completo do aluno."),
  email: z.string().email().describe("E-mail do aluno."),
  cpf: z.string().nullable().describe("CPF do aluno (11 dígitos)."),
  aceitouTermosEm: z.string().datetime().nullable().describe("Data e hora em que o aluno aceitou os termos LGPD."),
  criadoEm: z.string().datetime().describe("Data e hora de criação do registro."),
  atualizadoEm: z.string().datetime().describe("Data e hora da última atualização."),
});

export type UpdateAlunoInput = z.infer<typeof updateAlunoBodySchema>;
