import { z } from "zod";

export const errorResponseSchema = z.object({
  success: z.literal(false).describe("Indica que a requisição falhou."),
  error: z.object({
    code: z.string().describe("Código do erro (ex.: VALIDATION_ERROR, NOT_FOUND, INTERNAL_ERROR)."),
    message: z.string().describe("Mensagem descritiva do erro."),
    details: z.array(z.unknown()).optional().describe("Detalhes adicionais sobre o erro (ex.: campos inválidos)."),
  }).describe("Objeto de erro padronizado."),
});

export const emptySuccessResponseSchema = z.object({
  success: z.literal(true).describe("Indica que a requisição foi bem-sucedida."),
  data: z.object({}).optional().describe("Dados da resposta (vazio)."),
});

export const successResponseSchema = <T extends z.ZodType>(data: T) =>
  z.object({
    success: z.literal(true).describe("Indica que a requisição foi bem-sucedida."),
    data,
    meta: z.record(z.string(), z.unknown()).optional().describe("Metadados da resposta (ex.: paginação)."),
  });

export const uuidParamSchema = z.object({
  id: z.string().uuid("O id deve ser um UUID válido.").describe("Identificador único do recurso."),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).describe("Número da página (começa em 1)."),
  limit: z.coerce.number().int().positive().max(100).default(20).describe("Quantidade de itens por página (máx. 100)."),
});
