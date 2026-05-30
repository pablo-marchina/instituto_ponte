import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import type { AuthUser } from "../../middlewares/auth.js";

const mockMateriaExists = jest.fn<any>();
const mockTemaBelongsToMateria = jest.fn<any>();
const mockProfessorMateriaVinculados = jest.fn<any>();
const mockCreate = jest.fn<any>();
const mockFindMany = jest.fn<any>();
const mockFindById = jest.fn<any>();
const mockUpdate = jest.fn<any>();
const mockDeleteOrDeactivate = jest.fn<any>();

jest.unstable_mockModule("../../repositories/questao.repository.js", () => ({
  QuestaoRepository: jest.fn().mockImplementation(() => ({
    materiaExists: mockMateriaExists,
    temaBelongsToMateria: mockTemaBelongsToMateria,
    professorMateriaVinculados: mockProfessorMateriaVinculados,
    create: mockCreate,
    findMany: mockFindMany,
    findById: mockFindById,
    update: mockUpdate,
    deleteOrDeactivate: mockDeleteOrDeactivate,
  })),
}));

type QuestaoServiceModule = typeof import("../../services/questao.service.js");
let QuestaoService: QuestaoServiceModule["QuestaoService"];

const profUser: AuthUser = { id: "prof-1", nome: "Prof", email: "prof@test.com", perfil: "professor" };
const coordUser: AuthUser = { id: "coord-1", nome: "Coord", email: "coord@test.com", perfil: "coordenador" };

beforeEach(async () => {
  jest.resetModules();
  [mockMateriaExists, mockTemaBelongsToMateria, mockProfessorMateriaVinculados,
   mockCreate, mockFindMany, mockFindById, mockUpdate, mockDeleteOrDeactivate].forEach((m) => m.mockReset());
  const mod = await import("../../services/questao.service.js");
  QuestaoService = mod.QuestaoService;
});

describe("QuestaoService", () => {
  it("criar com alternativas com ordem duplicada deve lancar erro", async () => {
    await expect(new QuestaoService().criar({
      tipo: "multipla_escolha", materiaId: "mat-1",
      alternativas: [{ texto: "A", correta: true, ordemOriginal: 1 }, { texto: "B", correta: false, ordemOriginal: 1 }],
    }, profUser)).rejects.toThrow("Ordem de alternativa duplicada.");
  });

  it("criar discursiva com alternativas deve lancar erro", async () => {
    await expect(new QuestaoService().criar({
      tipo: "discursiva", materiaId: "mat-1",
      alternativas: [{ texto: "A", correta: false, ordemOriginal: 1 }],
    }, profUser)).rejects.toThrow("Questões discursivas não devem ter alternativas.");
  });

  it("criar multipla escolha com menos de 2 alternativas deve lancar erro", async () => {
    await expect(new QuestaoService().criar({
      tipo: "multipla_escolha", materiaId: "mat-1",
      alternativas: [{ texto: "A", correta: true, ordemOriginal: 1 }],
    }, profUser)).rejects.toThrow("Questões de múltipla escolha precisam ter pelo menos duas alternativas e exatamente uma correta.");
  });

  it("criar verdadeiro/falso invalido deve lancar erro", async () => {
    await expect(new QuestaoService().criar({
      tipo: "verdadeiro_falso", materiaId: "mat-1",
      alternativas: [{ texto: "V", correta: true, ordemOriginal: 1 }],
    }, profUser)).rejects.toThrow("Questões de verdadeiro/falso precisam ter exatamente duas alternativas e uma correta.");
  });

  it("criar discursiva com limiteCaracteres para nao discursiva deve lancar erro", async () => {
    await expect(new QuestaoService().criar({
      tipo: "multipla_escolha", materiaId: "mat-1", limiteCaracteres: 100,
      alternativas: [{ texto: "A", correta: true, ordemOriginal: 1 }, { texto: "B", correta: false, ordemOriginal: 2 }],
    }, profUser)).rejects.toThrow("Limites e anexos só são válidos para questões discursivas.");
  });

  it("criar deve lancar erro se materia nao existe", async () => {
    mockMateriaExists.mockResolvedValue(false);
    await expect(new QuestaoService().criar({
      tipo: "discursiva", materiaId: "mat-x",
    }, profUser)).rejects.toThrow("Matéria informada não existe.");
  });

  it("criar deve lancar erro se tema nao pertence a materia", async () => {
    mockMateriaExists.mockResolvedValue(true);
    mockTemaBelongsToMateria.mockResolvedValue(false);
    await expect(new QuestaoService().criar({
      tipo: "discursiva", materiaId: "mat-1", temaId: "tema-x",
    }, profUser)).rejects.toThrow("Tema informado não pertence à matéria da questão.");
  });

  it("criar deve lancar erro se professor nao vinculado a materia", async () => {
    mockMateriaExists.mockResolvedValue(true);
    mockProfessorMateriaVinculados.mockResolvedValue(false);
    await expect(new QuestaoService().criar({
      tipo: "discursiva", materiaId: "mat-1",
    }, profUser)).rejects.toThrow("Professor não está vinculado à matéria informada.");
  });

  it("criar discursiva com coordenador deve criar sem validar vinculo", async () => {
    mockMateriaExists.mockResolvedValue(true);
    mockCreate.mockResolvedValue({ id: "q-1" });
    const result = await new QuestaoService().criar({
      tipo: "discursiva", materiaId: "mat-1",
    }, coordUser);
    expect(result.id).toBe("q-1");
  });

  it("buscarPorId deve lancar erro se questao nao encontrada", async () => {
    mockFindById.mockResolvedValue(null);
    await expect(new QuestaoService().buscarPorId("q-x", profUser)).rejects.toThrow("Questão não encontrada.");
  });

  it("buscarPorId deve lancar erro se professor nao vinculado a materia da questao", async () => {
    mockFindById.mockResolvedValue({ id: "q-1", materiaId: "mat-1" });
    mockProfessorMateriaVinculados.mockResolvedValue(false);
    await expect(new QuestaoService().buscarPorId("q-1", profUser)).rejects.toThrow("Professor não está vinculado à matéria da questão.");
  });

  it("atualizar deve lancar erro se questao nao encontrada", async () => {
    mockFindById.mockResolvedValue(null);
    await expect(new QuestaoService().atualizar("q-x", { tipo: "discursiva", materiaId: "mat-1" }, profUser)).rejects.toThrow("Questão não encontrada.");
  });

  it("atualizar deve lancar erro se update retorna null", async () => {
    mockFindById.mockResolvedValue({ id: "q-1", materiaId: "mat-1" });
    mockProfessorMateriaVinculados.mockResolvedValue(true);
    mockMateriaExists.mockResolvedValue(true);
    mockUpdate.mockResolvedValue(null);
    await expect(new QuestaoService().atualizar("q-1", { tipo: "discursiva", materiaId: "mat-1" }, coordUser)).rejects.toThrow("Questão não encontrada.");
  });
});
