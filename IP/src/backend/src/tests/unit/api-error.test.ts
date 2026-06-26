import { describe, expect, it } from "@jest/globals";
import { ApiError, businessRule, conflict, forbidden, notFound, unauthorized } from "../../errors/api-error.js";

describe("api-error helpers", () => {
  it("cria erros HTTP com codigos e mensagens padrao", () => {
    expect(unauthorized()).toMatchObject({ statusCode: 401, code: "UNAUTHORIZED" });
    expect(forbidden()).toMatchObject({ statusCode: 403, code: "FORBIDDEN" });
    expect(notFound()).toMatchObject({ statusCode: 404, code: "NOT_FOUND" });
  });

  it("cria erros HTTP com mensagens e detalhes explicitos", () => {
    const custom = new ApiError(400, "VALIDATION_ERROR", "payload invalido", [{ field: "nome" }]);

    expect(custom.name).toBe("ApiError");
    expect(custom.details).toEqual([{ field: "nome" }]);
    expect(conflict("duplicado")).toMatchObject({ statusCode: 409, code: "CONFLICT", message: "duplicado" });
    expect(businessRule("regra")).toMatchObject({ statusCode: 422, code: "BUSINESS_RULE_ERROR", message: "regra" });
  });
});
