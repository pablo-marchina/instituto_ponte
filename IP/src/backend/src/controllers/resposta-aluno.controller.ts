import type { FastifyReply, FastifyRequest } from "fastify";
import { sendSuccess } from "../helpers/http.js";
import type { SalvarRespostaInput } from "../schemas/resposta-aluno.schema.js";
import { RespostaAlunoService } from "../services/resposta-aluno.service.js";

export class RespostaAlunoController {
  constructor(private readonly respostaAlunoService = new RespostaAlunoService()) {}

  salvar = async (request: FastifyRequest, reply: FastifyReply) => {
    const { provaAlunoId, questaoId } = request.params as { provaAlunoId: string; questaoId: string };
    return sendSuccess(
      reply,
      await this.respostaAlunoService.salvarRascunho(provaAlunoId, questaoId, request.body as SalvarRespostaInput),
    );
  };

  listar = async (request: FastifyRequest, reply: FastifyReply) => {
    const { provaAlunoId } = request.params as { provaAlunoId: string };
    return sendSuccess(reply, await this.respostaAlunoService.listarRespostas(provaAlunoId));
  };

  enviar = async (request: FastifyRequest, reply: FastifyReply) => {
    const { provaAlunoId } = request.params as { provaAlunoId: string };
    return sendSuccess(reply, await this.respostaAlunoService.enviarFinal(provaAlunoId));
  };
}
