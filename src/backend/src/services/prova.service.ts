import { randomUUID } from "node:crypto";
import { businessRule, conflict, forbidden, notFound } from "../errors/api-error.js";
import type { AuthUser } from "../models/auth.model.js";
import { ProvaRepository } from "../repositories/prova.repository.js";
import type {
  CreateProvaInput,
  ListProvasQuery,
  PublicarProvaInput,
  UpdateProvaConfiguracoesInput,
  UpdateProvaInput,
} from "../schemas/prova.schema.js";

/** Apenas provas neste status podem ser editadas/removidas. */
const editableStatuses = new Set(["rascunho"]);

/**
 * Regras de negócio para o ciclo de vida completo de uma prova.
 *
 * ## Fluxo de status
 * ```
 * rascunho → publicada → encerrada → antiga
 * ```
 *
 * Cada transição tem pré-condições específicas:
 * - **rascunho → publicada**: exige data início/fim, pelo menos uma questão,
 *   e que todas as questões objetivas tenham alternativas válidas com
 *   exatamente uma correta (gabarito). Gera uma URL única por UUID.
 * - **publicada → encerrada**: bloqueia novas respostas; correções
 *   manuais e automáticas podem então ser executadas.
 * - **encerrada → antiga**: arquivamento definitivo; a prova sai da
 *   listagem padrão.
 *
 * ## Autorização
 * - Apenas professores podem criar provas.
 * - O autor da prova ou coordenadores podem gerenciá-la.
 * - Professores vinculados à matéria via `materia_professor` também
 *   têm acesso (útil para co-criação).
 */
export class ProvaService {
  constructor(private readonly provaRepository = new ProvaRepository()) {}

