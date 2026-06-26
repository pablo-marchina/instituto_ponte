import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import type { AuthUser } from "../../middlewares/auth.js";

const mockFindByName = jest.fn<any>();
const mockFindById = jest.fn<any>();
const mockCreate = jest.fn<any>();
const mockFindAll = jest.fn<any>();
const mockUpdate = jest.fn<any>();
const mockDelete = jest.fn<any>();

jest.unstable_mockModule("../../repositories/materia.repository.js", () => ({
  MateriaRepository: jest.fn().mockImplementation(() => ({
    findByName: mockFindByName,
    findById: mockFindById,
    create: mockCreate,
    findAll: mockFindAll,
    update: mockUpdate,
    delete: mockDelete,
  })),
}));

type ServiceModule = typeof import("../../services/materia.service.js");
let MateriaService: ServiceModule["MateriaService"];

const user: AuthUser = {
  id: "user-1",
  nome: "User",
  email: "user@test.com",
  perfil: "coordenador",
};

beforeEach(async () => {
  jest.resetModules();
  mockFindByName.mockReset();
  mockFindById.mockReset();
  mockCreate.mockReset();
  mockFindAll.mockReset();
  mockUpdate.mockReset();
  mockDelete.mockReset();
  const mod = await import("../../services/materia.service.js");
  MateriaService = mod.MateriaService;
});

describe("MateriaService - unitário", () => {
  describe("criar", () => {
    it("deve criar matéria quando nome é único", async () => {
      mockFindByName.mockResolvedValue(null);
      mockCreate.mockResolvedValue({ id: "mat-1", nome: "Matemática" });

      const service = new MateriaService();
      const result = await service.criar({ nome: "Matemática" }, user);

      expect(result).toEqual({ id: "mat-1", nome: "Matemática" });
      expect(mockFindByName).toHaveBeenCalledWith("Matemática");
    });

    it("deve lançar conflict quando nome já existe", async () => {
      mockFindByName.mockResolvedValue({ id: "mat-1", nome: "Matemática" });

      const service = new MateriaService();
      await expect(
        service.criar({ nome: "Matemática" }, user),
      ).rejects.toThrow("Já existe uma matéria com este nome.");
    });
  });

  describe("listar", () => {
    it("deve retornar lista paginada", async () => {
      mockFindAll.mockResolvedValue({ data: [], total: 0 });

      const service = new MateriaService();
      const result = await service.listar({ page: 1, limit: 10 }, user);

      expect(result).toEqual({ data: [], total: 0 });
      expect(mockFindAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });

  describe("buscarPorId", () => {
    it("deve retornar matéria quando encontrada", async () => {
      mockFindById.mockResolvedValue({ id: "mat-1", nome: "Matemática" });

      const service = new MateriaService();
      const result = await service.buscarPorId("mat-1", user);

      expect(result).toEqual({ id: "mat-1", nome: "Matemática" });
    });

    it("deve lançar notFound quando não encontrada", async () => {
      mockFindById.mockResolvedValue(null);

      const service = new MateriaService();
      await expect(service.buscarPorId("inexistente", user)).rejects.toThrow(
        "Matéria não encontrada.",
      );
    });
  });

  describe("atualizar", () => {
    it("deve atualizar matéria quando dados válidos", async () => {
      mockFindById.mockResolvedValue({ id: "mat-1", nome: "Matemática" });
      mockFindByName.mockResolvedValue(null);
      mockUpdate.mockResolvedValue({ id: "mat-1", nome: "Matemática Atualizada" });

      const service = new MateriaService();
      const result = await service.atualizar(
        "mat-1",
        { nome: "Matemática Atualizada" },
        user,
      );

      expect(result).toEqual({ id: "mat-1", nome: "Matemática Atualizada" });
    });

    it("deve lançar notFound quando matéria não existe", async () => {
      mockFindById.mockResolvedValue(null);

      const service = new MateriaService();
      await expect(
        service.atualizar("inexistente", { nome: "Qualquer" }, user),
      ).rejects.toThrow("Matéria não encontrada.");
    });

    it("deve lançar conflict quando novo nome já existe em outra matéria", async () => {
      mockFindById.mockResolvedValue({ id: "mat-1", nome: "Matemática" });
      mockFindByName.mockResolvedValue({ id: "mat-2", nome: "Matemática" });

      const service = new MateriaService();
      await expect(
        service.atualizar("mat-1", { nome: "Matemática" }, user),
      ).rejects.toThrow("Já existe uma matéria com este nome.");
    });

    it("deve permitir atualizar sem mudar nome", async () => {
      mockFindById.mockResolvedValue({ id: "mat-1", nome: "Matemática" });
      mockUpdate.mockResolvedValue({ id: "mat-1", nome: "Matemática" });

      const service = new MateriaService();
      const result = await service.atualizar("mat-1", {}, user);

      expect(result).toEqual({ id: "mat-1", nome: "Matemática" });
      expect(mockFindByName).not.toHaveBeenCalled();
    });

    it("deve lançar notFound quando update retorna null", async () => {
      mockFindById.mockResolvedValue({ id: "mat-1", nome: "Matemática" });
      mockFindByName.mockResolvedValue(null);
      mockUpdate.mockResolvedValue(null);

      const service = new MateriaService();
      await expect(
        service.atualizar("mat-1", { nome: "Matemática Atualizada" }, user),
      ).rejects.toThrow("Matéria não encontrada.");
    });
  });

  describe("remover", () => {
    it("deve remover matéria quando encontrada", async () => {
      mockFindById.mockResolvedValue({ id: "mat-1", nome: "Matemática" });

      const service = new MateriaService();
      await service.remover("mat-1", user);

      expect(mockDelete).toHaveBeenCalledWith("mat-1");
    });

    it("deve lançar notFound quando matéria não existe", async () => {
      mockFindById.mockResolvedValue(null);

      const service = new MateriaService();
      await expect(service.remover("inexistente", user)).rejects.toThrow(
        "Matéria não encontrada.",
      );
    });
  });
});
