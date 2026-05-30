import { conflict, notFound } from "../errors/api-error.js";
import type { AuthUser } from "../middlewares/auth.js";
import { MateriaRepository } from "../repositories/materia.repository.js";
import type { CreateMateriaInput, UpdateMateriaInput } from "../schemas/materia.schema.js";

export class MateriaService {
  constructor(private readonly materiaRepository = new MateriaRepository()) {}

  async criar(input: CreateMateriaInput, _user: AuthUser) {
    const existing = await this.materiaRepository.findByName(input.nome);
    if (existing) {
      throw conflict("Já existe uma matéria com este nome.");
    }
    return this.materiaRepository.create(input);
  }

  async listar(query: { page?: number; limit?: number }, _user: AuthUser) {
    return this.materiaRepository.findAll({ page: query.page, limit: query.limit });
  }

  async buscarPorId(id: string, _user: AuthUser) {
    const materia = await this.materiaRepository.findById(id);
    if (!materia) {
      throw notFound("Matéria não encontrada.");
    }
    return materia;
  }

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

  async remover(id: string, _user: AuthUser) {
    const existing = await this.materiaRepository.findById(id);
    if (!existing) {
      throw notFound("Matéria não encontrada.");
    }
    await this.materiaRepository.delete(id);
  }
}
