import { z } from "zod";

export const emailProvaParamsSchema = z.object({
  provaId: z.string().uuid("O provaId deve ser um UUID válido.").describe("Identificador único da prova."),
});

export const emailEnvioIdParamsSchema = z.object({
  emailEnvioId: z.string().uuid("O emailEnvioId deve ser um UUID válido.").describe("Identificador único do registro de envio de e-mail."),
});

export const liberarEmailBodySchema = z.object({
  confirmarPendencias: z.boolean().optional().default(false).describe("Confirma o envio mesmo com pendências de correção (true para prosseguir)."),
}).strict();

export const emailLiberadoSchema = z.object({
  enviados: z.number().int().nonnegative().describe("Quantidade de e-mails enviados com sucesso."),
  falhas: z.number().int().nonnegative().describe("Quantidade de e-mails com falha no envio."),
  pendentes: z.number().int().nonnegative().describe("Quantidade de alunos com pendências (não enviados)."),
});

export const emailEnvioSchema = z.object({
  id: z.string().uuid().describe("Identificador único do envio de e-mail."),
  provaAlunoId: z.string().uuid().describe("Identificador único da relação prova-aluno."),
  destinatario: z.string().email().describe("Endereço de e-mail do destinatário."),
  assunto: z.string().describe("Assunto do e-mail enviado."),
  status: z.enum(["pendente", "enviado", "erro"]).describe("Status do envio: pendente, enviado ou erro."),
  erro: z.string().nullable().describe("Mensagem de erro em caso de falha no envio."),
  enviadoEm: z.string().datetime().nullable().describe("Data e hora do envio (null se não enviado)."),
  criadoEm: z.string().datetime().describe("Data e hora de criação do registro."),
  aluno: z.object({
    id: z.string().uuid().describe("Identificador único do aluno."),
    nome: z.string().describe("Nome do aluno."),
  }).optional().describe("Dados do aluno destinatário."),
});

export type LiberarEmailInput = z.infer<typeof liberarEmailBodySchema>;
