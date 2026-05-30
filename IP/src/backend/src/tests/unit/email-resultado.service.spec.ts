import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import type { AuthUser } from "../../middlewares/auth.js";

const mockFindProvaExists = jest.fn<any>();
const mockHasAccessToProva = jest.fn<any>();
const mockCountPendenciasCorrecaoPorProva = jest.fn<any>();
const mockFindAlunosComResultado = jest.fn<any>();
const mockCreateEnvio = jest.fn<any>();
const mockMarkAsSent = jest.fn<any>();
const mockMarkAsError = jest.fn<any>();
const mockFindEnviosByProva = jest.fn<any>();
const mockFindById = jest.fn<any>();

const mockSend = jest.fn<any>();

jest.unstable_mockModule("../../repositories/email-envio.repository.js", () => ({
  EmailEnvioRepository: jest.fn().mockImplementation(() => ({
    findProvaExists: mockFindProvaExists,
    hasAccessToProva: mockHasAccessToProva,
    countPendenciasCorrecaoPorProva: mockCountPendenciasCorrecaoPorProva,
    findAlunosComResultado: mockFindAlunosComResultado,
    createEnvio: mockCreateEnvio,
    markAsSent: mockMarkAsSent,
    markAsError: mockMarkAsError,
    findEnviosByProva: mockFindEnviosByProva,
    findById: mockFindById,
  })),
}));

jest.unstable_mockModule("../../services/email-adapter.js", () => ({
  EmailAdapter: jest.fn(),
  FakeEmailAdapter: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
}));

type ServiceModule = typeof import("../../services/email-resultado.service.js");
let EmailResultadoService: ServiceModule["EmailResultadoService"];

const professor: AuthUser = {
  id: "prof-1",
  nome: "Professor",
  email: "prof@test.com",
  perfil: "professor",
};

beforeEach(async () => {
  jest.resetModules();
  mockFindProvaExists.mockReset();
  mockHasAccessToProva.mockReset();
  mockCountPendenciasCorrecaoPorProva.mockReset();
  mockFindAlunosComResultado.mockReset();
  mockCreateEnvio.mockReset();
  mockMarkAsSent.mockReset();
  mockMarkAsError.mockReset();
  mockFindEnviosByProva.mockReset();
  mockFindById.mockReset();
  mockSend.mockReset();
  const mod = await import("../../services/email-resultado.service.js");
  EmailResultadoService = mod.EmailResultadoService;
});

const makeAluno = (overrides: Record<string, unknown> = {}) => ({
  prova_aluno_id: "pa-1",
  aluno_nome: "Aluno",
  aluno_email: "aluno@test.com",
  ...overrides,
});

