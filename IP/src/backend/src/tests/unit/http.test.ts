import { describe, expect, it, jest } from "@jest/globals";
import { getAuthenticatedUser, sendCreated, sendSuccess } from "../../helpers/http.js";

describe("helpers/http", () => {
  it("retorna usuario autenticado da requisicao", () => {
    const user = { id: "user-1", nome: "User", email: "user@test.com", perfil: "professor" };

    expect(getAuthenticatedUser({ user } as any)).toBe(user);
  });

  it("lanca 401 quando requisicao nao possui usuario", () => {
    expect(() => getAuthenticatedUser({} as any)).toThrow("Usuário não autenticado.");
  });

  it("envia resposta de sucesso com e sem meta", () => {
    const reply = { send: jest.fn((body: unknown) => body) };

    expect(sendSuccess(reply as any, { ok: true })).toEqual({
      success: true,
      data: { ok: true },
    });
    expect(sendSuccess(reply as any, { ok: true }, { total: 1 })).toEqual({
      success: true,
      data: { ok: true },
      meta: { total: 1 },
    });
  });

  it("envia resposta criada com status 201", () => {
    const send = jest.fn((body: unknown) => body);
    const status = jest.fn<any>(() => ({ send }));
    const reply = { status };

    expect(sendCreated(reply as any, { id: "1" })).toEqual({
      success: true,
      data: { id: "1" },
    });
    expect(status).toHaveBeenCalledWith(201);
  });
});
