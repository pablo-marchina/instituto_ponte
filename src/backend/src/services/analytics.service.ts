import { forbidden, notFound } from "../errors/api-error.js";
import type { AuthUser } from "../models/auth.model.js";
import { AnalyticsRepository } from "../repositories/analytics.repository.js";

/**
 * Métricas agregadas de uma prova (alunos, acessos, envios, pendências de correção).
 */
export class AnalyticsService {
  constructor(private readonly analyticsRepository = new AnalyticsRepository()) {}

  /**
   * Obtém métricas agregadas de uma prova.
   *
   * @param provaId - ID da prova.
   * @param user - Usuário autenticado (deve ter permissão de acesso).
   * @returns Objeto com totalAlunos, acessos, inicios, envios, totalRespostas, totalAnexos e pendenciasCorrecao.
   * @throws notFound - Se a prova não for encontrada.
   * @throws forbidden - Se o usuário não tiver permissão para acessar as métricas.
   */
  async obterPorProva(provaId: string, user: AuthUser) {
    const provaExiste = await this.analyticsRepository.findProvaExists(provaId);
    if (!provaExiste) {
      throw notFound("Prova não encontrada.");
    }

    const hasAccess = await this.analyticsRepository.hasAccessToProva(provaId, user);
    if (!hasAccess) {
      throw forbidden("Usuário sem permissão para acessar analytics desta prova.");
    }

    const data = await this.analyticsRepository.obterAnalytics(provaId);

    return {
      provaId,
      totalAlunos: Number(data.totalAlunos),
      acessos: Number(data.acessos),
      inicios: Number(data.inicios),
      envios: Number(data.envios),
      totalRespostas: Number(data.totalRespostas),
      totalAnexos: Number(data.totalAnexos),
      pendenciasCorrecao: Number(data.pendenciasCorrecao),
    };
  }
}
