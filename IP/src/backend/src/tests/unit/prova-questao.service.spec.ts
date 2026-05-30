import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import type { AuthUser } from "../../middlewares/auth.js";

const mockFindProva = jest.fn<any>();
const mockHasAccess = jest.fn<any>();
const mockFindQuestao = jest.fn<any>();
const mockHasOrdem = jest.fn<any>();
const mockHasQuestao = jest.fn<any>();
const mockCreate = jest.fn<any>();
const mockFindByProva = jest.fn<any>();
const mockDelete = jest.fn<any>();

jest.unstable_mockModule("../../repositories/prova-questao.repository.js", () => ({
  ProvaQuestaoRepository: jest.fn().mockImplementation(() => ({
    findProva: mockFindProva,
    hasAccess: mockHasAccess,
    findQuestao: mockFindQuestao,
    hasOrdem: mockHasOrdem,
    hasQuestao: mockHasQuestao,
    create: mockCreate,
    findByProva: mockFindByProva,
    delete: mockDelete,
  })),
}));

type ProvaQuestaoServiceModule = typeof import("../../services/prova-questao.service.js");
let ProvaQuestaoService: ProvaQuestaoServiceModule["ProvaQuestaoService"];

const user: AuthUser = { id: "prof-1", nome: "Prof", email: "prof@test.com", perfil: "professor" };

beforeEach(async () => {
  jest.resetModules();
  [mockFindProva, mockHasAccess, mockFindQuestao, mockHasOrdem, mockHasQuestao, mockCreate, mockFindByProva, mockDelete].forEach((m) => m.mockReset());
  const mod = await import("../../services/prova-questao.service.js");
  ProvaQuestaoService = mod.ProvaQuestaoService;
});

describe("ProvaQuestaoService", () => {
  it("adicionar deve lancar erro se prova nao encontrada", async () => {
    mockFindProva.mockResolvedValue(null);
    await expect(new ProvaQuestaoService().adicionar("prova-x", { questaoId: "q-1", ordemOriginal: 1 }, user)).rejects.toThrow("Prova não encontrada.");
  });

  it("adicionar deve lancar erro sem permissao", async () => {
    mockFindProva.mockResolvedValue({ id: "prova-1", status: "rascunho" });
    mockHasAccess.mockResolvedValue(false);
    await expect(new ProvaQuestaoService().adicionar("prova-1", { questaoId: "q-1", ordemOriginal: 1 }, user)).rejects.toThrow("Usuário sem permissão para acessar esta prova.");
  });

  it("adicionar deve lancar erro se prova nao esta em rascunho", async () => {
    mockFindProva.mockResolvedValue({ id: "prova-1", status: "publicada" });
    mockHasAccess.mockResolvedValue(true);
    await expect(new ProvaQuestaoService().adicionar("prova-1", { questaoId: "q-1", ordemOriginal: 1 }, user)).rejects.toThrow("Questões só podem ser alteradas em provas com status rascunho.");
  });

  it("adicionar deve lancar erro se questao nao encontrada", async () => {
    mockFindProva.mockResolvedValue({ id: "prova-1", status: "rascunho", materia_id: "mat-1" });
    mockHasAccess.mockResolvedValue(true);
    mockFindQuestao.mockResolvedValue(null);
    await expect(new ProvaQuestaoService().adicionar("prova-1", { questaoId: "q-x", ordemOriginal: 1 }, user)).rejects.toThrow("Questão não encontrada.");
  });

  it("adicionar deve lancar erro se materia diferente", async () => {
    mockFindProva.mockResolvedValue({ id: "prova-1", status: "rascunho", materia_id: "mat-1" });
    mockHasAccess.mockResolvedValue(true);
    mockFindQuestao.mockResolvedValue({ materia_id: "mat-2", tem_enunciado: true });
    await expect(new ProvaQuestaoService().adicionar("prova-1", { questaoId: "q-1", ordemOriginal: 1 }, user)).rejects.toThrow("A questão não pertence à mesma matéria da prova.");
  });

  it("adicionar deve lancar erro se questao sem enunciado", async () => {
    mockFindProva.mockResolvedValue({ id: "prova-1", status: "rascunho", materia_id: "mat-1" });
    mockHasAccess.mockResolvedValue(true);
    mockFindQuestao.mockResolvedValue({ materia_id: "mat-1", tem_enunciado: false });
    await expect(new ProvaQuestaoService().adicionar("prova-1", { questaoId: "q-1", ordemOriginal: 1 }, user)).rejects.toThrow("A questão precisa ter enunciado antes de ser associada à prova.");
  });

  it("adicionar deve lancar erro se ordem duplicada", async () => {
    mockFindProva.mockResolvedValue({ id: "prova-1", status: "rascunho", materia_id: "mat-1" });
    mockHasAccess.mockResolvedValue(true);
    mockFindQuestao.mockResolvedValue({ materia_id: "mat-1", tem_enunciado: true });
    mockHasOrdem.mockResolvedValue(true);
    await expect(new ProvaQuestaoService().adicionar("prova-1", { questaoId: "q-1", ordemOriginal: 1 }, user)).rejects.toThrow("Já existe questão nessa ordem para a prova.");
  });

  it("adicionar deve lancar erro se questao ja vinculada", async () => {
    mockFindProva.mockResolvedValue({ id: "prova-1", status: "rascunho", materia_id: "mat-1" });
    mockHasAccess.mockResolvedValue(true);
    mockFindQuestao.mockResolvedValue({ materia_id: "mat-1", tem_enunciado: true });
    mockHasOrdem.mockResolvedValue(false);
    mockHasQuestao.mockResolvedValue(true);
    await expect(new ProvaQuestaoService().adicionar("prova-1", { questaoId: "q-1", ordemOriginal: 1 }, user)).rejects.toThrow("Questão já vinculada à prova.");
  });

  it("remover deve lancar erro se prova nao encontrada", async () => {
    mockFindProva.mockResolvedValue(null);
    await expect(new ProvaQuestaoService().remover("prova-x", "q-1", user)).rejects.toThrow("Prova não encontrada.");
  });

  it("remover deve lancar erro se nao esta em rascunho", async () => {
    mockFindProva.mockResolvedValue({ id: "prova-1", status: "publicada" });
    mockHasAccess.mockResolvedValue(true);
    await expect(new ProvaQuestaoService().remover("prova-1", "q-1", user)).rejects.toThrow("Questões só podem ser alteradas em provas com status rascunho.");
  });

  it("remover deve lancar erro se questao nao vinculada", async () => {
    mockFindProva.mockResolvedValue({ id: "prova-1", status: "rascunho", materia_id: "mat-1" });
    mockHasAccess.mockResolvedValue(true);
    mockHasQuestao.mockResolvedValue(false);
    await expect(new ProvaQuestaoService().remover("prova-1", "q-1", user)).rejects.toThrow("Questão não está vinculada à prova.");
  });
});
