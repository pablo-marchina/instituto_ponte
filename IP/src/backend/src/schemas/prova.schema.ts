import { z } from "zod";
import { paginationQuerySchema } from "./common.schema.js";

const requiredTrimmedString = (message: string) => z.string().trim().min(1, message);
const optionalTrimmedString = (message: string) => z.string().trim().min(1, message).optional();
const nullableIsoDate = z.string().datetime("A data deve estar em formato ISO.").nullable().optional();

export const provaStatusSchema = z
  .enum(["rascunho", "publicada", "encerrada", "antiga"])
  .describe("Status atual da prova no fluxo de aplicação: rascunho → publicada → encerrada → antiga.");

export const provaSchema = z.object({
  id: z.string().uuid().describe("Identificador único da prova."),
  professorId: z.string().uuid().describe("Identificador único do professor responsável."),
  materiaId: z.string().uuid().describe("Identificador único da matéria associada."),
  titulo: z.string().describe("Título da prova."),
  modalidade: z.string().describe("Modalidade da prova (ex.: online)."),
  turma: z.string().describe("Turma à qual a prova se destina."),
  semestre: z.string().describe("Semestre letivo (ex.: 2026.1)."),
  instrucoes: z.string().nullable().describe("Instruções complementares para os alunos."),
  tempoLimiteMin: z.number().int().positive().nullable().describe("Tempo limite em minutos para realização da prova."),
  dataInicio: z.string().datetime().nullable().describe("Data e hora de início da janela de realização."),
  dataFim: z.string().datetime().nullable().describe("Data e hora de fim da janela de realização."),
  embaralharQuestoes: z.boolean().describe("Indica se as questões devem ser exibidas em ordem aleatória."),
  embaralharAlternativas: z.boolean().describe("Indica se as alternativas devem ser exibidas em ordem aleatória."),
  status: provaStatusSchema,
  urlAcesso: z.string().nullable().describe("URL única de acesso para o aluno."),
  qrCode: z.string().nullable().describe("Payload do QR Code para acesso rápido."),
  criadoEm: z.string().datetime().describe("Data e hora de criação do registro."),
  atualizadoEm: z.string().datetime().describe("Data e hora da última atualização."),
  materia: z
    .object({
      id: z.string().uuid().describe("Identificador único da matéria."),
      nome: z.string().describe("Nome da matéria."),
    })
    .optional(),
  professor: z
    .object({
      id: z.string().uuid().describe("Identificador único do professor."),
      nome: z.string().describe("Nome do professor."),
    })
    .optional(),
});

export const provaDetailSchema = provaSchema.extend({
  questoes: z.array(z.unknown()).default([]).describe("Lista de questões associadas à prova."),
});

export const provaHistoricoSchema = z.object({
  id: z.string().uuid().describe("Identificador único do registro de histórico."),
  statusAnterior: provaStatusSchema.nullable().describe("Status anterior da prova antes da transição."),
  statusNovo: provaStatusSchema.describe("Novo status da prova após a transição."),
  criadoEm: z.string().datetime().describe("Data e hora da transição de status."),
});

export const provaConfiguracoesSchema = z.object({
  id: z.string().uuid().describe("Identificador único da prova."),
  tempoLimiteMin: z.number().int().positive().nullable().describe("Tempo limite em minutos para realização da prova."),
  dataInicio: z.string().datetime().nullable().describe("Data e hora de início da janela de realização."),
  dataFim: z.string().datetime().nullable().describe("Data e hora de fim da janela de realização."),
  embaralharQuestoes: z.boolean().describe("Indica se as questões devem ser exibidas em ordem aleatória."),
  embaralharAlternativas: z.boolean().describe("Indica se as alternativas devem ser exibidas em ordem aleatória."),
});

