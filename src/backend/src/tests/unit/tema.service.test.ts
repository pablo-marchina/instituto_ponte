import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import type { AuthUser } from "../../middlewares/auth.js";

const mockMateriaExists = jest.fn<any>();
const mockFindByNameAndMateria = jest.fn<any>();
const mockFindById = jest.fn<any>();
const mockCreate = jest.fn<any>();
const mockFindAll = jest.fn<any>();
const mockUpdate = jest.fn<any>();
const mockDelete = jest.fn<any>();

jest.unstable_mockModule("../../repositories/tema.repository.js", () => ({
  TemaRepository: jest.fn().mockImplementation(() => ({
    materiaExists: mockMateriaExists,
    findByNameAndMateria: mockFindByNameAndMateria,
    findById: mockFindById,
    create: mockCreate,
    findAll: mockFindAll,
    update: mockUpdate,
    delete: mockDelete,
  })),
}));

type ServiceModule = typeof import("../../services/tema.service.js");
let TemaService: ServiceModule["TemaService"];

const user: AuthUser = {
  id: "user-1",
  nome: "User",
  email: "user@test.com",
  perfil: "professor",
};

beforeEach(async () => {
  jest.resetModules();
  mockMateriaExists.mockReset();
  mockFindByNameAndMateria.mockReset();
  mockFindById.mockReset();
  mockCreate.mockReset();
  mockFindAll.mockReset();
  mockUpdate.mockReset();
  mockDelete.mockReset();
  const mod = await import("../../services/tema.service.js");
  TemaService = mod.TemaService;
});

