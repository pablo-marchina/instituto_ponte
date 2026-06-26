import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { AuthUser } from "../../middlewares/auth.js";
import { ResultadoService } from "../../services/resultado.service.js";

const professor: AuthUser = { id: "prof-1", nome: "Professor", email: "prof@test.com", perfil: "professor" };
const coordenador: AuthUser = { id: "coord-1", nome: "Coord", email: "coord@test.com", perfil: "coordenador" };

const resultados = [
  {
    aluno: { nome: "Aluno A", email: "a@test.com" },
    notaTotal: 8,
    percentual: 80,
    pendenciasCorrecao: 1,
    questoes: [{ nota: 5 }, { nota: null }],
  },
  {
    aluno: { nome: "Aluno B", email: "b@test.com" },
    notaTotal: 10,
    percentual: 100,
    pendenciasCorrecao: 0,
    questoes: [{ nota: 10 }],
  },
];

const makeRepo = () => ({
  findProvaExists: jest.fn<any>().mockResolvedValue(true),
  hasAccessToProva: jest.fn<any>().mockResolvedValue(true),
  findByProva: jest.fn<any>().mockResolvedValue(resultados),
  createExportacao: jest.fn<any>().mockResolvedValue({ id: "exp-1", urlArquivo: "/exports/a.csv" }),
});

const makeStorage = () => ({
  upload: jest.fn<any>().mockResolvedValue("/exports/a.csv"),
});

describe("ResultadoService - unitário", () => {
  let repo: ReturnType<typeof makeRepo>;
  let storage: ReturnType<typeof makeStorage>;
  let service: ResultadoService;
  let dateSpy: jest.SpiedFunction<typeof Date.now>;

  beforeEach(() => {
    dateSpy = jest.spyOn(Date, "now").mockReturnValue(123);
    repo = makeRepo();
    storage = makeStorage();
    service = new ResultadoService(repo as any, storage as any);
  });

  afterEach(() => {
    dateSpy.mockRestore();
  });

  it("deve consolidar resultados quando usuário tem acesso", async () => {
    await expect(service.consolidarPorProva("prova-1", professor)).resolves.toEqual(resultados);
  });

  it("deve rejeitar consolidação sem acesso", async () => {
    repo.hasAccessToProva.mockResolvedValue(false);

    await expect(service.consolidarPorProva("prova-1", professor)).rejects.toThrow(
      "Usuário sem permissão para acessar os resultados desta prova.",
    );
  });

  it("deve lançar notFound ao consolidar prova inexistente", async () => {
    repo.findProvaExists.mockResolvedValue(false);

    await expect(service.consolidarPorProva("prova-x", professor)).rejects.toThrow("Prova não encontrada.");
  });

  it("deve exportar CSV para coordenador", async () => {
    const result = await service.exportarPorProva("prova-1", { formato: "csv" } as any, coordenador);

    expect(result).toEqual({ id: "exp-1", urlArquivo: "/exports/a.csv" });
    expect(storage.upload).toHaveBeenCalledWith(expect.objectContaining({
      path: "provas/prova-1/resultados-123.csv",
      contentType: "text/csv; charset=utf-8",
    }));
    const uploadInput = storage.upload.mock.calls[0][0] as { content: string | Buffer };
    expect(String(uploadInput.content)).toContain("\"Aluno A\"");
    expect(String(uploadInput.content)).toContain("\"Media geral\"");
    expect(repo.createExportacao).toHaveBeenCalledWith("prova-1", "coord-1", "csv", "/exports/a.csv", 1);
  });

  it("deve exportar XLSX para coordenador", async () => {
    await service.exportarPorProva("prova-1", { formato: "xlsx" } as any, coordenador);

    expect(storage.upload).toHaveBeenCalledWith(expect.objectContaining({
      path: "provas/prova-1/resultados-123.xlsx",
      content: expect.any(Buffer),
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }));
  });

  it("deve bloquear exportacao por professor mesmo com acesso", async () => {
    await expect(service.exportarPorProva("prova-1", { formato: "csv" } as any, professor)).rejects.toThrow(
      "Somente coordenadores podem exportar resultados.",
    );

    expect(storage.upload).not.toHaveBeenCalled();
    expect(repo.createExportacao).not.toHaveBeenCalled();
  });

  it("deve rejeitar exportacao sem acesso", async () => {
    repo.hasAccessToProva.mockResolvedValue(false);

    await expect(service.exportarPorProva("prova-1", { formato: "csv" } as any, coordenador)).rejects.toThrow(
      "Usuario sem permissao para exportar resultados desta prova.",
    );
  });

  it("deve lançar notFound ao exportar prova inexistente", async () => {
    repo.findProvaExists.mockResolvedValue(false);

    await expect(service.exportarPorProva("prova-x", { formato: "csv" } as any, coordenador)).rejects.toThrow("Prova não encontrada.");
  });
});
