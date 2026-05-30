import { z } from "zod";

export const analyticsParamsSchema = z.object({
  provaId: z.string().uuid("O provaId deve ser um UUID válido.").describe("Identificador único da prova."),
});

export const analyticsDataSchema = z.object({
  provaId: z.string().uuid().describe("Identificador único da prova."),
  totalAlunos: z.number().int().nonnegative().describe("Total de alunos que iniciaram a prova."),
  acessos: z.number().int().nonnegative().describe("Número de acessos ao link da prova."),
  inicios: z.number().int().nonnegative().describe("Número de alunos que iniciaram a prova."),
  envios: z.number().int().nonnegative().describe("Número de provas enviadas (finalizadas)."),
  totalRespostas: z.number().int().nonnegative().describe("Total de respostas registradas."),
  totalAnexos: z.number().int().nonnegative().describe("Total de anexos enviados."),
  pendenciasCorrecao: z.number().int().nonnegative().describe("Total de correções pendentes."),
});

export const criarLogBodySchema = z.object({
  provaId: z.string().uuid("provaId deve ser um UUID válido.").optional().describe("Identificador único da prova relacionada ao evento."),
  provaAlunoId: z.string().uuid("provaAlunoId deve ser um UUID válido.").optional().describe("Identificador único da relação prova-aluno."),
  atorTipo: z.enum(["aluno", "professor", "coordenador", "sistema"]).describe("Tipo do ator que gerou o evento."),
  atorId: z.string().uuid("atorId deve ser um UUID válido.").optional().describe("Identificador único do ator."),
  acao: z.string().min(1, "acao é obrigatória.").describe("Descrição da ação realizada."),
  detalhes: z.record(z.string(), z.unknown()).optional().describe("Metadados adicionais do evento."),
}).strict();

export const logCriadoSchema = z.object({
  id: z.string().uuid().describe("Identificador único do log."),
  acao: z.string().describe("Descrição da ação registrada."),
  criadoEm: z.string().describe("Data e hora de criação do log."),
});

export type CriarLogInput = z.infer<typeof criarLogBodySchema>;