describe("TemaService - unitário", () => {
  describe("criar", () => {
    it("deve criar tema quando matéria existe e nome é único", async () => {
      mockMateriaExists.mockResolvedValue(true);
      mockFindByNameAndMateria.mockResolvedValue(null);
      mockCreate.mockResolvedValue({ id: "tema-1", nome: "Álgebra", materiaId: "mat-1" });

      const service = new TemaService();
      const result = await service.criar(
        { nome: "Álgebra", materiaId: "mat-1" },
        user,
      );

      expect(result).toEqual({ id: "tema-1", nome: "Álgebra", materiaId: "mat-1" });
    });

    it("deve lançar businessRule quando matéria não existe", async () => {
      mockMateriaExists.mockResolvedValue(false);

      const service = new TemaService();
      await expect(
        service.criar({ nome: "Álgebra", materiaId: "mat-inexistente" }, user),
      ).rejects.toThrow("A matéria informada não existe.");
    });

    it("deve lançar conflict quando nome duplicado na mesma matéria", async () => {
      mockMateriaExists.mockResolvedValue(true);
      mockFindByNameAndMateria.mockResolvedValue({
        id: "tema-1",
        nome: "Álgebra",
      });

      const service = new TemaService();
      await expect(
        service.criar({ nome: "Álgebra", materiaId: "mat-1" }, user),
      ).rejects.toThrow("Já existe um tema com este nome nesta matéria.");
    });
  });

  describe("listar", () => {
    it("deve listar temas sem filtro de matéria", async () => {
      mockFindAll.mockResolvedValue({ data: [], total: 0 });

      const service = new TemaService();
      const result = await service.listar({ page: 1, limit: 10 }, user);

      expect(mockFindAll).toHaveBeenCalledWith({
        materiaId: undefined,
        page: 1,
        limit: 10,
      });
      expect(result).toEqual({ data: [], total: 0 });
    });

    it("deve filtrar por materiaId", async () => {
      mockFindAll.mockResolvedValue({ data: [], total: 0 });

      const service = new TemaService();
      await service.listar({ materiaId: "mat-1", page: 1, limit: 10 }, user);

      expect(mockFindAll).toHaveBeenCalledWith({
        materiaId: "mat-1",
        page: 1,
        limit: 10,
      });
    });
  });

  describe("buscarPorId", () => {
    it("deve retornar tema quando encontrado", async () => {
      mockFindById.mockResolvedValue({ id: "tema-1", nome: "Álgebra" });

      const service = new TemaService();
      const result = await service.buscarPorId("tema-1", user);

      expect(result).toEqual({ id: "tema-1", nome: "Álgebra" });
    });

    it("deve lançar notFound quando não encontrado", async () => {
      mockFindById.mockResolvedValue(null);

      const service = new TemaService();
      await expect(service.buscarPorId("inexistente", user)).rejects.toThrow(
        "Tema não encontrado.",
      );
    });
  });

  describe("atualizar", () => {
    it("deve atualizar tema com nome novo e único", async () => {
      mockFindById.mockResolvedValue({
        id: "tema-1",
        nome: "Álgebra",
        materiaId: "mat-1",
      });
      mockFindByNameAndMateria.mockResolvedValue(null);
      mockUpdate.mockResolvedValue({
        id: "tema-1",
        nome: "Álgebra Avançada",
        materiaId: "mat-1",
      });

      const service = new TemaService();
      const result = await service.atualizar(
        "tema-1",
        { nome: "Álgebra Avançada" },
        user,
      );

      expect(result).toEqual({
        id: "tema-1",
        nome: "Álgebra Avançada",
        materiaId: "mat-1",
      });
    });

    it("deve lançar notFound quando tema não existe", async () => {
      mockFindById.mockResolvedValue(null);

      const service = new TemaService();
      await expect(
        service.atualizar("inexistente", { nome: "Qualquer" }, user),
      ).rejects.toThrow("Tema não encontrado.");
    });

    it("deve lançar conflict quando nome duplicado (excluindo próprio id)", async () => {
      mockFindById.mockResolvedValue({
        id: "tema-1",
        nome: "Álgebra",
        materiaId: "mat-1",
      });
      mockFindByNameAndMateria.mockResolvedValue({
        id: "tema-2",
        nome: "Álgebra",
      });

      const service = new TemaService();
      await expect(
        service.atualizar("tema-1", { nome: "Álgebra" }, user),
      ).rejects.toThrow("Já existe um tema com este nome nesta matéria.");
    });

    it("deve permitir atualizar sem alterar nome", async () => {
      mockFindById.mockResolvedValue({
        id: "tema-1",
        nome: "Álgebra",
        materiaId: "mat-1",
      });
      mockUpdate.mockResolvedValue({
        id: "tema-1",
        nome: "Álgebra",
        materiaId: "mat-1",
      });

      const service = new TemaService();
      const result = await service.atualizar("tema-1", {}, user);

      expect(result).toEqual({
        id: "tema-1",
        nome: "Álgebra",
        materiaId: "mat-1",
      });
      expect(mockFindByNameAndMateria).not.toHaveBeenCalled();
    });

    it("deve lançar notFound quando update retorna null", async () => {
      mockFindById.mockResolvedValue({
        id: "tema-1",
        nome: "Álgebra",
        materiaId: "mat-1",
      });
      mockFindByNameAndMateria.mockResolvedValue(null);
      mockUpdate.mockResolvedValue(null);

      const service = new TemaService();
      await expect(
        service.atualizar("tema-1", { nome: "Álgebra Atualizada" }, user),
      ).rejects.toThrow("Tema não encontrado.");
    });
  });

  describe("remover", () => {
    it("deve remover tema quando encontrado", async () => {
      mockFindById.mockResolvedValue({ id: "tema-1", nome: "Álgebra" });

      const service = new TemaService();
      await service.remover("tema-1", user);

      expect(mockDelete).toHaveBeenCalledWith("tema-1");
    });

    it("deve lançar notFound quando tema não existe", async () => {
      mockFindById.mockResolvedValue(null);

      const service = new TemaService();
      await expect(service.remover("inexistente", user)).rejects.toThrow(
        "Tema não encontrado.",
      );
    });
  });
});
