import { z } from "zod";

export const turmaParamsSchema = z.object({
  turmaId: z.string().uuid("O turmaId deve ser um UUID valido."),
});

export const turmaBodySchema = z
  .object({
    nome: z.string().trim().min(1, "O nome da turma e obrigatorio."),
    descricao: z.string().trim().nullable().optional(),
  })
  .strict();

export const turmaResponseSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  descricao: z.string().nullable(),
  criadoEm: z.string().datetime(),
  atualizadoEm: z.string().datetime(),
});

export type TurmaInput = z.infer<typeof turmaBodySchema>;
