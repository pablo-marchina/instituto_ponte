import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import type { AuthUser } from "../../middlewares/auth.js";

const mockFindById = jest.fn<any>();
const mockFindAll = jest.fn<any>();
const mockFindByEmail = jest.fn<any>();
const mockCreate = jest.fn<any>();
const mockUpdate = jest.fn<any>();
const mockDelete = jest.fn<any>();
const mockCoordenadorExists = jest.fn<any>();
const mockMateriaExists = jest.fn<any>();
const mockVinculoExists = jest.fn<any>();
const mockCriarVinculo = jest.fn<any>();
const mockRemoverVinculo = jest.fn<any>();

jest.unstable_mockModule("../../repositories/professor.repository.js", () => ({
  ProfessorRepository: jest.fn().mockImplementation(() => ({
    findById: mockFindById,
    findAll: mockFindAll,
    findByEmail: mockFindByEmail,
    create: mockCreate,
    update: mockUpdate,
    delete: mockDelete,
    coordenadorExists: mockCoordenadorExists,
    materiaExists: mockMateriaExists,
    vinculoExists: mockVinculoExists,
    criarVinculo: mockCriarVinculo,
    removerVinculo: mockRemoverVinculo,
  })),
}));

type ProfessorServiceModule = typeof import("../../services/professor.service.js");
let ProfessorService: ProfessorServiceModule["ProfessorService"];

const user: AuthUser = { id: "user-1", nome: "User", email: "user@test.com", perfil: "coordenador" };

beforeEach(async () => {
  jest.resetModules();
  [mockFindById, mockFindAll, mockFindByEmail, mockCreate, mockUpdate, mockDelete,
   mockCoordenadorExists, mockMateriaExists, mockVinculoExists, mockCriarVinculo, mockRemoverVinculo].forEach((m) => m.mockReset());
  const mod = await import("../../services/professor.service.js");
  ProfessorService = mod.ProfessorService;
});

describe("ProfessorService", () => {
  it("criar deve lancar erro se coordenador nao existe", async () => {
    mockCoordenadorExists.mockResolvedValue(false);
    await expect(new ProfessorService().criar({ email: "prof@test.com", nome: "Prof", coordenadorId: "coord-x" }, user)).rejects.toThrow("O coordenador informado não existe.");
  });

  it("criar deve lancar erro se email duplicado", async () => {
    mockCoordenadorExists.mockResolvedValue(true);
    mockFindByEmail.mockResolvedValue({ id: "outro" });
    await expect(new ProfessorService().criar({ email: "dup@test.com", nome: "Prof", coordenadorId: "coord-1" }, user)).rejects.toThrow("Já existe um professor com este e-mail.");
  });

  it("criar deve criar professor com sucesso", async () => {
    mockCoordenadorExists.mockResolvedValue(true);
    mockFindByEmail.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: "prof-1" });
    const result = await new ProfessorService().criar({ email: "prof@test.com", nome: "Prof", coordenadorId: "coord-1" }, user);
    expect(result.id).toBe("prof-1");
  });

  it("buscarPorId deve lancar erro se nao encontrado", async () => {
    mockFindById.mockResolvedValue(null);
    await expect(new ProfessorService().buscarPorId("inexistente", user)).rejects.toThrow("Professor não encontrado.");
  });

  it("atualizar deve lancar erro se professor nao encontrado", async () => {
    mockFindById.mockResolvedValue(null);
    await expect(new ProfessorService().atualizar("inexistente", { nome: "X" }, user)).rejects.toThrow("Professor não encontrado.");
  });

  it("atualizar deve lancar erro se email duplicado", async () => {
    mockFindById.mockResolvedValue({ id: "prof-1" });
    mockFindByEmail.mockResolvedValue({ id: "outro-id" });
    await expect(new ProfessorService().atualizar("prof-1", { email: "dup@test.com" }, user)).rejects.toThrow("Já existe um professor com este e-mail.");
  });

  it("atualizar deve lancar erro se coordenador informado nao existe", async () => {
    mockFindById.mockResolvedValue({ id: "prof-1" });
    mockFindByEmail.mockResolvedValue(null);
    mockCoordenadorExists.mockResolvedValue(false);
    await expect(new ProfessorService().atualizar("prof-1", { coordenadorId: "coord-x" }, user)).rejects.toThrow("O coordenador informado não existe.");
  });

  it("atualizar deve lancar erro se update retornar null", async () => {
    mockFindById.mockResolvedValue({ id: "prof-1" });
    mockFindByEmail.mockResolvedValue(null);
    mockUpdate.mockResolvedValue(null);
    await expect(new ProfessorService().atualizar("prof-1", { nome: "Novo" }, user)).rejects.toThrow("Professor não encontrado.");
  });

  it("remover deve lancar erro se professor nao encontrado", async () => {
    mockFindById.mockResolvedValue(null);
    await expect(new ProfessorService().remover("inexistente", user)).rejects.toThrow("Professor não encontrado.");
  });

  it("criarVinculo deve lancar erro se materia nao existe", async () => {
    mockFindById.mockResolvedValue({ id: "prof-1" });
    mockMateriaExists.mockResolvedValue(false);
    await expect(new ProfessorService().criarVinculo("prof-1", "mat-x", user)).rejects.toThrow("Matéria não encontrada.");
  });

  it("criarVinculo deve lancar erro se vinculo ja existe", async () => {
    mockFindById.mockResolvedValue({ id: "prof-1" });
    mockMateriaExists.mockResolvedValue(true);
    mockVinculoExists.mockResolvedValue(true);
    await expect(new ProfessorService().criarVinculo("prof-1", "mat-1", user)).rejects.toThrow("Vínculo já existe.");
  });

  it("removerVinculo deve lancar erro se vinculo nao encontrado", async () => {
    mockFindById.mockResolvedValue({ id: "prof-1" });
    mockRemoverVinculo.mockResolvedValue(null);
    await expect(new ProfessorService().removerVinculo("prof-1", "mat-1", user)).rejects.toThrow("Vínculo não encontrado.");
  });
});
