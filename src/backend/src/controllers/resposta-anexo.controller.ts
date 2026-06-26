import type { FastifyReply, FastifyRequest } from "fastify";
import { parseSingleMultipartFile } from "../helpers/multipart.js";
import { sendCreated } from "../helpers/http.js";
import { RespostaAnexoService } from "../services/resposta-anexo.service.js";

export class RespostaAnexoController {
  constructor(private readonly respostaAnexoService = new RespostaAnexoService()) {}

  upload = async (request: FastifyRequest, reply: FastifyReply) => {
    const { respostaId } = request.params as { respostaId: string };
    const contentType = request.headers["content-type"] ?? "";
    const file = parseSingleMultipartFile(request.body as Buffer, contentType);
    return sendCreated(reply, await this.respostaAnexoService.salvarAnexo(respostaId, file));
  };
}
