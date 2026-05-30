import { notFound } from "../errors/api-error.js";
import type { AuthUser } from "../middlewares/auth.js";
import { AnexoExportarRepository } from "../repositories/anexo-exportar.repository.js";

export class AnexoExportarService {
  constructor(private readonly repository = new AnexoExportarRepository()) {}

  async exportar(provaId: string, _user: AuthUser) {
    const provaExiste = await this.repository.findProvaExists(provaId);
    if (!provaExiste) {
      throw notFound("Prova não encontrada.");
    }

    return this.repository.findAnexosPorProva(provaId);
  }
}
