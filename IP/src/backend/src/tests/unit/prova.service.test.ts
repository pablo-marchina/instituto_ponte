import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import type { AuthUser } from "../../middlewares/auth.js";

const mockFindById = jest.fn<any>();
const mockHasAccess = jest.fn<any>();
const mockProfessorExists = jest.fn<any>();
const mockMateriaExists = jest.fn<any>();
const mockProfessorMateriaVinculados = jest.fn<any>();
const mockFindProfessorIdsByMateria = jest.fn<any>();
const mockCreate = jest.fn<any>();
const mockFindMany = jest.fn<any>();
const mockUpdate = jest.fn<any>();
const mockUpdateConfiguracoes = jest.fn<any>();
const mockCountQuestoes = jest.fn<any>();
const mockHasQuestoesObjetivasInvalidas = jest.fn<any>();
const mockPublish = jest.fn<any>();
const mockUpdateStatus = jest.fn<any>();
const mockDelete = jest.fn<any>();
const mockHasSubmissions = jest.fn<any>();
const mockFindStatusHistorico = jest.fn<any>();
const mockRemoveQuestoesForaDaMateria = jest.fn<any>();

jest.unstable_mockModule("../../repositories/prova.repository.js", () => ({
  ProvaRepository: jest.fn().mockImplementation(() => ({
    findById: mockFindById,
    hasAccess: mockHasAccess,
    professorExists: mockProfessorExists,
    materiaExists: mockMateriaExists,
    professorMateriaVinculados: mockProfessorMateriaVinculados,
    findProfessorIdsByMateria: mockFindProfessorIdsByMateria,
    create: mockCreate,
    findMany: mockFindMany,
    update: mockUpdate,
    updateConfiguracoes: mockUpdateConfiguracoes,
    countQuestoes: mockCountQuestoes,
    hasQuestoesObjetivasInvalidas: mockHasQuestoesObjetivasInvalidas,
    publish: mockPublish,
    updateStatus: mockUpdateStatus,
    delete: mockDelete,
    hasSubmissions: mockHasSubmissions,
    findStatusHistorico: mockFindStatusHistorico,
    removeQuestoesForaDaMateria: mockRemoveQuestoesForaDaMateria,
  })),
}));

type ServiceModule = typeof import("../../services/prova.service.js");
let ProvaService: ServiceModule["ProvaService"];

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

const makeProva = (overrides: Record<string, unknown> = {}) => ({
  id: "prova-1",
  professorId: "prof-1",
  materiaId: "mat-1",
  titulo: "Prova 1",
  modalidade: "online",
  turma: "3A",
  semestre: "2025.1",
  instrucoes: null,
  tempoLimiteMin: null,
  dataInicio: null,
  dataFim: null,
  embaralharQuestoes: true,
  embaralharAlternativas: true,
  status: "rascunho",
  urlAcesso: null,
  qrCode: null,
  criadoEm: "2025-01-01T00:00:00Z",
  atualizadoEm: "2025-01-01T00:00:00Z",
  materia: { id: "mat-1", nome: "Matemática" },
  professor: { id: "prof-1", nome: "Professor" },
  questoes: [],
  ...overrides,
});

beforeEach(async () => {
  jest.resetModules();
  mockFindById.mockReset();
  mockHasAccess.mockReset();
  mockProfessorExists.mockReset();
  mockMateriaExists.mockReset();
  mockProfessorMateriaVinculados.mockReset();
  mockFindProfessorIdsByMateria.mockReset();
  mockCreate.mockReset();
  mockFindMany.mockReset();
  mockUpdate.mockReset();
  mockUpdateConfiguracoes.mockReset();
  mockCountQuestoes.mockReset();
  mockHasQuestoesObjetivasInvalidas.mockReset();
  mockPublish.mockReset();
  mockUpdateStatus.mockReset();
  mockDelete.mockReset();
  mockHasSubmissions.mockReset();
  mockFindStatusHistorico.mockReset();
  mockRemoveQuestoesForaDaMateria.mockReset();
  const mod = await import("../../services/prova.service.js");
  ProvaService = mod.ProvaService;
});

