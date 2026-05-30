import { describe, expect, it, jest } from "@jest/globals";
import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuthenticatedUser, sendSuccess, sendCreated } from "../../helpers/http.js";

describe("http helpers", () => {
  describe("getAuthenticatedUser", () => {
    it("deve retornar user quando request.user existe", () => {
      const user = { id: "1", nome: "Teste", email: "test@test.com", perfil: "professor" as const };
      const req = { user } as unknown as FastifyRequest;
      expect(getAuthenticatedUser(req)).toBe(user);
    });

    it("deve lançar unauthorized quando request.user é undefined", () => {
      const req = {} as unknown as FastifyRequest;
      expect(() => getAuthenticatedUser(req)).toThrow("Usuário não autenticado.");
    });
  });

  describe("sendSuccess", () => {
    it("deve enviar resposta com sucesso", () => {
      const reply = { send: jest.fn() } as unknown as FastifyReply;
      sendSuccess(reply, { chave: "valor" });
      expect(reply.send).toHaveBeenCalledWith({
        success: true,
        data: { chave: "valor" },
      });
    });

    it("deve incluir meta quando fornecida", () => {
      const reply = { send: jest.fn() } as unknown as FastifyReply;
      sendSuccess(reply, [], { total: 10 });
      expect(reply.send).toHaveBeenCalledWith({
        success: true,
        data: [],
        meta: { total: 10 },
      });
    });
  });

  describe("sendCreated", () => {
    it("deve enviar resposta 201", () => {
      let statusCode = 200;
      const reply = {
        status: (code: number) => {
          statusCode = code;
          return reply;
        },
        send: jest.fn(),
      } as unknown as FastifyReply;
      sendCreated(reply, { id: "novo-id" });
      expect(statusCode).toBe(201);
      expect(reply.send).toHaveBeenCalledWith({
        success: true,
        data: { id: "novo-id" },
      });
    });
  });
});
