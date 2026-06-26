import { z } from "zod";

export const correcaoProvaParamsSchema = z.object({
  provaId: z.string().uuid("O provaId deve ser um UUID válido.").describe("Identificador único da prova."),
});

export const correcaoRespostasParamsSchema = z.object({
  provaId: z.string().uuid("O provaId deve ser um UUID válido.").describe("Identificador único da prova."),
  questaoId: z.string().uuid("O questaoId deve ser um UUID válido.").describe("Identificador único da questão."),
});

export const correcaoRespostaParamsSchema = z.object({
  respostaId: z.string().uuid("O respostaId deve ser um UUID válido.").describe("Identificador único da resposta a ser corrigida."),
});

/**
 * Corpo para salvar uma correção manual.
 * O limite superior da nota não é validado neste schema,
 * pois depende da pontuacaoMax configurada na associação
 * prova-questão.
 */
export const salvarCorrecaoBodySchema = z
  .object({
    nota: z.number().min(0, "A nota deve ser maior ou igual a zero.").describe("Nota atribuída à resposta."),
    observacao: z.string().trim().min(1, "A observação não pode ser vazia.").optional().describe("Observação opcional do corretor sobre a resposta."),
    feedback: z.string().trim().min(1, "O feedback não pode ser vazio.").optional().describe("Feedback opcional para o aluno."),
  })
  .strict();

export const correcaoQuestaoSchema = z.object({
  questaoId: z.string().uuid().describe("Identificador único da questão."),
  ordemOriginal: z.number().int().positive().describe("Ordem da questão na prova."),
  pontuacaoMax: z.number().positive().describe("Pontuação máxima da questão."),
  tipo: z.string().describe("Tipo da questão (multipla_escolha, verdadeiro_falso, discursiva)."),
  enunciado: z.string().nullable().describe("Enunciado da questão."),
  imagemUrl: z.string().nullable().describe("Imagem associada ao enunciado da questão."),
  respostas: z.object({
    total: z.number().int().nonnegative().describe("Total de respostas enviadas para esta questão."),
    corrigidas: z.number().int().nonnegative().describe("Quantidade de respostas já corrigidas."),
  }).describe("Resumo das respostas da questão."),
});

const alternativaCorrecaoSchema = z.object({
  id: z.string().uuid().describe("Identificador único da alternativa."),
  ordemOriginal: z.number().int().positive().describe("Ordem da alternativa."),
  conteudoLatex: z.string().describe("Texto/LaTeX da alternativa."),
  urlImagem: z.string().nullable().describe("Imagem associada à alternativa."),
  correta: z.boolean().describe("Indica se a alternativa é correta."),
});

export const correcaoRespostaSchema = z.object({
  respostaId: z.string().uuid().describe("Identificador único da resposta."),
  questaoId: z.string().uuid().describe("Identificador único da questão."),
  questaoTipo: z.string().describe("Tipo da questão."),
  questaoEnunciado: z.string().nullable().describe("Enunciado da questão."),
  questaoImagemUrl: z.string().nullable().describe("Imagem do enunciado."),
  pontuacaoMax: z.number().describe("Pontuação máxima da questão na prova."),
  aluno: z.object({
    id: z.string().uuid().describe("Identificador único do aluno."),
    nome: z.string().describe("Nome do aluno."),
  }).describe("Dados do aluno que enviou a resposta."),
  respostaTexto: z.string().nullable().describe("Texto da resposta (para questões discursivas)."),
  anexos: z.array(
    z.object({
      id: z.string().uuid().describe("Identificador único do anexo."),
      urlArquivo: z.string().describe("URL do arquivo anexado."),
      mimeType: z.string().describe("Tipo MIME do arquivo."),
    }),
  ).describe("Lista de anexos enviados com a resposta."),
  alternativaSelecionada: alternativaCorrecaoSchema.nullable().describe("Alternativa marcada pelo aluno."),
  alternativaCorreta: alternativaCorrecaoSchema.nullable().describe("Alternativa correta da questão objetiva."),
  correcao: z
    .object({
      id: z.string().uuid().describe("Identificador único da correção."),
      nota: z.number().describe("Nota atribuída na correção."),
      observacao: z.string().nullable().describe("Observação do corretor."),
      tipo: z.string().describe("Tipo da correção (manual ou automática)."),
      corrigidaEm: z.string().datetime().nullable().describe("Data e hora da correção."),
    })
    .nullable()
    .describe("Dados da correção já realizada, se houver."),
});

/**
 * DTO de resposta após salvar correção manual.
 * tipo é sempre "manual", pois este schema é usado apenas
 * para correções feitas pelo professor (não automáticas).
 */
export const correcaoSalvaSchema = z.object({
  id: z.string().uuid().describe("Identificador único da correção."),
  nota: z.number().describe("Nota atribuída."),
  tipo: z.enum(["manual", "automatica"]).describe("Tipo da correção."),
  corrigidaEm: z.string().datetime().describe("Data e hora da correção."),
});

/**
 * DTO de resultado da correção automática de questões objetivas.
 * Apenas questões de múltipla escolha e verdadeiro/falso são
 * corrigidas automaticamente; discursivas permanecem pendentes
 * para correção manual do professor.
 */
export const correcaoAutomaticaSchema = z.object({
  provaId: z.string().uuid().describe("Identificador único da prova."),
  respostasCorrigidas: z.number().int().nonnegative().describe("Quantidade de respostas objetivas corrigidas automaticamente."),
  discursivasPendentes: z.number().int().nonnegative().describe("Quantidade de respostas discursivas que ainda precisam de correção manual."),
});

export type SalvarCorrecaoInput = z.infer<typeof salvarCorrecaoBodySchema>;
