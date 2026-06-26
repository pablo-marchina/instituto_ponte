import { describe, expect, it, jest } from "@jest/globals";
import type { AuthUser } from "../../middlewares/auth.js";
import { ProfessorService } from "../../services/professor.service.js";

const user: AuthUser = { id: "coord-1", nome: "Coord", email: "coord@test.com", perfil: "coordenador" };
const professor = { id: "prof-1", nome: "Professor", email: "p@test.com", coordenadorId: "coord-1" };

const makeRepo = () => ({
  coordenadorExists: jest.fn<any>().mockResolvedValue(true),
  findByEmail: jest.fn<any>().mockResolvedValue(null),
  create: jest.fn<any>().mockResolvedValue(professor),
  findAll: jest.fn<any>().mockResolvedValue({ data: [professor], total: 1 }),
  findById: jest.fn<any>().mockResolvedValue(professor),
  update: jest.fn<any>().mockResolvedValue({ ...professor, nome: "Novo" }),
  delete: jest.fn<any>().mockResolvedValue(true),
  materiaExists: jest.fn<any>().mockResolvedValue(true),
  vinculoExists: jest.fn<any>().mockResolvedValue(false),
  criarVinculo: jest.fn<any>().mockResolvedValue({ professorId: "prof-1", materiaId: "mat-1" }),
  removerVinculo: jest.fn<any>().mockResolvedValue(true),
  findMateriasByProfessor: jest.fn<any>().mockResolvedValue([{ id: "mat-1" }]),
});

describe("ProfessorService - unitario", () => {
  it("cria professor quando coordenador existe e email e unico", async () => {
    const service = new ProfessorService(makeRepo() as any);

    await expect(service.criar({ nome: "Professor", email: "p@test.com", coordenadorId: "coord-1" } as any, user)).resolves.toEqual(professor);
  });

  it("bloqueia criacao com coordenador inexistente ou email duplicado", async () => {
    const repo = makeRepo();
    const service = new ProfessorService(repo as any);

    repo.coordenadorExists.mockResolvedValueOnce(false);
    await expect(service.criar({ coordenadorId: "x" } as any, user)).rejects.toThrow(/coordenador informado/);

    repo.coordenadorExists.mockResolvedValueOnce(true);
    repo.findByEmail.mockResolvedValueOnce(professor);
    await expect(service.criar({ email: "p@test.com", coordenadorId: "coord-1" } as any, user)).rejects.toThrow(/professor com este e-mail/);
  });

  it("lista, busca, atualiza e remove professor", async () => {
    const repo = makeRepo();
    const service = new ProfessorService(repo as any);

    await expect(service.listar({ page: 1, limit: 10 }, user)).resolves.toEqual({ data: [professor], total: 1 });
    await expect(service.buscarPorId("prof-1", user)).resolves.toEqual(professor);
    await expect(service.atualizar("prof-1", { nome: "Novo" } as any, user)).resolves.toMatchObject({ nome: "Novo" });
    await service.remover("prof-1", user);
    expect(repo.delete).toHaveBeenCalledWith("prof-1");
  });

  it("cobre erros de busca, atualizacao e remocao", async () => {
    const repo = makeRepo();
    const service = new ProfessorService(repo as any);

    repo.findById.mockResolvedValueOnce(null);
    await expect(service.buscarPorId("x", user)).rejects.toThrow(/Professor/);

    repo.findByEmail.mockResolvedValueOnce({ id: "outro" });
    await expect(service.atualizar("prof-1", { email: "x@test.com" } as any, user)).rejects.toThrow(/professor com este e-mail/);

    repo.coordenadorExists.mockResolvedValueOnce(false);
    await expect(service.atualizar("prof-1", { coordenadorId: "coord-x" } as any, user)).rejects.toThrow(/coordenador informado/);

    repo.coordenadorExists.mockResolvedValueOnce(true);
    repo.update.mockResolvedValueOnce(null);
    await expect(service.atualizar("prof-1", { coordenadorId: "coord-1" } as any, user)).rejects.toThrow(/Professor/);

    repo.findById.mockResolvedValueOnce(null);
    await expect(service.atualizar("prof-x", { nome: "Novo" } as any, user)).rejects.toThrow(/Professor/);

    repo.findById.mockResolvedValueOnce(null);
    await expect(service.remover("prof-x", user)).rejects.toThrow(/Professor/);

    repo.delete.mockResolvedValueOnce(false);
    await expect(service.remover("prof-1", user)).rejects.toThrow(/vinculos|v.nculos|associadas/i);
  });

  it("cria, lista e remove vinculos professor-materia", async () => {
    const repo = makeRepo();
    const service = new ProfessorService(repo as any);

    await expect(service.criarVinculo("prof-1", "mat-1", user)).resolves.toEqual({ professorId: "prof-1", materiaId: "mat-1" });
    await expect(service.listarMaterias("prof-1", user)).resolves.toEqual([{ id: "mat-1" }]);
    await service.removerVinculo("prof-1", "mat-1", user);
    expect(repo.findMateriasByProfessor).toHaveBeenCalledWith("prof-1");
    expect(repo.removerVinculo).toHaveBeenCalledWith("prof-1", "mat-1");
  });

  it("cobre validacoes de vinculos", async () => {
    const repo = makeRepo();
    const service = new ProfessorService(repo as any);

    repo.vinculoExists.mockResolvedValueOnce(true);
    await expect(service.criarVinculo("prof-1", "mat-1", user)).rejects.toThrow(/V.nculo/);

    repo.findById.mockResolvedValueOnce(null);
    await expect(service.criarVinculo("prof-x", "mat-1", user)).rejects.toThrow(/Professor/);

    repo.findById.mockResolvedValueOnce(professor);
    repo.materiaExists.mockResolvedValueOnce(false);
    await expect(service.criarVinculo("prof-1", "mat-x", user)).rejects.toThrow(/Mat/);

    repo.findById.mockResolvedValueOnce(null);
    await expect(service.listarMaterias("prof-x", user)).rejects.toThrow(/Professor/);

    repo.findById.mockResolvedValueOnce(null);
    await expect(service.removerVinculo("prof-x", "mat-1", user)).rejects.toThrow(/Professor/);

    repo.findById.mockResolvedValueOnce(professor);
    repo.removerVinculo.mockResolvedValueOnce(false);
    await expect(service.removerVinculo("prof-1", "mat-x", user)).rejects.toThrow(/V.nculo/);
  });
});
