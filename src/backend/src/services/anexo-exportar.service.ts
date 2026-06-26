import { notFound } from "../errors/api-error.js";
import type { AuthUser } from "../models/auth.model.js";
import { AnexoExportarRepository } from "../repositories/anexo-exportar.repository.js";

/**
 * Exportação de anexos enviados pelos alunos em uma prova.
 */
export class AnexoExportarService {
  constructor(private readonly repository = new AnexoExportarRepository()) {}

  /**
   * Lista todos os anexos enviados pelos alunos em uma prova.
   *
   * @param provaId - ID da prova.
   * @param _user - Usuário autenticado (ignorado, autorização externa).
   * @returns Lista de anexos com dados do aluno, resposta e URL do arquivo.
   * @throws notFound - Se a prova não for encontrada.
   */
  async exportar(provaId: string, _user: AuthUser) {
    const provaExiste = await this.repository.findProvaExists(provaId);
    if (!provaExiste) {
      throw notFound("Prova não encontrada.");
    }

    return this.repository.findAnexosPorProva(provaId);
  }
}
