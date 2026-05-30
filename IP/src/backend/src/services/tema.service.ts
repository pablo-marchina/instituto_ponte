import { businessRule, conflict, notFound } from "../errors/api-error.js";
import type { AuthUser } from "../middlewares/auth.js";
import { TemaRepository } from "../repositories/tema.repository.js";
import type { CreateTemaInput, UpdateTemaInput } from "../schemas/tema.schema.js";

export class TemaService {
  constructor(private readonly temaRepository = new TemaRepository()) {}

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

  async listar(query: { materiaId?: string; page?: number; limit?: number }, _user: AuthUser) {
    return this.temaRepository.findAll({ materiaId: query.materiaId, page: query.page, limit: query.limit });
  }

  async buscarPorId(id: string, _user: AuthUser) {
    const tema = await this.temaRepository.findById(id);
    if (!tema) {
      throw notFound("Tema não encontrado.");
    }
    return tema;
  }

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

  async remover(id: string, _user: AuthUser) {
    const existing = await this.temaRepository.findById(id);
    if (!existing) {
      throw notFound("Tema não encontrado.");
    }
    await this.temaRepository.delete(id);
  }
}
