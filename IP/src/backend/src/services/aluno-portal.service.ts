import { conflict, notFound } from "../errors/api-error.js";
import { AlunoPortalRepository } from "../repositories/aluno-portal.repository.js";
import type { IniciarProvaInput } from "../schemas/aluno-portal.schema.js";

export class AlunoPortalService {
  constructor(private readonly alunoPortalRepository = new AlunoPortalRepository()) {}

  async obterProvaPublica(urlAcesso: string) {
    const prova = await this.getProvaDisponivel(urlAcesso);

    return {
      titulo: prova.titulo,
      instrucoes: prova.instrucoes,
      tempoLimiteMin: prova.tempoLimiteMin,
      dataInicio: prova.dataInicio,
      dataFim: prova.dataFim,
      disponivel: true,
    };
  }

  async iniciarProva(urlAcesso: string, input: IniciarProvaInput) {
    const prova = await this.getProvaDisponivel(urlAcesso);
    const inicio = await this.alunoPortalRepository.iniciarProva(prova.id, input);

    if (inicio.finalizada) {
      throw conflict("Já existe submissão final para esta prova e aluno.");
    }

    const questoes = await this.alunoPortalRepository.findQuestoesPublicas(prova.id);
    return {
      provaAlunoId: inicio.provaAluno.id,
      status: inicio.provaAluno.status,
      questoes,
    };
  }

  private async getProvaDisponivel(urlAcesso: string) {
    const prova = await this.alunoPortalRepository.findPublicByUrl(urlAcesso);
    if (!prova) {
      throw notFound("Link de prova não encontrado.");
    }

    if (prova.status !== "publicada" || !prova.dataInicio || !prova.dataFim) {
      throw conflict("Prova ainda não disponível ou encerrada.");
    }

    const now = Date.now();
    const inicio = new Date(prova.dataInicio).getTime();
    const fim = new Date(prova.dataFim).getTime();
    if (now < inicio || now > fim) {
      throw conflict("Prova ainda não disponível ou encerrada.");
    }

    return prova;
  }
}
