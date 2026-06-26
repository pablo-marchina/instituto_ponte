import { conflict, notFound } from "../errors/api-error.js";
import { AlunoPortalRepository } from "../repositories/aluno-portal.repository.js";
import type { IniciarProvaInput } from "../schemas/aluno-portal.schema.js";

/**
 * Ponto de entrada do aluno (sem autenticação) para acessar e
 * realizar provas através do link público gerado na publicação.
 *
 * ## Fluxo
 * 1. O aluno acessa a URL pública → `obterProvaPublica` (dados básicos).
 * 2. Informa nome/email → `iniciarProva` (cria/retoma sessão).
 * 3. Recebe as questões **sem o campo `correta`** (gabarito oculto).
 *
 * ## Retomada de sessão
 * Se o aluno já iniciou a prova antes (mesmo email), a sessão
 * existente é retomada. Se já enviou (status "enviada"/"corrigida"),
 * o acesso é bloqueado com erro.
 *
 * ## Upsert de aluno
 * O aluno é cadastrado automaticamente por email na primeira
 * tentativa de início (`INSERT ... ON CONFLICT`).
 */
export class AlunoPortalService {
  constructor(private readonly alunoPortalRepository = new AlunoPortalRepository()) {}

  /**
   * Retorna dados básicos da prova para exibição antes do início.
   *
   * @param urlAcesso - URL pública ou UUID de acesso da prova.
   * @returns Dados básicos da prova (título, instrucoes, tempoLimiteMin, dataInicio, dataFim, disponivel).
   * @throws notFound - Se o link da prova não for encontrado.
   * @throws conflict - Se a prova não estiver disponível (status ou janela de tempo).
   */
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

  /**
   * Inicia ou retoma a prova para o aluno.
   *
   * @param urlAcesso - URL pública ou UUID de acesso da prova.
   * @param input.nome - Nome do aluno.
   * @param input.email - Email do aluno (identificador único para upsert).
   * @param input.cpf - CPF opcional do aluno.
   * @returns ID da sessão (provaAlunoId), status atual e lista de questões públicas (sem gabarito).
   * @throws conflict - Se o aluno já enviou a prova (status "enviada" ou "corrigida").
   */
  async iniciarProva(urlAcesso: string, input: IniciarProvaInput) {
    const prova = await this.getProvaDisponivel(urlAcesso);
    const inicio = await this.alunoPortalRepository.iniciarProva(prova.id, input);

    if (inicio.finalizada) {
      throw conflict("Já existe submissão final para esta prova e aluno.");
    }

    const questoes = await this.alunoPortalRepository.findQuestoesPublicas(prova.id, {
      provaAlunoId: inicio.provaAluno.id,
      embaralharQuestoes: prova.embaralharQuestoes,
      embaralharAlternativas: prova.embaralharAlternativas,
    });
    return {
      provaAlunoId: inicio.provaAluno.id,
      status: inicio.provaAluno.status,
      inicioEm: inicio.provaAluno.inicio_em
        ? new Date(inicio.provaAluno.inicio_em).toISOString()
        : new Date().toISOString(),
      expiraEm: this.calculateExpiration(
        inicio.provaAluno.inicio_em,
        prova.dataFim,
        prova.tempoLimiteMin,
      ),
      questoes,
    };
  }

  private calculateExpiration(
    inicioEm: Date | string | null,
    dataFim: string | null,
    tempoLimiteMin: number | null,
  ) {
    if (!dataFim) throw conflict("Prova ainda não disponível ou encerrada.");
    const windowEnd = new Date(dataFim).getTime();
    if (!inicioEm || tempoLimiteMin === null) return new Date(windowEnd).toISOString();
    const attemptEnd = new Date(inicioEm).getTime() + tempoLimiteMin * 60_000;
    return new Date(Math.min(windowEnd, attemptEnd)).toISOString();
  }

  /**
   * Valida se a prova está acessível e dentro da janela de tempo.
   *
   * @param urlAcesso - URL completa ou apenas o slug UUID da prova.
   * @returns Dados completos da prova disponível.
   * @throws notFound - Se o link da prova não for encontrado.
   * @throws conflict - Se a prova não estiver publicada ou fora da janela de data/hora.
   */
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
