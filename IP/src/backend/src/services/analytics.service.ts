import { forbidden, notFound } from "../errors/api-error.js";
import type { AuthUser } from "../middlewares/auth.js";
import { AnalyticsRepository } from "../repositories/analytics.repository.js";

export class AnalyticsService {
  constructor(private readonly analyticsRepository = new AnalyticsRepository()) {}

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
