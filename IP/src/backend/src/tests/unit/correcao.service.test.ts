import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import type { AuthUser } from "../../middlewares/auth.js";

const mockHasAccessToProva = jest.fn<any>();
const mockFindProvaExists = jest.fn<any>();
const mockFindQuestoesDaProva = jest.fn<any>();
const mockFindRespostasPorQuestao = jest.fn<any>();
const mockFindRespostaContext = jest.fn<any>();
const mockProfessorLinkedToMateria = jest.fn<any>();
const mockUpsertCorrecao = jest.fn<any>();
const mockCorrigirObjetivas = jest.fn<any>();

jest.unstable_mockModule("../../repositories/correcao.repository.js", () => ({
  CorrecaoRepository: jest.fn().mockImplementation(() => ({
    hasAccessToProva: mockHasAccessToProva,
    findProvaExists: mockFindProvaExists,
    findQuestoesDaProva: mockFindQuestoesDaProva,
    findRespostasPorQuestao: mockFindRespostasPorQuestao,
    findRespostaContext: mockFindRespostaContext,
    professorLinkedToMateria: mockProfessorLinkedToMateria,
    upsertCorrecao: mockUpsertCorrecao,
    corrigirObjetivas: mockCorrigirObjetivas,
  })),
}));

type ServiceModule = typeof import("../../services/correcao.service.js");
let CorrecaoService: ServiceModule["CorrecaoService"];

const professor: AuthUser = {
  id: "prof-1",
  nome: "Professor",
  email: "prof@test.com",
  perfil: "professor",
};

const coordenador: AuthUser = {
  id: "coord-1",
  nome: "Coordenador",
  email: "coord@test.com",
  perfil: "coordenador",
};

const aluno = {
  id: "aluno-1",
  nome: "Aluno",
  email: "aluno@test.com",
  perfil: "aluno",
} as unknown as AuthUser;

beforeEach(async () => {
  jest.resetModules();
  mockHasAccessToProva.mockReset();
  mockFindProvaExists.mockReset();
  mockFindQuestoesDaProva.mockReset();
  mockFindRespostasPorQuestao.mockReset();
  mockFindRespostaContext.mockReset();
  mockProfessorLinkedToMateria.mockReset();
  mockUpsertCorrecao.mockReset();
  mockCorrigirObjetivas.mockReset();
  const mod = await import("../../services/correcao.service.js");
  CorrecaoService = mod.CorrecaoService;
});