describe("ProvaService - unitário", () => {
  describe("create", () => {
    it("deve criar prova quando professor e dados válidos", async () => {
      mockProfessorExists.mockResolvedValue(true);
      mockMateriaExists.mockResolvedValue(true);
      mockProfessorMateriaVinculados.mockResolvedValue(true);
      mockCreate.mockResolvedValue(makeProva());

      const service = new ProvaService();
      const result = await service.create(
        { materiaId: "mat-1", titulo: "Prova 1", turma: "3A", semestre: "2025.1" },
        professor,
      );

      expect(result.status).toBe("rascunho");
    });

    it("deve bloquear criacao de prova por coordenador", async () => {
      const service = new ProvaService();
      await expect(
        service.create({ materiaId: "mat-1", titulo: "Prova", turma: "3A", semestre: "2025.1" }, coordenador),
      ).rejects.toThrow("Somente professores podem criar provas.");
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("deve lançar forbidden quando professorId difere do user.id", async () => {
      const service = new ProvaService();
      await expect(
        service.create(
          { professorId: "prof-outro", materiaId: "mat-1", titulo: "Prova", turma: "3A", semestre: "2025.1" },
          professor,
        ),
      ).rejects.toThrow("Professor não pode criar prova para outro professor.");
    });

    it("deve lançar businessRule quando professor não existe", async () => {
      mockProfessorExists.mockResolvedValue(false);

      const service = new ProvaService();
      await expect(
        service.create({ materiaId: "mat-1", titulo: "Prova", turma: "3A", semestre: "2025.1" }, professor),
      ).rejects.toThrow("Professor informado não existe.");
    });

    it("deve lançar businessRule quando matéria não existe", async () => {
      mockProfessorExists.mockResolvedValue(true);
      mockMateriaExists.mockResolvedValue(false);

      const service = new ProvaService();
      await expect(
        service.create({ materiaId: "mat-inexistente", titulo: "Prova", turma: "3A", semestre: "2025.1" }, professor),
      ).rejects.toThrow("Matéria informada não existe.");
    });

    it("deve lançar forbidden quando professor não vinculado à matéria", async () => {
      mockProfessorExists.mockResolvedValue(true);
      mockMateriaExists.mockResolvedValue(true);
      mockProfessorMateriaVinculados.mockResolvedValue(false);

      const service = new ProvaService();
      await expect(
        service.create({ materiaId: "mat-1", titulo: "Prova", turma: "3A", semestre: "2025.1" }, professor),
      ).rejects.toThrow("Professor informado não está vinculado à matéria informada.");
    });

    it("deve usar modalidade online quando não especificada", async () => {
      mockProfessorExists.mockResolvedValue(true);
      mockMateriaExists.mockResolvedValue(true);
      mockProfessorMateriaVinculados.mockResolvedValue(true);
      mockCreate.mockResolvedValue(makeProva({ modalidade: "online" }));

      const service = new ProvaService();
      await service.create(
        { materiaId: "mat-1", titulo: "Prova", turma: "3A", semestre: "2025.1" },
        professor,
      );

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ modalidade: "online" }),
      );
    });
  });

  describe("buscarPorId", () => {
    it("deve retornar prova quando encontrada e com acesso", async () => {
      mockFindById.mockResolvedValue(makeProva());
      mockHasAccess.mockResolvedValue(true);

      const service = new ProvaService();
      const result = await service.buscarPorId("prova-1", professor);

      expect(result.id).toBe("prova-1");
    });

    it("deve lançar notFound quando prova não existe", async () => {
      mockFindById.mockResolvedValue(null);

      const service = new ProvaService();
      await expect(service.buscarPorId("inexistente", professor)).rejects.toThrow(
        "Prova não encontrada.",
      );
    });

    it("deve lançar forbidden quando sem acesso", async () => {
      mockFindById.mockResolvedValue(makeProva());
      mockHasAccess.mockResolvedValue(false);

      const service = new ProvaService();
      await expect(service.buscarPorId("prova-1", professor)).rejects.toThrow(
        "Usuário sem permissão para acessar esta prova.",
      );
    });
  });

  describe("listar", () => {
    it("CT02 - RN02 - deve preservar filtros de prova ao delegar para repository.findMany", async () => {
      mockFindMany.mockResolvedValue({ data: [], total: 0 });

      const service = new ProvaService();
      const result = await service.listar({ page: 1, limit: 10, status: "rascunho" }, professor);

      expect(mockFindMany).toHaveBeenCalledWith(
        { page: 1, limit: 10, status: "rascunho" },
        professor,
      );
      expect(result).toEqual({ data: [], total: 0 });
    });
  });

  describe("atualizar", () => {
    it("deve atualizar prova em rascunho", async () => {
      mockFindById.mockResolvedValue(makeProva());
      mockHasAccess.mockResolvedValue(true);
      mockUpdate.mockResolvedValue(makeProva({ titulo: "Prova Atualizada" }));

      const service = new ProvaService();
      const result = await service.atualizar("prova-1", { titulo: "Prova Atualizada" }, professor);

      expect(result!.titulo).toBe("Prova Atualizada");
    });

    it("CT01 - RN01 - deve lançar conflict quando prova não está em rascunho", async () => {
      mockFindById.mockResolvedValue(makeProva({ status: "publicada" }));
      mockHasAccess.mockResolvedValue(true);

      const service = new ProvaService();
      await expect(
        service.atualizar("prova-1", { titulo: "Novo Título" }, professor),
      ).rejects.toThrow("Apenas provas em rascunho podem ser editadas.");
    });
  });

  describe("atualizarConfiguracoes", () => {
    it("deve atualizar configurações de prova em rascunho", async () => {
      mockFindById.mockResolvedValue(makeProva());
      mockHasAccess.mockResolvedValue(true);
      mockUpdateConfiguracoes.mockResolvedValue({
        id: "prova-1",
        tempoLimiteMin: 60,
        dataInicio: null,
        dataFim: null,
        embaralharQuestoes: false,
        embaralharAlternativas: false,
      });

      const service = new ProvaService();
      const result = await service.atualizarConfiguracoes(
        "prova-1",
        { tempoLimiteMin: 60, embaralharQuestoes: false, embaralharAlternativas: false },
        professor,
      );

      expect(result.tempoLimiteMin).toBe(60);
    });

    it("deve lançar conflict quando prova não está em rascunho", async () => {
      mockFindById.mockResolvedValue(makeProva({ status: "publicada" }));
      mockHasAccess.mockResolvedValue(true);

      const service = new ProvaService();
      await expect(
        service.atualizarConfiguracoes("prova-1", { tempoLimiteMin: 60 }, professor),
      ).rejects.toThrow("Apenas provas em rascunho podem ter configurações alteradas.");
    });

    it("deve lançar notFound quando update retorna null", async () => {
      mockFindById.mockResolvedValue(makeProva());
      mockHasAccess.mockResolvedValue(true);
      mockUpdateConfiguracoes.mockResolvedValue(null);

      const service = new ProvaService();
      await expect(
        service.atualizarConfiguracoes("prova-1", { tempoLimiteMin: 60 }, professor),
      ).rejects.toThrow("Prova não encontrada.");
    });
  });

  describe("publicar", () => {
    const publicarPayload = () => ({
      baseUrlAluno: "http://aluno.com",
      dataFim: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });

    it("deve publicar prova com todos os pré-requisitos", async () => {
      mockFindById.mockResolvedValue(
        makeProva({ dataInicio: null, dataFim: null }),
      );
      mockHasAccess.mockResolvedValue(true);
      mockCountQuestoes.mockResolvedValue(5);
      mockHasQuestoesObjetivasInvalidas.mockResolvedValue(false);
      mockPublish.mockResolvedValue(makeProva({ status: "publicada" }));

      const service = new ProvaService();
      const result = await service.publicar("prova-1", publicarPayload(), professor);

      expect(result.status).toBe("publicada");
      expect(mockPublish).toHaveBeenCalledWith("prova-1", expect.any(String), expect.any(Date), expect.any(Date));
    });

    it("deve lançar conflict quando prova não está em rascunho", async () => {
      mockFindById.mockResolvedValue(makeProva({ status: "publicada" }));
      mockHasAccess.mockResolvedValue(true);

      const service = new ProvaService();
      await expect(
        service.publicar("prova-1", publicarPayload(), professor),
      ).rejects.toThrow("Apenas provas em rascunho podem ser publicadas.");
    });

    it("deve lançar conflict quando data limite não é futura", async () => {
      mockFindById.mockResolvedValue(makeProva({ dataInicio: null, dataFim: null }));
      mockHasAccess.mockResolvedValue(true);

      const service = new ProvaService();
      await expect(
        service.publicar("prova-1", { baseUrlAluno: "http://aluno.com", dataFim: "2020-01-01T00:00:00.000Z" }, professor),
      ).rejects.toThrow("A data limite da prova deve ser futura.");
    });

    it("deve lançar conflict quando não há questões", async () => {
      mockFindById.mockResolvedValue(
        makeProva({ dataInicio: "2025-06-01T00:00:00Z", dataFim: "2025-06-30T00:00:00Z" }),
      );
      mockHasAccess.mockResolvedValue(true);
      mockCountQuestoes.mockResolvedValue(0);

      const service = new ProvaService();
      await expect(
        service.publicar("prova-1", publicarPayload(), professor),
      ).rejects.toThrow("Não é possível publicar uma prova sem questões.");
    });

    it("deve lançar conflict quando questões objetivas são inválidas", async () => {
      mockFindById.mockResolvedValue(
        makeProva({ dataInicio: "2025-06-01T00:00:00Z", dataFim: "2025-06-30T00:00:00Z" }),
      );
      mockHasAccess.mockResolvedValue(true);
      mockCountQuestoes.mockResolvedValue(5);
      mockHasQuestoesObjetivasInvalidas.mockResolvedValue(true);

      const service = new ProvaService();
      await expect(
        service.publicar("prova-1", publicarPayload(), professor),
      ).rejects.toThrow("Questões objetivas precisam ter alternativas válidas e gabarito.");
    });

    it("deve lançar notFound quando publish retorna null", async () => {
      mockFindById.mockResolvedValue(
        makeProva({ dataInicio: "2025-06-01T00:00:00Z", dataFim: "2025-06-30T00:00:00Z" }),
      );
      mockHasAccess.mockResolvedValue(true);
      mockCountQuestoes.mockResolvedValue(5);
      mockHasQuestoesObjetivasInvalidas.mockResolvedValue(false);
      mockPublish.mockResolvedValue(null);

      const service = new ProvaService();
      await expect(
        service.publicar("prova-1", publicarPayload(), professor),
      ).rejects.toThrow("Prova não encontrada.");
    });
  });

  describe("encerrar", () => {
    it("deve encerrar prova publicada", async () => {
      mockFindById.mockResolvedValue(makeProva({ status: "publicada" }));
      mockHasAccess.mockResolvedValue(true);
      mockUpdateStatus.mockResolvedValue(makeProva({ status: "encerrada" }));

      const service = new ProvaService();
      const result = await service.encerrar("prova-1", professor);

      expect(result.status).toBe("encerrada");
      expect(mockUpdateStatus).toHaveBeenCalledWith("prova-1", "encerrada");
    });

    it("deve lançar conflict quando prova não está publicada", async () => {
      mockFindById.mockResolvedValue(makeProva({ status: "rascunho" }));
      mockHasAccess.mockResolvedValue(true);

      const service = new ProvaService();
      await expect(service.encerrar("prova-1", professor)).rejects.toThrow(
        "Apenas provas publicadas podem ser encerradas.",
      );
    });

    it("deve lançar notFound quando updateStatus retorna null", async () => {
      mockFindById.mockResolvedValue(makeProva({ status: "publicada" }));
      mockHasAccess.mockResolvedValue(true);
      mockUpdateStatus.mockResolvedValue(null);

      const service = new ProvaService();
      await expect(service.encerrar("prova-1", professor)).rejects.toThrow(
        "Prova não encontrada.",
      );
    });
  });

  describe("arquivar", () => {
    it("deve arquivar prova encerrada", async () => {
      mockFindById.mockResolvedValue(makeProva({ status: "encerrada" }));
      mockHasAccess.mockResolvedValue(true);
      mockUpdateStatus.mockResolvedValue(makeProva({ status: "antiga" }));

      const service = new ProvaService();
      const result = await service.arquivar("prova-1", professor);

      expect(result.status).toBe("antiga");
      expect(mockUpdateStatus).toHaveBeenCalledWith("prova-1", "antiga");
    });

    it("deve lançar conflict quando prova não está encerrada", async () => {
      mockFindById.mockResolvedValue(makeProva({ status: "publicada" }));
      mockHasAccess.mockResolvedValue(true);

      const service = new ProvaService();
      await expect(service.arquivar("prova-1", professor)).rejects.toThrow(
        "Apenas provas encerradas podem ser arquivadas.",
      );
    });
  });

  describe("remover", () => {
    it("deve remover prova em rascunho sem submissões", async () => {
      mockFindById.mockResolvedValue(makeProva());
      mockHasAccess.mockResolvedValue(true);
      mockHasSubmissions.mockResolvedValue(false);

      const service = new ProvaService();
      await service.remover("prova-1", professor);

      expect(mockDelete).toHaveBeenCalledWith("prova-1");
    });

    it("deve lançar conflict quando prova não está em rascunho", async () => {
      mockFindById.mockResolvedValue(makeProva({ status: "publicada" }));
      mockHasAccess.mockResolvedValue(true);

      const service = new ProvaService();
      await expect(service.remover("prova-1", professor)).rejects.toThrow(
        "Apenas provas em rascunho podem ser removidas.",
      );
    });

    it("deve lançar conflict quando prova tem submissões", async () => {
      mockFindById.mockResolvedValue(makeProva());
      mockHasAccess.mockResolvedValue(true);
      mockHasSubmissions.mockResolvedValue(true);

      const service = new ProvaService();
      await expect(service.remover("prova-1", professor)).rejects.toThrow(
        "Prova com submissões não pode ser removida.",
      );
    });
  });

  describe("listarHistorico", () => {
    it("deve retornar histórico de status", async () => {
      mockFindById.mockResolvedValue(makeProva());
      mockHasAccess.mockResolvedValue(true);
      mockFindStatusHistorico.mockResolvedValue([
        { id: "hist-1", statusAnterior: null, statusNovo: "rascunho", criadoEm: "2025-01-01T00:00:00Z" },
      ]);

      const service = new ProvaService();
      const result = await service.listarHistorico("prova-1", professor);

      expect(result).toHaveLength(1);
      expect(result[0].statusNovo).toBe("rascunho");
    });
  });
});
