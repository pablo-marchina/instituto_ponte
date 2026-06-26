import { describe, expect, it, jest } from "@jest/globals";
import type { AuthUser } from "../../middlewares/auth.js";
import { AnalyticsService } from "../../services/analytics.service.js";

const user: AuthUser = { id: "coord-1", nome: "Coord", email: "coord@test.com", perfil: "coordenador" };
const makeRepo = () => ({
  findProvaExists: jest.fn<any>().mockResolvedValue(true),
  hasAccessToProva: jest.fn<any>().mockResolvedValue(true),
  obterAnalytics: jest.fn<any>().mockResolvedValue({
    totalAlunos: "2",
    acessos: "3",
    inicios: "2",
    envios: "1",
    totalRespostas: "4",
    totalAnexos: "5",
    pendenciasCorrecao: "1",
  }),
});

describe("AnalyticsService - unitário", () => {
  it("deve converter métricas numéricas ao obter analytics", async () => {
    const service = new AnalyticsService(makeRepo() as any);

    await expect(service.obterPorProva("prova-1", user)).resolves.toEqual({
      provaId: "prova-1",
      totalAlunos: 2,
      acessos: 3,
      inicios: 2,
      envios: 1,
      totalRespostas: 4,
      totalAnexos: 5,
      pendenciasCorrecao: 1,
    });
  });

  it("deve lançar notFound quando prova não existe", async () => {
    const repo = makeRepo();
    repo.findProvaExists.mockResolvedValue(false);
    const service = new AnalyticsService(repo as any);

    await expect(service.obterPorProva("x", user)).rejects.toThrow("Prova não encontrada.");
  });

  it("deve lançar forbidden quando usuário não tem acesso", async () => {
    const repo = makeRepo();
    repo.hasAccessToProva.mockResolvedValue(false);
    const service = new AnalyticsService(repo as any);

    await expect(service.obterPorProva("prova-1", user)).rejects.toThrow("Usuário sem permissão para acessar analytics desta prova.");
  });
});
