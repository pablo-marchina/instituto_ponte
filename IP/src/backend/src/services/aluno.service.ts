import { conflict, notFound } from "../errors/api-error.js";
import type { AuthUser } from "../models/auth.model.js";
import { AlunoRepository } from "../repositories/aluno.repository.js";
import type { UpdateAlunoInput } from "../schemas/aluno.schema.js";

/**
 * Gerencia alunos cadastrados no sistema.
 *
 * Alunos são cadastrados automaticamente ao iniciar uma prova
 * pelo portal público (AlunoPortalService). Este serviço permite
 * a gestão manual (listar, buscar, atualizar, remover) pelos
 * administradores/coordenadores.
 *
 * ## Unicidade
 * - Email: deve ser único (identificador principal).
 * - CPF: deve ser único quando informado (opcional).
 *
 * ## Observação
 * A criação de alunos não é exposta aqui porque o cadastro é
 * feito automaticamente via upsert no fluxo do portal.
 */
export class AlunoService {
  constructor(private readonly repository = new AlunoRepository()) {}

  /**
   * Lista alunos com paginação, ordenados por nome.
   *
   * @param query - Parâmetros de paginação (page e limit opcionais).
   * @param _user - Usuário autenticado (ignorado, autorização externa).
   * @returns Lista paginada de alunos.
   */
  async listar(query: { page?: number; limit?: number }, _user: AuthUser) {
    return this.repository.findAll({ page: query.page, limit: query.limit });
  }

  /**
   * Busca um aluno pelo seu ID.
   *
   * @param id - Identificador único do aluno.
   * @param _user - Usuário autenticado (ignorado, autorização externa).
   * @returns O aluno encontrado.
   * @throws notFound - Se nenhum aluno for encontrado com o ID informado.
   */
  async buscarPorId(id: string, _user: AuthUser) {
    const aluno = await this.repository.findById(id);
    if (!aluno) {
      throw notFound("Aluno não encontrado.");
    }
    return aluno;
  }

  /**
   * Atualiza os dados de um aluno existente.
   *
   * @param id - Identificador único do aluno a ser atualizado.
   * @param input - Dados parciais para atualização (nome, email, cpf, dataNascimento).
   * @param _user - Usuário autenticado (ignorado, autorização externa).
   * @returns O aluno atualizado.
   * @throws notFound - Se o aluno não for encontrado.
   * @throws conflict - Se o novo email ou CPF já estiverem em uso por outro aluno.
   */
  async atualizar(id: string, input: UpdateAlunoInput, _user: AuthUser) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw notFound("Aluno não encontrado.");
    }

    if (input.email !== undefined) {
      const duplicado = await this.repository.findByEmail(input.email);
      if (duplicado && duplicado.id !== id) {
        throw conflict("Já existe um aluno com este e-mail.");
      }
    }

    if (input.cpf !== undefined && input.cpf !== null) {
      const duplicado = await this.repository.findByCpf(input.cpf);
      if (duplicado && duplicado.id !== id) {
        throw conflict("Já existe um aluno com este CPF.");
      }
    }

    const updated = await this.repository.update(id, input);
    if (!updated) {
      throw notFound("Aluno não encontrado.");
    }
    return updated;
  }

  /**
   * Remove um aluno do sistema (exclusão física).
   *
   * @param id - Identificador único do aluno a ser removido.
   * @param _user - Usuário autenticado (ignorado, autorização externa).
   * @throws notFound - Se o aluno não for encontrado.
   */
  async remover(id: string, _user: AuthUser) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw notFound("Aluno não encontrado.");
    }
    await this.repository.delete(id);
  }
}
