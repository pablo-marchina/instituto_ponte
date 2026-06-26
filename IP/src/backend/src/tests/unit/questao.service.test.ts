import { describe, expect, it, jest } from "@jest/globals";
import type { AuthUser } from "../../middlewares/auth.js";
import { QuestaoService } from "../../services/questao.service.js";

const professor: AuthUser = { id: "prof-1", nome: "Prof", email: "p@test.com", perfil: "professor" };
const coordenador: AuthUser = { id: "coord-1", nome: "Coord", email: "c@test.com", perfil: "coordenador" };
const discursiva = { materiaId: "mat-1", tipo: "discursiva", enunciado: { conteudoLatex: "x" } };

const makeRepo = () => ({
  materiaExists: jest.fn<any>().mockResolvedValue(true),
  temaBelongsToMateria: jest.fn<any>().mockResolvedValue(true),
  professorMateriaVinculados: jest.fn<any>().mockResolvedValue(true),
  create: jest.fn<any>().mockResolvedValue({ id: "q-1" }),
  findMany: jest.fn<any>().mockResolvedValue({ data: [], total: 0 }),
  findById: jest.fn<any>().mockResolvedValue({ id: "q-1", materiaId: "mat-1" }),
  update: jest.fn<any>().mockResolvedValue({ id: "q-1", materiaId: "mat-1" }),
  deleteOrDeactivate: jest.fn<any>().mockResolvedValue(undefined),
});

describe("QuestaoService - unitário", () => {
  it("deve criar questão discursiva válida", async () => {
    const service = new QuestaoService(makeRepo() as any);

    await expect(service.criar(discursiva as any, professor)).resolves.toEqual({ id: "q-1" });
  });

  it("deve validar alternativas por tipo", async () => {
    const service = new QuestaoService(makeRepo() as any);

    await expect(service.criar({ ...discursiva, alternativas: [{ ordemOriginal: 1, correta: false }] } as any, professor)).rejects.toThrow("Questões discursivas não devem ter alternativas.");
    await expect(service.criar({ ...discursiva, tipo: "multipla_escolha", alternativas: [{ ordemOriginal: 1, correta: true }] } as any, professor)).rejects.toThrow("Questões de múltipla escolha precisam ter pelo menos duas alternativas e exatamente uma correta.");
    await expect(service.criar({ ...discursiva, tipo: "verdadeiro_falso", alternativas: [{ ordemOriginal: 1, correta: true }, { ordemOriginal: 1, correta: false }] } as any, professor)).rejects.toThrow("Ordem de alternativa duplicada.");
    await expect(service.criar({ ...discursiva, tipo: "verdadeiro_falso", alternativas: [{ ordemOriginal: 1, correta: true }] } as any, professor)).rejects.toThrow("Questões de verdadeiro/falso precisam ter exatamente duas alternativas e uma correta.");
  });

  it("deve rejeitar limites e anexos em questão objetiva", async () => {
    const service = new QuestaoService(makeRepo() as any);

    await expect(service.criar({
      ...discursiva,
      tipo: "multipla_escolha",
      permiteAnexo: true,
      alternativas: [{ ordemOriginal: 1, correta: true }, { ordemOriginal: 2, correta: false }],
    } as any, professor)).rejects.toThrow("Limites e anexos só são válidos para questões discursivas.");
  });

  it("deve validar matéria, tema e vínculo do professor", async () => {
    const repo = makeRepo();
    const service = new QuestaoService(repo as any);

    repo.materiaExists.mockResolvedValueOnce(false);
    await expect(service.criar(discursiva as any, professor)).rejects.toThrow("Matéria informada não existe.");

    repo.materiaExists.mockResolvedValue(true);
    repo.temaBelongsToMateria.mockResolvedValueOnce(false);
    await expect(service.criar({ ...discursiva, temaId: "tema-1" } as any, professor)).rejects.toThrow("Tema informado não pertence à matéria da questão.");

    repo.professorMateriaVinculados.mockResolvedValueOnce(false);
    await expect(service.criar(discursiva as any, professor)).rejects.toThrow("Professor não está vinculado à matéria informada.");
  });

  it("deve listar, buscar, atualizar e remover questão", async () => {
    const repo = makeRepo();
    const service = new QuestaoService(repo as any);

    await expect(service.listar({ page: 1 } as any, coordenador)).resolves.toEqual({ data: [], total: 0 });
    await expect(service.buscarPorId("q-1", professor)).resolves.toMatchObject({ id: "q-1" });
    await expect(service.atualizar("q-1", discursiva as any, professor)).resolves.toMatchObject({ id: "q-1" });
    await service.remover("q-1", professor);
    expect(repo.deleteOrDeactivate).toHaveBeenCalledWith("q-1");
  });

  it("deve lançar notFound ao buscar questão inexistente", async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(null);
    const service = new QuestaoService(repo as any);

    await expect(service.buscarPorId("x", professor)).rejects.toThrow("Questão não encontrada.");
  });
});