  /**
   * Cria uma nova prova em status "rascunho".
   *
   * @param input - Dados da prova (título, materiaId, instrucoes, modalidade padrão "online").
   * @param user - Usuário autenticado (deve ser professor).
   * @returns A prova recém-criada com status "rascunho".
   * @throws forbidden - Se o usuário não for professor ou tentar criar prova para outro professor.
   * @throws businessRule - Se o professor ou a matéria informada não existirem.
   * @throws forbidden - Se o professor não estiver vinculado à matéria.
   */
  async create(input: CreateProvaInput, user: AuthUser) {
    if (user.perfil !== "professor") {
      throw forbidden("Somente professores podem criar provas.");
    }

    const professorId = input.professorId ?? user.id;

    if (!professorId) {
      throw businessRule("Vincule ao menos um professor a esta materia antes de criar a prova.");
    }

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

  /**
   * Lista provas com filtros e paginação.
   *
   * @param query - Filtros (status, materiaId, busca textual) e paginação.
   * @param user - Usuário autenticado (professores veem apenas provas vinculadas; coordenadores veem todas).
   * @returns Lista paginada de provas filtradas.
   */
  async listar(query: ListProvasQuery, user: AuthUser) {
    return this.provaRepository.findMany(query, user);
  }

  /**
   * Busca prova por ID com verificação de acesso.
   *
   * @param provaId - Identificador único da prova.
   * @param user - Usuário autenticado (deve ter permissão de acesso à prova).
   * @returns A prova com campo `questoes` vazio (as questões são carregadas separadamente).
   * @throws notFound - Se a prova não for encontrada.
   * @throws forbidden - Se o usuário não tiver permissão para acessar a prova.
   */
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

  /**
   * Atualiza dados da prova. Restrito a provas em status "rascunho".
   *
   * @param provaId - Identificador único da prova a ser atualizada.
   * @param input - Dados parciais para atualização (título, instrucoes, etc.).
   * @param user - Usuário autenticado (deve ter permissão de acesso).
   * @returns A prova atualizada.
   * @throws conflict - Se a prova não estiver em status "rascunho".
   * @throws notFound - Se a prova não for encontrada (via buscarPorId).
   */
  async atualizar(provaId: string, input: UpdateProvaInput, user: AuthUser) {
    const prova = await this.buscarPorId(provaId, user);
    if (!editableStatuses.has(prova.status)) {
      throw conflict("Apenas provas em rascunho podem ser editadas.");
    }

    if (input.materiaId && input.materiaId !== prova.materiaId) {
      const materiaExists = await this.provaRepository.materiaExists(input.materiaId);
      if (!materiaExists) {
        throw businessRule("Matéria informada não existe.");
      }

      const vinculado = await this.provaRepository.professorMateriaVinculados(prova.professorId, input.materiaId);
      if (!vinculado) {
        throw forbidden("Professor da prova não está vinculado à matéria informada.");
      }
    }

    const updated = await this.provaRepository.update(provaId, input);
    if (input.materiaId && input.materiaId !== prova.materiaId) {
      await this.provaRepository.removeQuestoesForaDaMateria(provaId, input.materiaId);
    }
    return updated;
  }

  /**
   * Atualiza apenas as configurações da prova (tempo, datas, embaralhamento).
   *
   * @param provaId - Identificador único da prova.
   * @param input - Configurações a serem alteradas (tempoLimiteMin, dataInicio, dataFim, embaralharQuestoes, embaralharAlternativas).
   * @param user - Usuário autenticado (deve ter permissão de acesso).
   * @returns Objeto contendo apenas os campos de configuração alterados.
   * @throws conflict - Se a prova não estiver em status "rascunho".
   * @throws notFound - Se a prova não for encontrada.
   */
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

  /**
   * Publica a prova, tornando-a acessível aos alunos via URL única.
   *
   * @param provaId - Identificador único da prova a ser publicada.
   * @param input.baseUrlAluno - Base URL do frontend do aluno (ex.: https://provas.escola.edu.br).
   * @param user - Usuário autenticado (deve ter permissão de acesso).
   * @returns A prova publicada com status "publicada" e urlAcesso gerada.
   * @throws conflict - Se a prova não estiver em "rascunho", não tiver data início/fim, não tiver questões ou tiver questões objetivas inválidas.
   * @throws notFound - Se a prova não for encontrada.
   */
  async publicar(provaId: string, input: PublicarProvaInput, user: AuthUser) {
    const prova = await this.buscarPorId(provaId, user);
    if (prova.status !== "rascunho") {
      throw conflict("Apenas provas em rascunho podem ser publicadas.");
    }

    const dataInicio = new Date();

    const dataFim = new Date(input.dataFim);
    if (Number.isNaN(dataFim.getTime()) || dataFim.getTime() <= Date.now()) {
      throw conflict("A data limite da prova deve ser futura.");
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
    const published = await this.provaRepository.publish(provaId, urlAcesso, dataInicio, dataFim);
    if (!published) {
      throw notFound("Prova não encontrada.");
    }

    return published;
  }

  /**
   * Tira uma prova publicada do ar.
   *
   * @param provaId - Identificador unico da prova.
   * @param user - Usuario autenticado (deve ter permissao de acesso).
   * @returns A prova de volta ao status "rascunho".
   * @throws conflict - Se a prova nao estiver publicada.
   */
  async despublicar(provaId: string, user: AuthUser) {
    const prova = await this.buscarPorId(provaId, user);
    if (prova.status !== "publicada") {
      throw conflict("Apenas provas publicadas podem ser tiradas da publicacao.");
    }

    const unpublished = await this.provaRepository.unpublish(provaId);
    if (!unpublished) {
      throw notFound("Prova nao encontrada.");
    }

    return unpublished;
  }

  /**
   * Encerra uma prova publicada.
   *
   * @param provaId - Identificador único da prova a ser encerrada.
   * @param user - Usuário autenticado (deve ter permissão de acesso).
   * @returns A prova com status atualizado para "encerrada".
   * @throws conflict - Se a prova não estiver em status "publicada".
   * @throws notFound - Se a prova não for encontrada.
   */
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

  /**
   * Arquiva (marca como "antiga") uma prova encerrada.
   *
   * @param provaId - Identificador único da prova a ser arquivada.
   * @param user - Usuário autenticado (deve ter permissão de acesso).
   * @returns A prova com status atualizado para "antiga".
   * @throws conflict - Se a prova não estiver em status "encerrada".
   * @throws notFound - Se a prova não for encontrada.
   */
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

  /**
   * Remove permanentemente uma prova em status "rascunho".
   *
   * @param provaId - Identificador único da prova a ser removida.
   * @param user - Usuário autenticado (deve ter permissão de acesso).
   * @throws conflict - Se a prova não estiver em "rascunho" ou se houver submissões de alunos.
   */
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

  /**
   * Retorna o histórico de transições de status da prova.
   *
   * @param provaId - Identificador único da prova.
   * @param user - Usuário autenticado (deve ter permissão de acesso).
   * @returns Lista de entradas do histórico de status (rascunho → publicada → encerrada → antiga).
   */
  async listarHistorico(provaId: string, user: AuthUser) {
    await this.buscarPorId(provaId, user);
    return this.provaRepository.findStatusHistorico(provaId);
  }
}