describe("EmailResultadoService - unitário", () => {
  describe("liberar", () => {
    it("deve enviar e-mails com sucesso", async () => {
      mockFindProvaExists.mockResolvedValue(true);
      mockHasAccessToProva.mockResolvedValue(true);
      mockCountPendenciasCorrecaoPorProva.mockResolvedValue(0);
      mockFindAlunosComResultado.mockResolvedValue([makeAluno()]);
      mockCreateEnvio.mockResolvedValue("envio-1");
      mockSend.mockResolvedValue({ success: true });

      const service = new EmailResultadoService();
      const result = await service.liberar("prova-1", { confirmarPendencias: false }, professor);

      expect(result.enviados).toBe(1);
      expect(result.falhas).toBe(0);
    });

    it("deve lançar notFound quando prova não existe", async () => {
      mockFindProvaExists.mockResolvedValue(false);

      const service = new EmailResultadoService();
      await expect(
        service.liberar("inexistente", { confirmarPendencias: false }, professor),
      ).rejects.toThrow("Prova não encontrada.");
    });

    it("deve lançar forbidden quando sem acesso", async () => {
      mockFindProvaExists.mockResolvedValue(true);
      mockHasAccessToProva.mockResolvedValue(false);

      const service = new EmailResultadoService();
      await expect(
        service.liberar("prova-1", { confirmarPendencias: false }, professor),
      ).rejects.toThrow("Usuário sem permissão para liberar e-mails desta prova.");
    });

    it("deve lançar conflict quando há pendências sem confirmação", async () => {
      mockFindProvaExists.mockResolvedValue(true);
      mockHasAccessToProva.mockResolvedValue(true);
      mockCountPendenciasCorrecaoPorProva.mockResolvedValue(3);

      const service = new EmailResultadoService();
      await expect(
        service.liberar("prova-1", { confirmarPendencias: false }, professor),
      ).rejects.toThrow("Existem 3 pendência(s) de correção.");
    });

    it("deve permitir liberar mesmo com pendências quando confirmado", async () => {
      mockFindProvaExists.mockResolvedValue(true);
      mockHasAccessToProva.mockResolvedValue(true);
      mockCountPendenciasCorrecaoPorProva.mockResolvedValue(3);
      mockFindAlunosComResultado.mockResolvedValue([]);

      const service = new EmailResultadoService();
      const result = await service.liberar("prova-1", { confirmarPendencias: true }, professor);

      expect(result.pendentes).toBe(3);
    });

    it("deve incrementar falhas quando envio falha", async () => {
      mockFindProvaExists.mockResolvedValue(true);
      mockHasAccessToProva.mockResolvedValue(true);
      mockCountPendenciasCorrecaoPorProva.mockResolvedValue(0);
      mockFindAlunosComResultado.mockResolvedValue([makeAluno()]);
      mockCreateEnvio.mockResolvedValue("envio-1");
      mockSend.mockResolvedValue({ success: false, error: "SMTP error" });

      const service = new EmailResultadoService();
      const result = await service.liberar("prova-1", { confirmarPendencias: false }, professor);

      expect(result.enviados).toBe(0);
      expect(result.falhas).toBe(1);
      expect(mockMarkAsError).toHaveBeenCalledWith("envio-1", "SMTP error");
    });

    it("deve incrementar falhas quando send lança exceção", async () => {
      mockFindProvaExists.mockResolvedValue(true);
      mockHasAccessToProva.mockResolvedValue(true);
      mockCountPendenciasCorrecaoPorProva.mockResolvedValue(0);
      mockFindAlunosComResultado.mockResolvedValue([makeAluno()]);
      mockCreateEnvio.mockResolvedValue("envio-1");
      mockSend.mockRejectedValue(new Error("Connection refused"));

      const service = new EmailResultadoService();
      const result = await service.liberar("prova-1", { confirmarPendencias: false }, professor);

      expect(result.falhas).toBe(1);
      expect(mockMarkAsError).toHaveBeenCalledWith("envio-1", "Connection refused");
    });
  });

  describe("listarEnvios", () => {
    it("deve listar envios quando prova existe e tem acesso", async () => {
      mockFindProvaExists.mockResolvedValue(true);
      mockHasAccessToProva.mockResolvedValue(true);
      mockFindEnviosByProva.mockResolvedValue([{ id: "envio-1" }]);

      const service = new EmailResultadoService();
      const result = await service.listarEnvios("prova-1", professor);

      expect(result).toHaveLength(1);
    });

    it("deve lançar notFound quando prova não existe", async () => {
      mockFindProvaExists.mockResolvedValue(false);

      const service = new EmailResultadoService();
      await expect(service.listarEnvios("inexistente", professor)).rejects.toThrow(
        "Prova não encontrada.",
      );
    });

    it("deve lançar forbidden quando sem acesso", async () => {
      mockFindProvaExists.mockResolvedValue(true);
      mockHasAccessToProva.mockResolvedValue(false);

      const service = new EmailResultadoService();
      await expect(service.listarEnvios("prova-1", professor)).rejects.toThrow(
        "Usuário sem permissão para acessar e-mails desta prova.",
      );
    });
  });

  describe("reenviar", () => {
    const envioErro = {
      id: "envio-1",
      provaAlunoId: "pa-1",
      destinatario: "aluno@test.com",
      assunto: "Resultado",
      corpo: "Seu resultado...",
      status: "erro",
      criadoEm: "2025-01-01T00:00:00Z",
    };

    it("deve reenviar e-mail com sucesso", async () => {
      mockFindById
        .mockResolvedValueOnce(envioErro)
        .mockResolvedValueOnce({ ...envioErro, status: "enviado" });
      mockHasAccessToProva.mockResolvedValue(true);
      mockSend.mockResolvedValue({ success: true });

      const service = new EmailResultadoService();
      const result = await service.reenviar("envio-1", professor);

      expect(result.status).toBe("enviado");
    });

    it("deve lançar notFound quando envio não existe", async () => {
      mockFindById.mockResolvedValue(null);

      const service = new EmailResultadoService();
      await expect(service.reenviar("inexistente", professor)).rejects.toThrow(
        "Envio de e-mail não encontrado.",
      );
    });

    it("deve lançar conflict quando envio não está em erro", async () => {
      mockFindById.mockResolvedValue({ ...envioErro, status: "enviado" });

      const service = new EmailResultadoService();
      await expect(service.reenviar("envio-1", professor)).rejects.toThrow(
        "Apenas envios com status 'erro' podem ser reenviados.",
      );
    });

    it("deve lançar forbidden quando sem acesso à prova", async () => {
      mockFindById.mockResolvedValue(envioErro);
      mockHasAccessToProva.mockResolvedValue(false);

      const service = new EmailResultadoService();
      await expect(service.reenviar("envio-1", professor)).rejects.toThrow(
        "Usuário sem permissão para reenviar e-mail.",
      );
    });

    it("deve atualizar para erro quando reenvio falha", async () => {
      mockFindById
        .mockResolvedValueOnce(envioErro)
        .mockResolvedValueOnce({ ...envioErro, status: "erro" });
      mockHasAccessToProva.mockResolvedValue(true);
      mockSend.mockResolvedValue({ success: false, error: "SMTP error" });

      const service = new EmailResultadoService();
      const result = await service.reenviar("envio-1", professor);

      expect(result.status).toBe("erro");
    });
  });
});
