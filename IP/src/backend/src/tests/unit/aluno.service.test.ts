import { describe, expect, it, jest } from "@jest/globals";
import type { AuthUser } from "../../middlewares/auth.js";
import { AlunoService } from "../../services/aluno.service.js";

const user: AuthUser = { id: "coord-1", nome: "Coord", email: "coord@test.com", perfil: "coordenador" };
const aluno = { id: "aluno-1", nome: "Aluno", email: "a@test.com", cpf: "12345678901" };

const makeRepo = () => ({
  findAll: jest.fn<any>().mockResolvedValue({ data: [aluno], total: 1 }),
  findById: jest.fn<any>().mockResolvedValue(aluno),
  findByEmail: jest.fn<any>().mockResolvedValue(null),
  findByCpf: jest.fn<any>().mockResolvedValue(null),
  update: jest.fn<any>().mockResolvedValue({ ...aluno, nome: "Novo" }),
  delete: jest.fn<any>().mockResolvedValue(undefined),
});

describe("AlunoService - unitário", () => {
  it("deve listar alunos com paginação", async () => {
    const repo = makeRepo();
    const service = new AlunoService(repo as any);

    await expect(service.listar({ page: 2, limit: 5 }, user)).resolves.toEqual({ data: [aluno], total: 1 });
    expect(repo.findAll).toHaveBeenCalledWith({ page: 2, limit: 5 });
  });

  it("deve buscar aluno por id", async () => {
    const service = new AlunoService(makeRepo() as any);

    await expect(service.buscarPorId("aluno-1", user)).resolves.toEqual(aluno);
  });

  it("deve lançar notFound quando aluno não existe", async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(null);
    const service = new AlunoService(repo as any);

    await expect(service.buscarPorId("x", user)).rejects.toThrow("Aluno não encontrado.");
  });

  it("deve atualizar aluno quando email e cpf não são duplicados", async () => {
    const repo = makeRepo();
    const service = new AlunoService(repo as any);

    await expect(service.atualizar("aluno-1", { nome: "Novo", email: "n@test.com", cpf: "10987654321" } as any, user)).resolves.toMatchObject({ nome: "Novo" });
  });

  it("deve lançar conflict quando email pertence a outro aluno", async () => {
    const repo = makeRepo();
    repo.findByEmail.mockResolvedValue({ id: "outro" });
    const service = new AlunoService(repo as any);

    await expect(service.atualizar("aluno-1", { email: "a@test.com" } as any, user)).rejects.toThrow("Já existe um aluno com este e-mail.");
  });

  it("deve lançar conflict quando cpf pertence a outro aluno", async () => {
    const repo = makeRepo();
    repo.findByCpf.mockResolvedValue({ id: "outro" });
    const service = new AlunoService(repo as any);

    await expect(service.atualizar("aluno-1", { cpf: "12345678901" } as any, user)).rejects.toThrow("Já existe um aluno com este CPF.");
  });

  it("deve remover aluno existente", async () => {
    const repo = makeRepo();
    const service = new AlunoService(repo as any);

    await service.remover("aluno-1", user);
    expect(repo.delete).toHaveBeenCalledWith("aluno-1");
  });

  it("cobre validacoes restantes de atualizacao", async () => {
    const repo = makeRepo();
    const service = new AlunoService(repo as any);

    repo.findById.mockResolvedValueOnce(null);
    await expect(service.atualizar("aluno-x", { nome: "Novo" } as any, user)).rejects.toThrow(/Aluno/);

    repo.update.mockResolvedValueOnce(null);
    await expect(service.atualizar("aluno-1", { nome: "Novo", cpf: null } as any, user)).rejects.toThrow(/Aluno/);
    expect(repo.findByCpf).not.toHaveBeenCalled();
  });

  it("deve bloquear remocao de aluno inexistente", async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValueOnce(null);
    const service = new AlunoService(repo as any);

    await expect(service.remover("aluno-x", user)).rejects.toThrow(/Aluno/);
  });
});
