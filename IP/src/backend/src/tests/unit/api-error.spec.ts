import { describe, expect, it } from "@jest/globals";
import { ApiError, unauthorized, forbidden, notFound, conflict, businessRule } from "../../errors/api-error.js";

describe("api-error", () => {
  it("ApiError deve criar instância básica", () => {
    const err = new ApiError(400, "VALIDATION_ERROR", "erro");
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("ApiError");
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.message).toBe("erro");
    expect(err.details).toEqual([]);
  });

  it("ApiError deve aceitar details opcionais", () => {
    const err = new ApiError(409, "CONFLICT", "conflito", [{ campo: "id" }]);
    expect(err.details).toEqual([{ campo: "id" }]);
  });

  it("unauthorized sem argumento usa mensagem padrão", () => {
    const err = unauthorized();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("UNAUTHORIZED");
    expect(err.message).toBe("Usuário não autenticado.");
  });

  it("unauthorized com mensagem customizada", () => {
    const err = unauthorized("Token inválido.");
    expect(err.message).toBe("Token inválido.");
  });

  it("forbidden sem argumento usa mensagem padrão", () => {
    const err = forbidden();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe("FORBIDDEN");
    expect(err.message).toBe("Usuário sem permissão para esta ação.");
  });

  it("notFound sem argumento usa mensagem padrão", () => {
    const err = notFound();
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.message).toBe("Recurso não encontrado.");
  });

  it("notFound com mensagem customizada", () => {
    const err = notFound("Prova não encontrada.");
    expect(err.message).toBe("Prova não encontrada.");
  });

  it("conflict deve criar erro com status 409", () => {
    const err = conflict("Registro duplicado.");
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe("CONFLICT");
    expect(err.message).toBe("Registro duplicado.");
  });

  it("businessRule deve criar erro com status 422", () => {
    const err = businessRule("Regra violada.");
    expect(err.statusCode).toBe(422);
    expect(err.code).toBe("BUSINESS_RULE_ERROR");
    expect(err.message).toBe("Regra violada.");
  });
});
