import { describe, expect, it, jest } from "@jest/globals";
import type { AuthUser } from "../../middlewares/auth.js";
import { AnexoExportarService } from "../../services/anexo-exportar.service.js";

const user: AuthUser = { id: "coord-1", nome: "Coord", email: "coord@test.com", perfil: "coordenador" };

const makeRepo = () => ({
  findProvaExists: jest.fn<any>().mockResolvedValue(true),
  findAnexosPorProva: jest.fn<any>().mockResolvedValue([{ respostaId: "r-1", urlArquivo: "/a.pdf" }]),
});

describe("AnexoExportarService - unitário", () => {
  it("deve exportar anexos quando prova existe", async () => {
    const service = new AnexoExportarService(makeRepo() as any);

    await expect(service.exportar("prova-1", user)).resolves.toEqual([{ respostaId: "r-1", urlArquivo: "/a.pdf" }]);
  });

  it("deve lançar notFound quando prova não existe", async () => {
    const repo = makeRepo();
    repo.findProvaExists.mockResolvedValue(false);
    const service = new AnexoExportarService(repo as any);

    await expect(service.exportar("x", user)).rejects.toThrow("Prova não encontrada.");
  });
});
