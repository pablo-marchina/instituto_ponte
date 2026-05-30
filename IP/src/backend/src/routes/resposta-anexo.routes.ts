import type { FastifyInstance } from "fastify";
import { RespostaAnexoController } from "../controllers/resposta-anexo.controller.js";
import { errorResponseSchema, successResponseSchema } from "../schemas/common.schema.js";
import { respostaAnexoParamsSchema, respostaAnexoSchema } from "../schemas/resposta-anexo.schema.js";

export async function respostaAnexoRoutes(app: FastifyInstance) {
  const controller = new RespostaAnexoController();

  app.addContentTypeParser(/^multipart\/form-data(?:;.*)?$/i, { parseAs: "buffer" }, (_request, body, done) => {
    done(null, body);
  });

  app.withTypeProvider().post(
    "/public/respostas/:respostaId/anexos",
    {
      bodyLimit: 6 * 1024 * 1024,
      schema: {
        tags: ["Anexos"],
        summary: "Fazer upload de anexo de resposta",
        description:
          "Faz upload de um arquivo anexo a uma resposta do aluno. Aceita apenas formatos JPG, PNG e PDF com tamanho máximo de 5MB. O arquivo é enviado como multipart/form-data no campo 'file'. A questão deve permitir anexos. Atende RF006/RF012/RF013/RN04/RN11.",
        params: respostaAnexoParamsSchema,
        response: {
          201: successResponseSchema(respostaAnexoSchema),
          404: errorResponseSchema,
          409: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    controller.upload,
  );
}
