import { conflict, notFound } from "../errors/api-error.js";
import type { AuthUser } from "../models/auth.model.js";
import { MateriaRepository } from "../repositories/materia.repository.js";
import type { CreateMateriaInput, UpdateMateriaInput } from "../schemas/materia.schema.js";

/**
 * Gerencia matérias (disciplinas) com validação de unicidade de nome.
 *
 * A verificação de nome duplicado usa comparação case-insensitive
 * (LOWER no SQL), então "Matemática" e "matemática" são considerados
 * iguais. Na atualização, a verificação exclui a própria matéria
 * para permitir manter o mesmo nome.
 *
 * O parâmetro `_user` é ignorado nestes métodos porque qualquer
 * usuário autenticado pode gerenciar matérias (a autorização
 * granular é feita a nível de vínculo professor-matéria).
 */
export class MateriaService {
  constructor(private readonly materiaRepository = new MateriaRepository()) {}

  /**
   * Cria uma nova matéria no sistema.
   *
   * @param input - Dados da matéria a ser criada (nome, descrição opcional).
   * @param _user - Usuário autenticado (ignorado, autorização externa).
   * @returns A matéria recém-criada com seus campos preenchidos.
   * @throws conflict - Se já existir uma matéria com o mesmo nome.
   */
  async criar(input: CreateMateriaInput, _user: AuthUser) {
    const existing = await this.materiaRepository.findByName(input.nome);
    if (existing) {
      throw conflict("Já existe uma matéria com este nome.");
    }
    return this.materiaRepository.create(input);
  }

  /**
   * Lista matérias com paginação, ordenadas por nome.
   *
   * @param query - Parâmetros de paginação (page e limit opcionais).
   * @param _user - Usuário autenticado (ignorado, autorização externa).
   * @returns Lista paginada de matérias.
   */
  async listar(query: { page?: number; limit?: number }, user: AuthUser) {
    if (user.perfil === "professor") {
      return this.materiaRepository.findAllByProfessor(user.id, { page: query.page, limit: query.limit });
    }
    return this.materiaRepository.findAll({ page: query.page, limit: query.limit });
  }

  /**
   * Busca uma matéria pelo seu ID.
   *
   * @param id - Identificador único da matéria.
   * @param _user - Usuário autenticado (ignorado, autorização externa).
   * @returns A matéria encontrada com todos os seus campos.
   * @throws notFound - Se nenhuma matéria for encontrada com o ID informado.
   */
  async buscarPorId(id: string, _user: AuthUser) {
    const materia = await this.materiaRepository.findById(id);
    if (!materia) {
      throw notFound("Matéria não encontrada.");
    }
    return materia;
  }

  /**
   * Atualiza os dados de uma matéria existente.
   *
   * @param id - Identificador único da matéria a ser atualizada.
   * @param input - Dados parciais para atualização (nome, descrição).
   * @param _user - Usuário autenticado (ignorado, autorização externa).
   * @returns A matéria atualizada com os novos valores.
   * @throws notFound - Se a matéria não for encontrada.
   * @throws conflict - Se o novo nome já estiver em uso por outra matéria.
   */
  async atualizar(id: string, input: UpdateMateriaInput, _user: AuthUser) {
    const existing = await this.materiaRepository.findById(id);
    if (!existing) {
      throw notFound("Matéria não encontrada.");
    }

    if (input.nome !== undefined) {
      const duplicado = await this.materiaRepository.findByName(input.nome);
      if (duplicado && duplicado.id !== id) {
        throw conflict("Já existe uma matéria com este nome.");
      }
    }

    const updated = await this.materiaRepository.update(id, input);
    if (!updated) {
      throw notFound("Matéria não encontrada.");
    }
    return updated;
  }

  /**
   * Remove uma matéria do sistema.
   *
   * @param id - Identificador único da matéria a ser removida.
   * @param _user - Usuário autenticado (ignorado, autorização externa).
   * @throws notFound - Se a matéria não for encontrada.
   * @throws Error - Se houver dependências (temas, questões, provas) — constraint FK do banco.
   */
  async remover(id: string, _user: AuthUser) {
    const existing = await this.materiaRepository.findById(id);
    if (!existing) {
      throw notFound("Matéria não encontrada.");
    }
    await this.materiaRepository.delete(id);
  }
}
