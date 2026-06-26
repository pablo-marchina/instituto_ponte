import { z } from "zod";

export const alunoParamsSchema = z.object({
  alunoId: z.string().uuid("O alunoId deve ser um UUID valido.").describe("Identificador unico do aluno."),
});

export const updateAlunoBodySchema = z
  .object({
    nome: z.string().trim().min(1, "O nome e obrigatorio.").optional().describe("Nome completo do aluno."),
    email: z.string().trim().email("O e-mail deve ser valido.").optional().describe("E-mail do aluno."),
    cpf: z
      .string()
      .regex(/^\d{11}$/, "O CPF deve conter 11 digitos numericos.")
      .nullable()
      .optional()
      .describe("CPF do aluno com 11 digitos numericos."),
    turma: z.string().trim().min(1, "A turma nao pode ser vazia.").nullable().optional().describe("Turma vinculada ao aluno."),
  })
  .strict();

export const alunoResponseSchema = z.object({
  id: z.string().uuid().describe("Identificador unico do aluno."),
  nome: z.string().describe("Nome completo do aluno."),
  email: z.string().email().describe("E-mail do aluno."),
  cpf: z.string().nullable().describe("CPF do aluno (11 digitos)."),
  turma: z.string().nullable().describe("Turma vinculada ao aluno."),
  aceitouTermosEm: z.string().datetime().nullable().describe("Data e hora em que o aluno aceitou os termos LGPD."),
  criadoEm: z.string().datetime().describe("Data e hora de criacao do registro."),
  atualizadoEm: z.string().datetime().describe("Data e hora da ultima atualizacao."),
});

export type UpdateAlunoInput = z.infer<typeof updateAlunoBodySchema>;
