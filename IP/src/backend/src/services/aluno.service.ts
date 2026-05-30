import { conflict, notFound } from "../errors/api-error.js";
import type { AuthUser } from "../middlewares/auth.js";
import { AlunoRepository } from "../repositories/aluno.repository.js";
import type { UpdateAlunoInput } from "../schemas/aluno.schema.js";

export class AlunoService {
  constructor(private readonly repository = new AlunoRepository()) {}

  async listar(query: { page?: number; limit?: number }, _user: AuthUser) {
    return this.repository.findAll({ page: query.page, limit: query.limit });
  }

  async buscarPorId(id: string, _user: AuthUser) {
    const aluno = await this.repository.findById(id);
    if (!aluno) {
      throw notFound("Aluno não encontrado.");
    }
    return aluno;
  }

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

  async remover(id: string, _user: AuthUser) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw notFound("Aluno não encontrado.");
    }
    await this.repository.delete(id);
  }
}
