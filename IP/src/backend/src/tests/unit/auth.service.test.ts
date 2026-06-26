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
    it("deve gerar URL com client id local em modo de teste quando não configurado", () => {
      delete process.env.GOOGLE_CLIENT_ID;
      const service = new AuthService(makeMockRepo());
      const url = service.getGoogleRedirectUrl();
      expect(url).toContain("client_id=local-client-id");
      expect(url).toContain("https://accounts.google.com/o/oauth2/v2/auth");
    });

    it("deve exigir GOOGLE_CLIENT_ID fora do modo de teste", () => {
      const origNodeEnv = process.env.NODE_ENV;
      const origAuthMode = process.env.AUTH_MODE;
      const origClientId = process.env.GOOGLE_CLIENT_ID;
      process.env.NODE_ENV = "production";
      delete process.env.AUTH_MODE;
      delete process.env.GOOGLE_CLIENT_ID;

      const service = new AuthService(makeMockRepo());
      expect(() => service.getGoogleRedirectUrl()).toThrow("GOOGLE_CLIENT_ID não configurado.");

      process.env.NODE_ENV = origNodeEnv;
      process.env.AUTH_MODE = origAuthMode;
      process.env.GOOGLE_CLIENT_ID = origClientId;
    });

    it("deve usar GOOGLE_CLIENT_ID quando configurado", () => {
      process.env.GOOGLE_CLIENT_ID = "meu-client-id";
      const service = new AuthService(makeMockRepo());
      const url = service.getGoogleRedirectUrl();
      expect(url).toContain("client_id=meu-client-id");
    });

    it("deve usar redirectUri padrão quando não configurado", () => {
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_REDIRECT_URI;
      const service = new AuthService(makeMockRepo());
      const url = service.getGoogleRedirectUrl();
      expect(url).toContain("redirect_uri=http%3A%2F%2Flocalhost%3A5173%2Fauth%2Fcallback");
    });

    it("deve incluir escopos openid email profile", () => {
      const service = new AuthService(makeMockRepo());
      const url = service.getGoogleRedirectUrl();
      expect(url).toContain("scope=openid+email+profile");
    });

    it("deve incluir perfil escolhido no state quando informado", () => {
      const service = new AuthService(makeMockRepo());
      const url = service.getGoogleRedirectUrl("coordenador");
      expect(url).toContain("state=coordenador");
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
        "O login Google deve ser feito no frontend com Supabase JS.",
      );

      process.env.NODE_ENV = origNodeEnv;
      process.env.AUTH_MODE = origAuthMode;
    });

    it("deve lançar forbidden quando code de teste não é email", async () => {
      const origNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "test";

      const service = new AuthService(makeMockRepo());
      await expect(service.handleGoogleCallback("code-sem-arroba")).rejects.toThrow(
        "Código OAuth não pode ser validado no ambiente local.",
      );

      process.env.NODE_ENV = origNodeEnv;
    });

    it("deve usar email direto em modo de teste", async () => {
      const origNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "test";

      const mockRepo = makeMockRepo();
      mockRepo.findUserByEmail.mockResolvedValue(usuarioProfessor);

      const service = new AuthService(mockRepo);
      const result = await service.handleGoogleCallback("mock@test.com");

      expect(mockRepo.findUserByEmail).toHaveBeenCalledWith("mock@test.com", undefined);
      expect(result.accessToken).toContain("test-professor");

      process.env.NODE_ENV = origNodeEnv;
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

    it("deve usar state como perfil preferido na busca do usuário", async () => {
      const origNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "test";

      const mockRepo = makeMockRepo();
      mockRepo.findUserByEmail.mockResolvedValue(usuarioCoordenador);

      const service = new AuthService(mockRepo);
      await service.handleGoogleCallback("coord@test.com", "coordenador");

      expect(mockRepo.findUserByEmail).toHaveBeenCalledWith("coord@test.com", "coordenador");

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
