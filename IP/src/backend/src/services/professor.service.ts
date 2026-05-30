import { businessRule, conflict, notFound } from "../errors/api-error.js";
import type { AuthUser } from "../middlewares/auth.js";
import { ProfessorRepository } from "../repositories/professor.repository.js";
import type { CreateProfessorInput, UpdateProfessorInput } from "../schemas/professor.schema.js";

export class ProfessorService {
  constructor(private readonly repository = new ProfessorRepository()) {}

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

  async listar(query: { page?: number; limit?: number }, _user: AuthUser) {
    return this.repository.findAll({ page: query.page, limit: query.limit });
  }

  async buscarPorId(id: string, _user: AuthUser) {
    const professor = await this.repository.findById(id);
    if (!professor) {
      throw notFound("Professor não encontrado.");
    }
    return professor;
  }

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

  async remover(id: string, _user: AuthUser) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw notFound("Professor não encontrado.");
    }
    await this.repository.delete(id);
  }

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
