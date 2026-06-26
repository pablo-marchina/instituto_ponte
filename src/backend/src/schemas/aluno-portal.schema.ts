import { z } from "zod";

export const alunoPortalParamsSchema = z.object({
  urlAcesso: z.string().trim().min(1, "A urlAcesso é obrigatória.").describe("Slug da URL única de acesso gerada na publicação da prova."),
});

export const iniciarProvaBodySchema = z
  .object({
    nome: z.string().trim().min(1, "O nome é obrigatório.").describe("Nome completo do aluno."),
    email: z.string().trim().email("O e-mail deve ser válido.").describe("E-mail do aluno para contato e envio de resultados."),
    cpf: z.string().regex(/^[0-9]{11}$/, "O CPF deve conter 11 dígitos numéricos.").describe("CPF do aluno com 11 dígitos numéricos."),
    aceiteTermos: z.literal(true, "O aceite dos termos é obrigatório.").describe("Aceite dos termos de uso e LGPD (deve ser true)."),
  })
  .strict();

export const provaPublicaSchema = z.object({
  titulo: z.string().describe("Título da prova exibido ao aluno."),
  instrucoes: z.string().nullable().describe("Instruções da prova."),
  tempoLimiteMin: z.number().int().positive().nullable().describe("Tempo limite em minutos para realização."),
  dataInicio: z.string().datetime().describe("Data e hora de início da janela de realização."),
  dataFim: z.string().datetime().describe("Data e hora de fim da janela de realização."),
  disponivel: z.boolean().describe("Indica se a prova está dentro do período de realização."),
});

/**
 * Questão exibida ao aluno no portal de provas.
 * Diferente da resposta interna (`questaoResponseSchema`),
 * este schema OMITE o campo `correta` das alternativas
 * para não revelar o gabarito.
 */
export const questaoPublicaSchema = z.object({
  id: z.string().uuid().describe("Identificador único da questão."),
  ordem: z.number().int().positive().describe("Ordem da questão na prova."),
  tipo: z.enum(["multipla_escolha", "verdadeiro_falso", "discursiva"]).describe("Tipo da questão."),
  permiteAnexo: z.boolean().describe("Indica se a questão permite envio de anexos pelo aluno."),
  enunciado: z.object({
    conteudoLatex: z.string().describe("Conteúdo do enunciado em LaTeX."),
    urlImagem: z.string().nullable().describe("URL de imagem do enunciado."),
  }).describe("Enunciado da questão."),
  alternativas: z.array(
    z.object({
      id: z.string().uuid().describe("Identificador único da alternativa."),
      ordem: z.number().int().positive().describe("Ordem de exibição da alternativa."),
      conteudoLatex: z.string().describe("Conteúdo da alternativa em LaTeX."),
      urlImagem: z.string().nullable().describe("URL de imagem da alternativa."),
    }),
  ).describe("Lista de alternativas disponíveis."),
});

/**
 * DTO retornado ao aluno após iniciar a prova.
 * Status reflete a visão do aluno: em_andamento (prova em aberto),
 * enviada (aguardando correção), corrigida (nota já disponível).
 */
export const provaIniciadaSchema = z.object({
  provaAlunoId: z.string().uuid().describe("Identificador único da relação prova-aluno."),
  status: z.enum(["em_andamento", "enviada", "corrigida"]).describe("Status atual da prova para este aluno."),
  inicioEm: z.string().datetime().describe("Horario do servidor em que a tentativa foi iniciada."),
  expiraEm: z.string().datetime().describe("Prazo final efetivo calculado pelo servidor."),
  questoes: z.array(questaoPublicaSchema).describe("Lista de questões da prova."),
});

export type IniciarProvaInput = z.infer<typeof iniciarProvaBodySchema>;
