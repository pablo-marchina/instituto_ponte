import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import type { AuthUser } from "../../middlewares/auth.js";

const mockFindById = jest.fn<any>();
const mockFindAll = jest.fn<any>();
const mockFindByEmail = jest.fn<any>();
const mockFindByCpf = jest.fn<any>();
const mockUpdate = jest.fn<any>();
const mockDelete = jest.fn<any>();

jest.unstable_mockModule("../../repositories/aluno.repository.js", () => ({
  AlunoRepository: jest.fn().mockImplementation(() => ({
    findById: mockFindById,
    findAll: mockFindAll,
    findByEmail: mockFindByEmail,
    findByCpf: mockFindByCpf,
    update: mockUpdate,
    delete: mockDelete,
  })),
}));

type AlunoServiceModule = typeof import("../../services/aluno.service.js");
let AlunoService: AlunoServiceModule["AlunoService"];

const user: AuthUser = { id: "user-1", nome: "User", email: "user@test.com", perfil: "professor" };

beforeEach(async () => {
  jest.resetModules();
  [mockFindById, mockFindAll, mockFindByEmail, mockFindByCpf, mockUpdate, mockDelete].forEach((m) => m.mockReset());
  const mod = await import("../../services/aluno.service.js");
  AlunoService = mod.AlunoService;
});

describe("AlunoService", () => {
  it("listar deve retornar alunos", async () => {
    mockFindAll.mockResolvedValue([{ id: "aluno-1" }]);
    const service = new AlunoService();
    const result = await service.listar({}, user);
    expect(result).toEqual([{ id: "aluno-1" }]);
  });

  it("buscarPorId deve lancar erro se nao encontrado", async () => {
    mockFindById.mockResolvedValue(null);
    await expect(new AlunoService().buscarPorId("inexistente", user)).rejects.toThrow("Aluno não encontrado.");
  });

  it("buscarPorId deve retornar aluno se encontrado", async () => {
    mockFindById.mockResolvedValue({ id: "aluno-1", nome: "João" });
    const result = await new AlunoService().buscarPorId("aluno-1", user);
    expect(result.nome).toBe("João");
  });

  it("atualizar deve lancar erro se aluno nao encontrado", async () => {
    mockFindById.mockResolvedValue(null);
    await expect(new AlunoService().atualizar("inexistente", { nome: "X" }, user)).rejects.toThrow("Aluno não encontrado.");
  });

  it("atualizar deve lancar erro se email duplicado", async () => {
    mockFindById.mockResolvedValue({ id: "aluno-1" });
    mockFindByEmail.mockResolvedValue({ id: "outro-id" });
    await expect(new AlunoService().atualizar("aluno-1", { email: "dup@test.com" }, user)).rejects.toThrow("Já existe um aluno com este e-mail.");
  });

  it("atualizar deve lancar erro se cpf duplicado", async () => {
    mockFindById.mockResolvedValue({ id: "aluno-1" });
    mockFindByEmail.mockResolvedValue(null);
    mockFindByCpf.mockResolvedValue({ id: "outro-id" });
    await expect(new AlunoService().atualizar("aluno-1", { cpf: "12345678900" }, user)).rejects.toThrow("Já existe um aluno com este CPF.");
  });

  it("atualizar deve lancar erro se update retornar null", async () => {
    mockFindById.mockResolvedValue({ id: "aluno-1" });
    mockFindByEmail.mockResolvedValue(null);
    mockUpdate.mockResolvedValue(null);
    await expect(new AlunoService().atualizar("aluno-1", { nome: "Novo" }, user)).rejects.toThrow("Aluno não encontrado.");
  });

  it("atualizar deve retornar aluno atualizado", async () => {
    mockFindById.mockResolvedValue({ id: "aluno-1" });
    mockFindByEmail.mockResolvedValue(null);
    mockUpdate.mockResolvedValue({ id: "aluno-1", nome: "Novo" });
    const result = await new AlunoService().atualizar("aluno-1", { nome: "Novo" }, user);
    expect(result.nome).toBe("Novo");
  });

  it("remover deve lancar erro se aluno nao encontrado", async () => {
    mockFindById.mockResolvedValue(null);
    await expect(new AlunoService().remover("inexistente", user)).rejects.toThrow("Aluno não encontrado.");
  });

  it("remover deve deletar aluno", async () => {
    mockFindById.mockResolvedValue({ id: "aluno-1" });
    await new AlunoService().remover("aluno-1", user);
    expect(mockDelete).toHaveBeenCalledWith("aluno-1");
  });
});