const createProvaShape = {
    professorId: z.string().uuid("O professorId deve ser um UUID válido.").optional().describe("Identificador único do professor (opcional, obtido do token se não informado)."),
    materiaId: z.string().uuid("O materiaId deve ser um UUID válido.").describe("Identificador único da matéria da prova."),
    titulo: requiredTrimmedString("O título é obrigatório.").describe("Título da prova."),
    modalidade: optionalTrimmedString("A modalidade não pode ser vazia.").describe("Modalidade da prova (ex.: online)."),
    turma: requiredTrimmedString("A turma é obrigatória.").describe("Turma à qual a prova se destina."),
    semestre: requiredTrimmedString("O semestre é obrigatório.").describe("Semestre letivo (ex.: 2026.1)."),
    instrucoes: z.string().nullable().optional().describe("Instruções complementares para os alunos."),
    tempoLimiteMin: z.number().int().positive("O tempo limite deve ser positivo.").nullable().optional().describe("Tempo limite em minutos para realização da prova."),
    dataInicio: nullableIsoDate.describe("Data e hora de início da janela de realização (formato ISO)."),
    dataFim: nullableIsoDate.describe("Data e hora de fim da janela de realização (formato ISO)."),
    embaralharQuestoes: z.boolean().optional().describe("Indica se as questões devem ser exibidas em ordem aleatória."),
    embaralharAlternativas: z.boolean().optional().describe("Indica se as alternativas devem ser exibidas em ordem aleatória."),
};

const validDateRange = (data: { dataInicio?: string | null; dataFim?: string | null }) =>
  !data.dataInicio || !data.dataFim || new Date(data.dataFim) > new Date(data.dataInicio);

export const createProvaBodySchema = z
  .object(createProvaShape)
  .strict()
  .refine(validDateRange, {
    path: ["dataFim"],
    message: "A data final deve ser maior que a data inicial.",
  });

export const updateProvaBodySchema = z
  .object({
    titulo: createProvaShape.titulo,
    modalidade: createProvaShape.modalidade,
    turma: createProvaShape.turma,
    semestre: createProvaShape.semestre,
    instrucoes: createProvaShape.instrucoes,
    tempoLimiteMin: createProvaShape.tempoLimiteMin,
    dataInicio: createProvaShape.dataInicio,
    dataFim: createProvaShape.dataFim,
    embaralharQuestoes: createProvaShape.embaralharQuestoes,
    embaralharAlternativas: createProvaShape.embaralharAlternativas,
  })
  .partial()
  .strict()
  .refine(validDateRange, {
    path: ["dataFim"],
    message: "A data final deve ser maior que a data inicial.",
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe ao menos um campo para atualização.",
  });

export const updateProvaConfiguracoesBodySchema = z
  .object({
    tempoLimiteMin: createProvaShape.tempoLimiteMin,
    dataInicio: createProvaShape.dataInicio,
    dataFim: createProvaShape.dataFim,
    embaralharQuestoes: createProvaShape.embaralharQuestoes,
    embaralharAlternativas: createProvaShape.embaralharAlternativas,
  })
  .partial()
  .strict()
  .refine(validDateRange, {
    path: ["dataFim"],
    message: "A data final deve ser maior que a data inicial.",
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe ao menos um campo para atualização.",
  });

export const publicarProvaBodySchema = z
  .object({
    baseUrlAluno: z.string().url("A baseUrlAluno deve ser uma URL válida.").describe("URL base do frontend para gerar o link de acesso do aluno."),
  })
  .strict();

export const provaParamsSchema = z.object({
  provaId: z.string().uuid("O provaId deve ser um UUID válido.").describe("Identificador único da prova."),
});

export const listProvasQuerySchema = paginationQuerySchema.extend({
  status: provaStatusSchema.optional().describe("Filtrar por status da prova."),
  turma: z.string().optional().describe("Filtrar por turma."),
  semestre: z.string().optional().describe("Filtrar por semestre letivo."),
  materiaId: z.string().uuid("O materiaId deve ser um UUID válido.").optional().describe("Filtrar por matéria."),
  professorId: z.string().uuid("O professorId deve ser um UUID válido.").optional().describe("Filtrar por professor."),
});

export type CreateProvaInput = z.infer<typeof createProvaBodySchema>;
export type UpdateProvaInput = z.infer<typeof updateProvaBodySchema>;
export type UpdateProvaConfiguracoesInput = z.infer<typeof updateProvaConfiguracoesBodySchema>;
export type PublicarProvaInput = z.infer<typeof publicarProvaBodySchema>;
export type ListProvasQuery = z.infer<typeof listProvasQuerySchema>;
export type ProvaStatus = z.infer<typeof provaStatusSchema>;
