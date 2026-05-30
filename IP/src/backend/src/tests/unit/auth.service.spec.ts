import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { AuthService } from "../../services/auth.service.js";
import type { AuthRepository } from "../../repositories/auth.repository.js";
import type { AuthUser } from "../../middlewares/auth.js";

describe("AuthService - unitário", () => {
  const makeMockRepo = () =>
    ({ findUserByEmail: jest.fn() }) as unknown as jest.Mocked<AuthRepository>;

  const usuarioProfessor: AuthUser = {
    id: "prof-1",
    nome: "Professor Teste",
    email: "prof@test.com",
    perfil: "professor",
  };

  const usuarioCoordenador: AuthUser = {
    id: "coord-1",
    nome: "Coordenador Teste",
    email: "coord@test.com",
    perfil: "coordenador",
  };

  describe("getGoogleRedirectUrl", () => {
    it("deve gerar URL com client id padrão quando não configurado", () => {
      delete process.env.GOOGLE_CLIENT_ID;
      const service = new AuthService(makeMockRepo());
      const url = service.getGoogleRedirectUrl();
      expect(url).toContain("client_id=local-client-id");
      expect(url).toContain("https://accounts.google.com/o/oauth2/v2/auth");
    });

    it("deve usar GOOGLE_CLIENT_ID quando configurado", () => {
      process.env.GOOGLE_CLIENT_ID = "meu-client-id";
      const service = new AuthService(makeMockRepo());
      const url = service.getGoogleRedirectUrl();
      expect(url).toContain("client_id=meu-client-id");
    });

    it("deve usar redirectUri padrão quando não configurado", () => {
      delete process.env.GOOGLE_CLIENT_ID;
      const service = new AuthService(makeMockRepo());
      const url = service.getGoogleRedirectUrl();
      expect(url).toContain("redirect_uri=http%3A%2F%2Flocalhost%3A3333%2Fapi%2Fv1%2Fauth%2Fgoogle%2Fcallback");
    });

    it("deve incluir escopos openid email profile", () => {
      const service = new AuthService(makeMockRepo());
      const url = service.getGoogleRedirectUrl();
      expect(url).toContain("scope=openid+email+profile");
    });
  });

  describe("handleGoogleCallback", () => {
    it("deve lançar businessRule quando code é undefined", async () => {
      const service = new AuthService(makeMockRepo());
      await expect(service.handleGoogleCallback()).rejects.toThrow(
        "Callback OAuth sem code.",
      );
    });

    it("deve lançar forbidden quando não está em modo de teste", async () => {
      const origNodeEnv = process.env.NODE_ENV;
      const origAuthMode = process.env.AUTH_MODE;
      process.env.NODE_ENV = "production";
      process.env.AUTH_MODE = undefined;

      const service = new AuthService(makeMockRepo());
      await expect(service.handleGoogleCallback("some-code")).rejects.toThrow(
        "Fluxo OAuth local não disponível em produção",
      );

      process.env.NODE_ENV = origNodeEnv;
      process.env.AUTH_MODE = origAuthMode;
    });

    it("deve lançar forbidden quando code não tem @ e MOCK_GOOGLE_EMAIL ausente", async () => {
      const origNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "test";
      const origMockEmail = process.env.MOCK_GOOGLE_EMAIL;
      delete process.env.MOCK_GOOGLE_EMAIL;

      const service = new AuthService(makeMockRepo());
      await expect(service.handleGoogleCallback("code-sem-arroba")).rejects.toThrow(
        "Código OAuth não pode ser validado no ambiente local.",
      );

      process.env.NODE_ENV = origNodeEnv;
      process.env.MOCK_GOOGLE_EMAIL = origMockEmail;
    });

    it("deve usar MOCK_GOOGLE_EMAIL quando code não tem @", async () => {
      const origNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "test";
      const origMockEmail = process.env.MOCK_GOOGLE_EMAIL;
      process.env.MOCK_GOOGLE_EMAIL = "mock@test.com";

      const mockRepo = makeMockRepo();
      mockRepo.findUserByEmail.mockResolvedValue(usuarioProfessor);

      const service = new AuthService(mockRepo);
      const result = await service.handleGoogleCallback("code-sem-arroba");

      expect(mockRepo.findUserByEmail).toHaveBeenCalledWith("mock@test.com");
      expect(result.accessToken).toContain("test-professor");

      process.env.NODE_ENV = origNodeEnv;
      process.env.MOCK_GOOGLE_EMAIL = origMockEmail;
    });

    it("deve lançar forbidden quando email não encontrado no banco", async () => {
      const origNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "test";

      const mockRepo = makeMockRepo();
      mockRepo.findUserByEmail.mockResolvedValue(null);

      const service = new AuthService(mockRepo);
      await expect(
        service.handleGoogleCallback("email@test.com"),
      ).rejects.toThrow("E-mail não autorizado.");

      process.env.NODE_ENV = origNodeEnv;
    });

    it("deve retornar token e redirect para professor quando perfil é professor", async () => {
      const origNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "test";

      const mockRepo = makeMockRepo();
      mockRepo.findUserByEmail.mockResolvedValue(usuarioProfessor);

      const service = new AuthService(mockRepo);
      const result = await service.handleGoogleCallback("prof@test.com");

      expect(result.accessToken).toBe("test-professor:prof-1:prof@test.com:Professor Teste");
      expect(result.usuario).toEqual(usuarioProfessor);
      expect(result.redirectTo).toBe("/professor");

      process.env.NODE_ENV = origNodeEnv;
    });

    it("deve retornar redirect para coordenador quando perfil é coordenador", async () => {
      const origNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "test";

      const mockRepo = makeMockRepo();
      mockRepo.findUserByEmail.mockResolvedValue(usuarioCoordenador);

      const service = new AuthService(mockRepo);
      const result = await service.handleGoogleCallback("coord@test.com");

      expect(result.redirectTo).toBe("/coordenador");

      process.env.NODE_ENV = origNodeEnv;
    });
  });

  describe("getCurrentUser", () => {
    it("deve retornar o usuário recebido", () => {
      const service = new AuthService(makeMockRepo());
      expect(service.getCurrentUser(usuarioProfessor)).toBe(usuarioProfessor);
    });
  });

  describe("logout", () => {
    it("deve retornar mensagem de sucesso", () => {
      const service = new AuthService(makeMockRepo());
      expect(service.logout()).toEqual({
        message: "Sessão encerrada com sucesso.",
      });
    });
  });
});
