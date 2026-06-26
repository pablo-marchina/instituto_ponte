import { conflict, notFound } from "../errors/api-error.js";
import { TurmaRepository } from "../repositories/turma.repository.js";
import type { TurmaInput } from "../schemas/turma.schema.js";

export class TurmaService {
  constructor(private readonly repository = new TurmaRepository()) {}

  listar() {
    return this.repository.findAll();
  }

  async criar(input: TurmaInput) {
    const existing = await this.repository.findByNome(input.nome);
    if (existing) throw conflict("Ja existe uma turma com este nome.");
    return this.repository.create(input);
  }

  async atualizar(id: string, input: TurmaInput) {
    const current = await this.repository.findById(id);
    if (!current) throw notFound("Turma nao encontrada.");
    const existing = await this.repository.findByNome(input.nome);
    if (existing && existing.id !== id) throw conflict("Ja existe uma turma com este nome.");
    const updated = await this.repository.update(id, input);
    if (!updated) throw notFound("Turma nao encontrada.");
    return updated;
  }

  async remover(id: string) {
    const removed = await this.repository.delete(id);
    if (!removed) throw notFound("Turma nao encontrada.");
  }
}
