import { businessRule, conflict, notFound } from "../errors/api-error.js";
import type { AuthUser } from "../models/auth.model.js";
import { TemaRepository } from "../repositories/tema.repository.js";
import type { CreateTemaInput, UpdateTemaInput } from "../schemas/tema.schema.js";

/**
 * Gerencia temas (assuntos), que são filhos de uma matéria.
 *
 * A unicidade é por par (nome, materiaId): não podem existir dois
 * temas com o mesmo nome dentro da mesma matéria. Matérias
 * diferentes podem ter temas com nomes iguais.
 */
export class TemaService {
  constructor(private readonly temaRepository = new TemaRepository()) {}

  /**
   * Cria um novo tema vinculado a uma matéria.
   *
   * @param input - Dados do tema (nome, materiaId, descrição opcional).
   * @param _user - Usuário autenticado (ignorado, autorização externa).
   * @returns O tema recém-criado.
   * @throws businessRule - Se a matéria informada não existir.
   * @throws conflict - Se já existir um tema com o mesmo nome na mesma matéria.
   */
  async criar(input: CreateTemaInput, _user: AuthUser) {
    const materiaExists = await this.temaRepository.materiaExists(input.materiaId);
    if (!materiaExists) {
      throw businessRule("A matéria informada não existe.");
    }

    const duplicado = await this.temaRepository.findByNameAndMateria(input.nome, input.materiaId);
    if (duplicado) {
      throw conflict("Já existe um tema com este nome nesta matéria.");
    }

    return this.temaRepository.create(input);
  }

  /**
   * Lista temas com filtro opcional por matéria e paginação.
   *
   * @param query - Filtros: materiaId para filtrar por matéria, page e limit para paginação.
   * @param _user - Usuário autenticado (ignorado, autorização externa).
   * @returns Lista paginada de temas.
   */
  async listar(query: { materiaId?: string; page?: number; limit?: number }, _user: AuthUser) {
    return this.temaRepository.findAll({ materiaId: query.materiaId, page: query.page, limit: query.limit });
  }

  /**
   * Busca um tema pelo seu ID.
   *
   * @param id - Identificador único do tema.
   * @param _user - Usuário autenticado (ignorado, autorização externa).
   * @returns O tema encontrado.
   * @throws notFound - Se nenhum tema for encontrado com o ID informado.
   */
  async buscarPorId(id: string, _user: AuthUser) {
    const tema = await this.temaRepository.findById(id);
    if (!tema) {
      throw notFound("Tema não encontrado.");
    }
    return tema;
  }

  /**
   * Atualiza os dados de um tema existente.
   *
   * @param id - Identificador único do tema a ser atualizado.
   * @param input - Dados parciais para atualização (nome, descrição).
   * @param _user - Usuário autenticado (ignorado, autorização externa).
   * @returns O tema atualizado.
   * @throws notFound - Se o tema não for encontrado.
   * @throws conflict - Se o novo nome já existir em outro tema da mesma matéria.
   */
  async atualizar(id: string, input: UpdateTemaInput, _user: AuthUser) {
    const existing = await this.temaRepository.findById(id);
    if (!existing) {
      throw notFound("Tema não encontrado.");
    }

    if (input.nome !== undefined) {
      const duplicado = await this.temaRepository.findByNameAndMateria(input.nome, existing.materiaId, id);
      if (duplicado) {
        throw conflict("Já existe um tema com este nome nesta matéria.");
      }
    }

    const updated = await this.temaRepository.update(id, input);
    if (!updated) {
      throw notFound("Tema não encontrado.");
    }
    return updated;
  }

  /**
   * Remove um tema do sistema (exclusão física).
   *
   * @param id - Identificador único do tema a ser removido.
   * @param _user - Usuário autenticado (ignorado, autorização externa).
   * @throws notFound - Se o tema não for encontrado.
   */
  async remover(id: string, _user: AuthUser) {
    const existing = await this.temaRepository.findById(id);
    if (!existing) {
      throw notFound("Tema não encontrado.");
    }
    await this.temaRepository.delete(id);
  }
}
