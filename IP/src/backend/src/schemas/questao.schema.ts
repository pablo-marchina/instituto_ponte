import { z } from "zod";
import { paginationQuerySchema } from "./common.schema.js";

const requiredText = (message: string) => z.string().trim().min(1, message);

export const questaoTipoSchema = z
  .enum(["multipla_escolha", "verdadeiro_falso", "discursiva"])
  .describe("Tipo da questão: múltipla escolha, verdadeiro/falso ou discursiva.");

export const enunciadoInputSchema = z
  .object({
    conteudoLatex: requiredText("O enunciado é obrigatório.").describe("Conteúdo do enunciado em formato LaTeX."),
    urlImagem: z.string().url("A URL da imagem deve ser válida.").nullable().optional().describe("URL de imagem opcional para o enunciado."),
  })
  .strict();

export const alternativaInputSchema = z
  .object({
    ordemOriginal: z.number().int().positive("A ordem da alternativa deve ser positiva.").describe("Ordem original da alternativa."),
    conteudoLatex: requiredText("O conteúdo da alternativa é obrigatório.").describe("Conteúdo da alternativa em LaTeX."),
    urlImagem: z.string().url("A URL da imagem deve ser válida.").nullable().optional().describe("URL de imagem opcional."),
    correta: z.boolean().describe("Indica se esta é a alternativa correta."),
  })
  .strict();

export const createQuestaoBodySchema = z
  .object({
    materiaId: z.string().uuid("O materiaId deve ser um UUID válido.").describe("Identificador único da matéria."),
    temaId: z.string().uuid("O temaId deve ser um UUID válido.").nullable().optional().describe("Identificador único do tema."),
    tipo: questaoTipoSchema,
    limiteCaracteres: z.number().int().positive("O limite de caracteres deve ser positivo.").nullable().optional().describe("Limite máximo de caracteres (para discursivas)."),
    limitePalavras: z.number().int().positive("O limite de palavras deve ser positivo.").nullable().optional().describe("Limite máximo de palavras (para discursivas)."),
    permiteAnexo: z.boolean().optional().describe("Indica se a questão permite envio de anexos."),
    pontuacaoPadrao: z.number().positive("A pontuação padrão deve ser positiva.").optional().describe("Pontuação padrão da questão."),
    ativa: z.boolean().optional().describe("Indica se a questão está ativa no banco de questões."),
    enunciado: enunciadoInputSchema.describe("Enunciado da questão."),
    alternativas: z.array(alternativaInputSchema).optional().describe("Lista de alternativas (obrigatória para múltipla escolha e V/F)."),
  })
  .strict();

export const updateQuestaoBodySchema = createQuestaoBodySchema;

export const questaoParamsSchema = z.object({
  questaoId: z.string().uuid("O questaoId deve ser um UUID válido.").describe("Identificador único da questão."),
});

export const listQuestoesQuerySchema = paginationQuerySchema.extend({
  materiaId: z.string().uuid("O materiaId deve ser um UUID válido.").optional().describe("Filtrar por matéria."),
  temaId: z.string().uuid("O temaId deve ser um UUID válido.").optional().describe("Filtrar por tema."),
  tipo: questaoTipoSchema.optional().describe("Filtrar por tipo de questão."),
  ativa: z.coerce.boolean().optional().describe("Filtrar por status ativo/inativo."),
  busca: z.string().trim().optional().describe("Busca textual no enunciado."),
});

export const questaoResponseSchema = z.object({
  id: z.string().uuid().describe("Identificador único da questão."),
  materiaId: z.string().uuid().describe("Identificador único da matéria associada."),
  temaId: z.string().uuid().nullable().describe("Identificador único do tema associado."),
  tipo: questaoTipoSchema,
  limiteCaracteres: z.number().int().positive().nullable().describe("Limite máximo de caracteres para respostas discursivas."),
  limitePalavras: z.number().int().positive().nullable().describe("Limite máximo de palavras para respostas discursivas."),
  permiteAnexo: z.boolean().describe("Indica se a questão permite anexos nas respostas."),
  pontuacaoPadrao: z.number().describe("Pontuação padrão da questão."),
  ativa: z.boolean().describe("Indica se a questão está ativa."),
  criadoEm: z.string().datetime().describe("Data e hora de criação."),
  atualizadoEm: z.string().datetime().describe("Data e hora da última atualização."),
  enunciado: z.object({
    conteudoLatex: z.string().describe("Conteúdo do enunciado em LaTeX."),
    urlImagem: z.string().nullable().describe("URL de imagem do enunciado."),
  }).describe("Enunciado da questão."),
  alternativas: z.array(
    z.object({
      id: z.string().uuid().describe("Identificador único da alternativa."),
      ordemOriginal: z.number().int().positive().describe("Ordem original da alternativa."),
      conteudoLatex: z.string().describe("Conteúdo da alternativa em LaTeX."),
      urlImagem: z.string().nullable().describe("URL de imagem da alternativa."),
      correta: z.boolean().describe("Indica se é a alternativa correta."),
    }),
  ).describe("Lista de alternativas da questão."),
});

export type CreateQuestaoInput = z.infer<typeof createQuestaoBodySchema>;
export type UpdateQuestaoInput = z.infer<typeof updateQuestaoBodySchema>;
export type ListQuestoesQuery = z.infer<typeof listQuestoesQuerySchema>;
export type QuestaoTipo = z.infer<typeof questaoTipoSchema>;
