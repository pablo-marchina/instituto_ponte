import { businessRule, conflict, forbidden, notFound } from "../errors/api-error.js";
import type { AuthUser } from "../middlewares/auth.js";
import { ProvaQuestaoRepository } from "../repositories/prova-questao.repository.js";
import type { AddQuestaoProvaInput } from "../schemas/prova-questao.schema.js";

export class ProvaQuestaoService {
  constructor(private readonly provaQuestaoRepository = new ProvaQuestaoRepository()) {}

  private async getProvaWithAccess(provaId: string, user: AuthUser) {
    const prova = await this.provaQuestaoRepository.findProva(provaId);
    if (!prova) {
      throw notFound("Prova não encontrada.");
    }

    const hasAccess = await this.provaQuestaoRepository.hasAccess(provaId, user);
    if (!hasAccess) {
      throw forbidden("Usuário sem permissão para acessar esta prova.");
    }

    return prova;
  }

  async adicionar(provaId: string, input: AddQuestaoProvaInput, user: AuthUser) {
    const prova = await this.getProvaWithAccess(provaId, user);
    if (prova.status !== "rascunho") {
      throw conflict("Questões só podem ser alteradas em provas com status rascunho.");
    }

    const questao = await this.provaQuestaoRepository.findQuestao(input.questaoId);
    if (!questao) {
      throw notFound("Questão não encontrada.");
    }

    if (questao.materia_id !== prova.materia_id) {
      throw businessRule("A questão não pertence à mesma matéria da prova.");
    }

    if (!questao.tem_enunciado) {
      throw businessRule("A questão precisa ter enunciado antes de ser associada à prova.");
    }

    const ordemDuplicada = await this.provaQuestaoRepository.hasOrdem(provaId, input.ordemOriginal);
    if (ordemDuplicada) {
      throw conflict("Já existe questão nessa ordem para a prova.");
    }

    const questaoDuplicada = await this.provaQuestaoRepository.hasQuestao(provaId, input.questaoId);
    if (questaoDuplicada) {
      throw conflict("Questão já vinculada à prova.");
    }

    return this.provaQuestaoRepository.create(provaId, input);
  }

  async listar(provaId: string, user: AuthUser) {
    await this.getProvaWithAccess(provaId, user);
    return this.provaQuestaoRepository.findByProva(provaId);
  }

  async remover(provaId: string, questaoId: string, user: AuthUser) {
    const prova = await this.getProvaWithAccess(provaId, user);
    if (prova.status !== "rascunho") {
      throw conflict("Questões só podem ser alteradas em provas com status rascunho.");
    }

    const questaoDuplicada = await this.provaQuestaoRepository.hasQuestao(provaId, questaoId);
    if (!questaoDuplicada) {
      throw notFound("Questão não está vinculada à prova.");
    }

    await this.provaQuestaoRepository.delete(provaId, questaoId);
  }
}
