import { z } from "zod";

export const respostaAnexoParamsSchema = z.object({
  respostaId: z.string().uuid("O respostaId deve ser um UUID válido.").describe("Identificador único da resposta à qual o anexo pertence."),
});

export const respostaAnexoSchema = z.object({
  id: z.string().uuid().describe("Identificador único do anexo."),
  urlArquivo: z.string().describe("URL lógica do arquivo armazenado."),
  mimeType: z.enum(["image/jpeg", "image/png", "application/pdf"]).describe("Tipo MIME do arquivo (JPG, PNG ou PDF)."),
  tamanhoBytes: z.number().int().positive().max(5 * 1024 * 1024).describe("Tamanho do arquivo em bytes (máx. 5MB)."),
});
