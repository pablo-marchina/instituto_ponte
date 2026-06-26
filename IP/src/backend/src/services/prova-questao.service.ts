import { businessRule, conflict, forbidden, notFound } from "../errors/api-error.js";
import type { AuthUser } from "../models/auth.model.js";
import { ProvaQuestaoRepository } from "../repositories/prova-questao.repository.js";
import type { AddQuestaoProvaInput, ReorderQuestaoProvaInput } from "../schemas/prova-questao.schema.js";

/**
 * Gerencia a associação de questões a uma prova (tabela `prova_questao`).
 *
 * Cada registro em `prova_questao` define:
 * - A ordem em que a questão aparece na prova.
 * - A pontuação máxima (que pode substituir o valor padrão da questão).
 *
 * ## Validações ao adicionar questão
 * 1. A prova deve estar em status "rascunho".
 * 2. A questão deve pertencer à mesma matéria da prova.
 * 3. A questão precisa ter enunciado cadastrado.
 * 4. Não pode haver ordem duplicada na mesma prova.
 * 5. A questão não pode já estar vinculada à prova.
 */
export class ProvaQuestaoService {
  constructor(private readonly provaQuestaoRepository = new ProvaQuestaoRepository()) {}

  /**
   * Localiza a prova e verifica se o usuário tem permissão de acesso.
   *
   * @param provaId - Identificador único da prova.
   * @param user - Usuário autenticado.
   * @returns Dados resumo da prova (id, materia_id, status).
   * @throws notFound - Se a prova não for encontrada.
   * @throws forbidden - Se o usuário não tiver permissão para acessar a prova.
   */
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

  /**
   * Adiciona uma questão à prova.
   *
   * @param provaId - ID da prova à qual a questão será vinculada.
   * @param input.questaoId - ID da questão a ser vinculada.
   * @param input.ordemOriginal - Posição da questão na prova.
   * @param input.pontuacaoMax - Pontuação opcional (substitui o valor padrão da questão).
   * @param user - Usuário autenticado (deve ter permissão de acesso).
   * @returns O registro do vínculo criado em prova_questao.
   * @throws conflict - Se a prova não estiver em "rascunho", ordem duplicada ou questão já vinculada.
   * @throws notFound - Se a prova ou a questão não forem encontradas.
   * @throws businessRule - Se a questão não pertencer à mesma matéria da prova ou não tiver enunciado.
   */
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

  /**
   * Lista todas as questões vinculadas a uma prova na ordem definida.
   *
   * @param provaId - ID da prova.
   * @param user - Usuário autenticado (deve ter permissão de acesso).
   * @returns Lista de questões com dados completos (enunciado, tipo, pontuação).
   */
  async listar(provaId: string, user: AuthUser) {
    await this.getProvaWithAccess(provaId, user);
    return this.provaQuestaoRepository.findByProva(provaId);
  }

  async reordenar(provaId: string, questaoId: string, input: ReorderQuestaoProvaInput, user: AuthUser) {
    const prova = await this.getProvaWithAccess(provaId, user);
    if (prova.status === "encerrada" || prova.status === "antiga") {
      throw conflict("Questoes nao podem ser reordenadas em provas encerradas ou arquivadas.");
    }

    const questaoVinculada = await this.provaQuestaoRepository.hasQuestao(provaId, questaoId);
    if (!questaoVinculada) {
      throw notFound("Questao nao esta vinculada a prova.");
    }

    const updated = await this.provaQuestaoRepository.reorder(provaId, questaoId, input.ordemOriginal);
    if (!updated) {
      throw notFound("Questao nao esta vinculada a prova.");
    }
    return updated;
  }

  /**
   * Remove o vínculo de uma questão com a prova.
   *
   * @param provaId - ID da prova.
   * @param questaoId - ID da questão a ser desvinculada.
   * @param user - Usuário autenticado (deve ter permissão de acesso).
   * @throws conflict - Se a prova não estiver em status "rascunho".
   * @throws notFound - Se a questão não estiver vinculada à prova.
   */
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
