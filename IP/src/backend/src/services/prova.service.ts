import { randomUUID } from "node:crypto";
import { businessRule, conflict, forbidden, notFound } from "../errors/api-error.js";
import type { AuthUser } from "../middlewares/auth.js";
import { ProvaRepository } from "../repositories/prova.repository.js";
import type {
  CreateProvaInput,
  ListProvasQuery,
  PublicarProvaInput,
  UpdateProvaConfiguracoesInput,
  UpdateProvaInput,
} from "../schemas/prova.schema.js";

const editableStatuses = new Set(["rascunho"]);

export class ProvaService {
  constructor(private readonly provaRepository = new ProvaRepository()) {}

  async create(input: CreateProvaInput, user: AuthUser) {
    if (user.perfil !== "professor") {
      throw forbidden("Somente professores podem criar provas.");
    }

    const professorId = input.professorId ?? user.id;
    if (professorId !== user.id) {
      throw forbidden("Professor não pode criar prova para outro professor.");
    }

    const professorExists = await this.provaRepository.professorExists(professorId);
    if (!professorExists) {
      throw businessRule("Professor informado não existe.");
    }

    const materiaExists = await this.provaRepository.materiaExists(input.materiaId);
    if (!materiaExists) {
      throw businessRule("Matéria informada não existe.");
    }

    const vinculado = await this.provaRepository.professorMateriaVinculados(professorId, input.materiaId);
    if (!vinculado) {
      throw forbidden("Professor informado não está vinculado à matéria informada.");
    }

    return this.provaRepository.create({
      ...input,
      professorId,
      modalidade: input.modalidade ?? "online",
    });
  }

  async listar(query: ListProvasQuery, user: AuthUser) {
    return this.provaRepository.findMany(query, user);
  }

  async buscarPorId(provaId: string, user: AuthUser) {
    const prova = await this.provaRepository.findById(provaId);
    if (!prova) {
      throw notFound("Prova não encontrada.");
    }

    const hasAccess = await this.provaRepository.hasAccess(provaId, user);
    if (!hasAccess) {
      throw forbidden("Usuário sem permissão para acessar esta prova.");
    }

    return {
      ...prova,
      questoes: [],
    };
  }

  async atualizar(provaId: string, input: UpdateProvaInput, user: AuthUser) {
    const prova = await this.buscarPorId(provaId, user);
    if (!editableStatuses.has(prova.status)) {
      throw conflict("Apenas provas em rascunho podem ser editadas.");
    }

    return this.provaRepository.update(provaId, input);
  }

  async atualizarConfiguracoes(provaId: string, input: UpdateProvaConfiguracoesInput, user: AuthUser) {
    const prova = await this.buscarPorId(provaId, user);
    if (!editableStatuses.has(prova.status)) {
      throw conflict("Apenas provas em rascunho podem ter configurações alteradas.");
    }

    const updated = await this.provaRepository.updateConfiguracoes(provaId, input);
    if (!updated) {
      throw notFound("Prova não encontrada.");
    }

    return {
      id: updated.id,
      tempoLimiteMin: updated.tempoLimiteMin,
      dataInicio: updated.dataInicio,
      dataFim: updated.dataFim,
      embaralharQuestoes: updated.embaralharQuestoes,
      embaralharAlternativas: updated.embaralharAlternativas,
    };
  }

  async publicar(provaId: string, input: PublicarProvaInput, user: AuthUser) {
    const prova = await this.buscarPorId(provaId, user);
    if (prova.status !== "rascunho") {
      throw conflict("Apenas provas em rascunho podem ser publicadas.");
    }

    if (!prova.dataInicio || !prova.dataFim) {
      throw conflict("Prova precisa ter data de início e fim para ser publicada.");
    }

    const quantidadeQuestoes = await this.provaRepository.countQuestoes(provaId);
    if (quantidadeQuestoes === 0) {
      throw conflict("Não é possível publicar uma prova sem questões.");
    }

    const objetivasInvalidas = await this.provaRepository.hasQuestoesObjetivasInvalidas(provaId);
    if (objetivasInvalidas) {
      throw conflict("Questões objetivas precisam ter alternativas válidas e gabarito.");
    }

    const baseUrl = input.baseUrlAluno.replace(/\/+$/, "");
    const urlAcesso = `${baseUrl}/${randomUUID()}`;
    const published = await this.provaRepository.publish(provaId, urlAcesso);
    if (!published) {
      throw notFound("Prova não encontrada.");
    }

    return published;
  }

  async encerrar(provaId: string, user: AuthUser) {
    const prova = await this.buscarPorId(provaId, user);
    if (prova.status !== "publicada") {
      throw conflict("Apenas provas publicadas podem ser encerradas.");
    }

    const updated = await this.provaRepository.updateStatus(provaId, "encerrada");
    if (!updated) {
      throw notFound("Prova não encontrada.");
    }
    return updated;
  }

  async arquivar(provaId: string, user: AuthUser) {
    const prova = await this.buscarPorId(provaId, user);
    if (prova.status !== "encerrada") {
      throw conflict("Apenas provas encerradas podem ser arquivadas.");
    }

    const updated = await this.provaRepository.updateStatus(provaId, "antiga");
    if (!updated) {
      throw notFound("Prova não encontrada.");
    }
    return updated;
  }

  async remover(provaId: string, user: AuthUser) {
    const prova = await this.buscarPorId(provaId, user);
    if (!editableStatuses.has(prova.status)) {
      throw conflict("Apenas provas em rascunho podem ser removidas.");
    }

    const hasSubmissions = await this.provaRepository.hasSubmissions(provaId);
    if (hasSubmissions) {
      throw conflict("Prova com submissões não pode ser removida.");
    }

    await this.provaRepository.delete(provaId);
  }

  async listarHistorico(provaId: string, user: AuthUser) {
    await this.buscarPorId(provaId, user);
    return this.provaRepository.findStatusHistorico(provaId);
  }
}