describe("CorrecaoService - unitário", () => {
  describe("listarQuestoesDaProva", () => {
    it("deve listar questões quando tem acesso", async () => {
      mockHasAccessToProva.mockResolvedValue(true);
      mockFindQuestoesDaProva.mockResolvedValue([{ id: "q-1", enunciado: "Questão 1" }]);

      const service = new CorrecaoService();
      const result = await service.listarQuestoesDaProva("prova-1", professor);

      expect(result).toHaveLength(1);
    });

    it("deve lançar forbidden quando sem acesso", async () => {
      mockHasAccessToProva.mockResolvedValue(false);
      mockFindProvaExists.mockResolvedValue(true);

      const service = new CorrecaoService();
      await expect(
        service.listarQuestoesDaProva("prova-1", professor),
      ).rejects.toThrow("Usuário sem permissão para acessar esta prova.");
    });

    it("deve lançar notFound quando prova não existe", async () => {
      mockHasAccessToProva.mockResolvedValue(false);
      mockFindProvaExists.mockResolvedValue(false);

      const service = new CorrecaoService();
      await expect(
        service.listarQuestoesDaProva("prova-x", professor),
      ).rejects.toThrow("Prova não encontrada.");
    });
  });

  describe("listarRespostasPorQuestao", () => {
    it("deve listar respostas quando tem acesso", async () => {
      mockHasAccessToProva.mockResolvedValue(true);
      mockFindRespostasPorQuestao.mockResolvedValue([{ id: "r-1", aluno: "Aluno" }]);

      const service = new CorrecaoService();
      const result = await service.listarRespostasPorQuestao("prova-1", "q-1", professor);

      expect(result).toHaveLength(1);
    });

    it("deve lançar forbidden quando sem acesso", async () => {
      mockHasAccessToProva.mockResolvedValue(false);
      mockFindProvaExists.mockResolvedValue(true);

      const service = new CorrecaoService();
      await expect(
        service.listarRespostasPorQuestao("prova-1", "q-1", professor),
      ).rejects.toThrow("Usuário sem permissão para acessar esta prova.");
    });
  });

  describe("salvarCorrecao", () => {
    const contextProfessor = {
      provaAlunoStatus: "enviada",
      pontuacaoMax: 10,
      professorId: "prof-1",
      materiaId: "mat-1",
    };

    const contextOutroProf = {
      ...contextProfessor,
      professorId: "prof-outro",
    };

    it("deve salvar correção do próprio professor", async () => {
      mockFindRespostaContext.mockResolvedValue(contextProfessor);
      mockUpsertCorrecao.mockResolvedValue({ id: "corr-1", nota: 8 });

      const service = new CorrecaoService();
      const result = await service.salvarCorrecao("resp-1", { nota: 8, observacao: "Bom" }, professor);

      expect(result).toEqual({ id: "corr-1", nota: 8 });
    });

    it("deve lançar forbidden quando perfil não pode corrigir", async () => {
      const service = new CorrecaoService();
      await expect(
        service.salvarCorrecao("resp-1", { nota: 8 }, aluno),
      ).rejects.toThrow("Somente professores e coordenadores podem corrigir respostas.");
    });

    it("deve lançar notFound quando resposta não existe", async () => {
      mockFindRespostaContext.mockResolvedValue(null);

      const service = new CorrecaoService();
      await expect(
        service.salvarCorrecao("resp-inexistente", { nota: 8 }, professor),
      ).rejects.toThrow("Resposta não encontrada.");
    });

    it("deve lançar conflict quando prova não foi enviada", async () => {
      mockFindRespostaContext.mockResolvedValue({
        ...contextProfessor,
        provaAlunoStatus: "pendente",
      });

      const service = new CorrecaoService();
      await expect(
        service.salvarCorrecao("resp-1", { nota: 8 }, professor),
      ).rejects.toThrow("A correção só pode ser feita depois do envio da prova.");
    });

    it("deve permitir corrigir prova já corrigida anteriormente", async () => {
      mockFindRespostaContext.mockResolvedValue({
        ...contextProfessor,
        provaAlunoStatus: "corrigida",
      });
      mockUpsertCorrecao.mockResolvedValue({ id: "corr-1", nota: 9 });

      const service = new CorrecaoService();
      const result = await service.salvarCorrecao("resp-1", { nota: 9 }, professor);

      expect(result).toBeDefined();
    });

    it("deve lançar businessRule quando nota excede pontuação máxima", async () => {
      mockFindRespostaContext.mockResolvedValue({
        ...contextProfessor,
        pontuacaoMax: 10,
      });

      const service = new CorrecaoService();
      await expect(
        service.salvarCorrecao("resp-1", { nota: 11 }, professor),
      ).rejects.toThrow("A nota não pode ser maior que a pontuação máxima da questão.");
    });

    it("deve permitir correção de outro professor vinculado à matéria", async () => {
      mockFindRespostaContext.mockResolvedValue(contextOutroProf);
      mockProfessorLinkedToMateria.mockResolvedValue(true);
      mockUpsertCorrecao.mockResolvedValue({ id: "corr-1", nota: 7 });

      const service = new CorrecaoService();
      const result = await service.salvarCorrecao("resp-1", { nota: 7 }, professor);

      expect(result).toBeDefined();
      expect(mockProfessorLinkedToMateria).toHaveBeenCalledWith("prof-1", "mat-1");
    });

    it("deve lançar forbidden quando outro professor sem vínculo", async () => {
      mockFindRespostaContext.mockResolvedValue(contextOutroProf);
      mockProfessorLinkedToMateria.mockResolvedValue(false);

      const service = new CorrecaoService();
      await expect(
        service.salvarCorrecao("resp-1", { nota: 7 }, professor),
      ).rejects.toThrow("Professor sem vínculo com esta prova.");
    });
  });

  describe("executarCorrecaoAutomatica", () => {
    it("deve executar correção automática quando professor tem acesso", async () => {
      mockHasAccessToProva.mockResolvedValue(true);
      mockCorrigirObjetivas.mockResolvedValue({ corrigidas: 5 });

      const service = new CorrecaoService();
      const result = await service.executarCorrecaoAutomatica("prova-1", professor);

      expect(result).toEqual({ corrigidas: 5 });
    });

    it("deve executar correção automática quando coordenador tem acesso", async () => {
      mockHasAccessToProva.mockResolvedValue(true);
      mockCorrigirObjetivas.mockResolvedValue({ corrigidas: 5 });

      const service = new CorrecaoService();
      const result = await service.executarCorrecaoAutomatica("prova-1", coordenador);

      expect(result).toEqual({ corrigidas: 5 });
    });

    it("deve lançar forbidden quando sem acesso à prova", async () => {
      mockHasAccessToProva.mockResolvedValue(false);
      mockFindProvaExists.mockResolvedValue(true);

      const service = new CorrecaoService();
      await expect(
        service.executarCorrecaoAutomatica("prova-1", professor),
      ).rejects.toThrow("Usuário sem permissão para acessar esta prova.");
    });

    it("deve lançar notFound quando prova da correção automática não existe", async () => {
      mockHasAccessToProva.mockResolvedValue(false);
      mockFindProvaExists.mockResolvedValue(false);

      const service = new CorrecaoService();
      await expect(
        service.executarCorrecaoAutomatica("prova-x", professor),
      ).rejects.toThrow("Prova não encontrada.");
    });
  });
});
