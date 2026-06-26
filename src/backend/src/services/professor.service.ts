import { businessRule, conflict, notFound } from "../errors/api-error.js";
import type { AuthUser } from "../models/auth.model.js";
import { ProfessorRepository } from "../repositories/professor.repository.js";
import type { CreateProfessorInput, UpdateProfessorInput } from "../schemas/professor.schema.js";

/**
 * Gerencia professores e o vínculo deles com matérias.
 *
 * ## Vínculo professor-matéria (tabela `materia_professor`)
 * O vínculo é a base do modelo de autorização: um professor só
 * pode criar/editar provas e questões das matérias às quais está
 * vinculado. Coordenadores não precisam de vínculo — têm acesso total.
 *
 * ## Unicidade
 * O email do professor deve ser único. O CPF não é coletado para
 * professores (diferente de alunos).
 */
export class ProfessorService {
  constructor(private readonly repository = new ProfessorRepository()) {}

  /**
   * Cria um novo professor vinculado a um coordenador.
   *
   * @param input - Dados do professor (nome, email, coordenadorId).
   * @param _user - Usuário autenticado (ignorado, autorização externa).
   * @returns O professor recém-criado.
   * @throws businessRule - Se o coordenador informado não existir.
   * @throws conflict - Se já existir um professor com o mesmo email.
   */
  async criar(input: CreateProfessorInput, _user: AuthUser) {
    const coordExiste = await this.repository.coordenadorExists(input.coordenadorId);
    if (!coordExiste) {
      throw businessRule("O coordenador informado não existe.");
    }

    const existente = await this.repository.findByEmail(input.email);
    if (existente) {
      throw conflict("Já existe um professor com este e-mail.");
    }

    return this.repository.create(input);
  }

  /**
   * Lista professores com paginação.
   *
   * @param query - Parâmetros de paginação (page e limit opcionais).
   * @param _user - Usuário autenticado (ignorado, autorização externa).
   * @returns Lista paginada de professores.
   */
  async listar(query: { page?: number; limit?: number }, _user: AuthUser) {
    return this.repository.findAll({ page: query.page, limit: query.limit });
  }

  /**
   * Busca um professor pelo seu ID.
   *
   * @param id - Identificador único do professor.
   * @param _user - Usuário autenticado (ignorado, autorização externa).
   * @returns O professor encontrado.
   * @throws notFound - Se nenhum professor for encontrado com o ID informado.
   */
  async buscarPorId(id: string, _user: AuthUser) {
    const professor = await this.repository.findById(id);
    if (!professor) {
      throw notFound("Professor não encontrado.");
    }
    return professor;
  }

  /**
   * Atualiza os dados de um professor existente.
   *
   * @param id - Identificador único do professor a ser atualizado.
   * @param input - Dados parciais para atualização (nome, email, coordenadorId).
   * @param _user - Usuário autenticado (ignorado, autorização externa).
   * @returns O professor atualizado.
   * @throws notFound - Se o professor não for encontrado.
   * @throws conflict - Se o novo email já estiver em uso por outro professor.
   * @throws businessRule - Se o novo coordenador informado não existir.
   */
  async atualizar(id: string, input: UpdateProfessorInput, _user: AuthUser) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw notFound("Professor não encontrado.");
    }

    if (input.email !== undefined) {
      const duplicado = await this.repository.findByEmail(input.email);
      if (duplicado && duplicado.id !== id) {
        throw conflict("Já existe um professor com este e-mail.");
      }
    }

    if (input.coordenadorId !== undefined) {
      const coordExiste = await this.repository.coordenadorExists(input.coordenadorId);
      if (!coordExiste) {
        throw businessRule("O coordenador informado não existe.");
      }
    }

    const updated = await this.repository.update(id, input);
    if (!updated) {
      throw notFound("Professor não encontrado.");
    }
    return updated;
  }

  /**
   * Remove um professor do sistema (exclusão física).
   *
   * @param id - Identificador único do professor a ser removido.
   * @param _user - Usuário autenticado (ignorado, autorização externa).
   * @throws notFound - Se o professor não for encontrado.
   */
  async remover(id: string, _user: AuthUser) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw notFound("Professor não encontrado.");
    }
    const removed = await this.repository.delete(id);
    if (!removed) {
      throw conflict("Professor possui vínculos ou provas associadas e não pode ser removido.");
    }
  }

  /**
   * Vincula um professor a uma matéria.
   *
   * @param professorId - ID do professor a ser vinculado.
   * @param materiaId - ID da matéria à qual o professor será vinculado.
   * @param _user - Usuário autenticado (ignorado, autorização externa).
   * @returns O registro do vínculo criado.
   * @throws notFound - Se o professor ou a matéria não forem encontrados.
   * @throws conflict - Se o vínculo entre professor e matéria já existir.
   */
  async criarVinculo(professorId: string, materiaId: string, _user: AuthUser) {
    const professor = await this.repository.findById(professorId);
    if (!professor) {
      throw notFound("Professor não encontrado.");
    }

    const materiaExiste = await this.repository.materiaExists(materiaId);
    if (!materiaExiste) {
      throw notFound("Matéria não encontrada.");
    }

    const existe = await this.repository.vinculoExists(professorId, materiaId);
    if (existe) {
      throw conflict("Vínculo já existe.");
    }

    return this.repository.criarVinculo(professorId, materiaId);
  }

  /**
   * Lista matérias vinculadas a um professor.
   *
   * @param professorId - ID do professor.
   * @param _user - Usuário autenticado (ignorado, autorização externa).
   * @returns Matérias vinculadas ao professor.
   * @throws notFound - Se o professor não for encontrado.
   */
  async listarMaterias(professorId: string, _user: AuthUser) {
    const professor = await this.repository.findById(professorId);
    if (!professor) {
      throw notFound("Professor não encontrado.");
    }

    return this.repository.findMateriasByProfessor(professorId);
  }

  /**
   * Remove o vínculo de um professor com uma matéria.
   *
   * @param professorId - ID do professor.
   * @param materiaId - ID da matéria da qual o vínculo será removido.
   * @param _user - Usuário autenticado (ignorado, autorização externa).
   * @throws notFound - Se o professor ou o vínculo não forem encontrados.
   */
  async removerVinculo(professorId: string, materiaId: string, _user: AuthUser) {
    const professor = await this.repository.findById(professorId);
    if (!professor) {
      throw notFound("Professor não encontrado.");
    }

    const removido = await this.repository.removerVinculo(professorId, materiaId);
    if (!removido) {
      throw notFound("Vínculo não encontrado.");
    }
  }
}
