import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import type { FastifyRequest, FastifyReply } from "fastify";

const mockGetGoogleRedirectUrl = jest.fn<any>();
const mockHandleGoogleCallback = jest.fn<any>();
const mockGetCurrentUser = jest.fn<any>();
const mockLogout = jest.fn<any>();

jest.unstable_mockModule("../../services/auth.service.js", () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    getGoogleRedirectUrl: mockGetGoogleRedirectUrl,
    handleGoogleCallback: mockHandleGoogleCallback,
    getCurrentUser: mockGetCurrentUser,
    logout: mockLogout,
  })),
}));

jest.unstable_mockModule("../../helpers/http.js", () => ({
  getAuthenticatedUser: jest.fn().mockReturnValue({ id: "user-1", perfil: "professor" }),
  sendSuccess: jest.fn().mockImplementation((_reply, data) => ({ success: true, data })),
}));

type AuthControllerModule = typeof import("../../controllers/auth.controller.js");
let AuthController: AuthControllerModule["AuthController"];

beforeEach(async () => {
  jest.resetModules();
  mockGetGoogleRedirectUrl.mockReset();
  mockHandleGoogleCallback.mockReset();
  mockGetCurrentUser.mockReset();
  mockLogout.mockReset();
  const mod = await import("../../controllers/auth.controller.js");
  AuthController = mod.AuthController;
});

const makeReq = (): FastifyRequest => ({}) as unknown as FastifyRequest;
const makeReply = (): FastifyReply => ({}) as unknown as FastifyReply;

describe("AuthController", () => {
  it("googleStart deve retornar redirectUrl", async () => {
    mockGetGoogleRedirectUrl.mockReturnValue("https://accounts.google.com/o/oauth2/auth");
    const ctrl = new AuthController();
    const result = await ctrl.googleStart(makeReq(), makeReply());
    expect(result).toEqual({ success: true, data: { redirectUrl: "https://accounts.google.com/o/oauth2/auth" } });
  });

  it("googleCallback deve processar o código", async () => {
    mockHandleGoogleCallback.mockResolvedValue({ token: "jwt-token" });
    const ctrl = new AuthController();
    const req = { query: { code: "auth-code" } } as unknown as FastifyRequest;
    const result = await ctrl.googleCallback(req, makeReply());
    expect(result).toEqual({ success: true, data: { token: "jwt-token" } });
  });

  it("me deve retornar usuário atual", async () => {
    mockGetCurrentUser.mockReturnValue({ id: "user-1", nome: "Teste", email: "test@test.com", perfil: "professor" });
    const ctrl = new AuthController();
    const result = await ctrl.me(makeReq(), makeReply());
    expect(result).toEqual({ success: true, data: { id: "user-1", nome: "Teste", email: "test@test.com", perfil: "professor" } });
  });

  it("logout deve retornar sucesso", async () => {
    mockLogout.mockReturnValue({ message: "Logout realizado." });
    const ctrl = new AuthController();
    const result = await ctrl.logout(makeReq(), makeReply());
    expect(result).toEqual({ success: true, data: { message: "Logout realizado." } });
  });
});
