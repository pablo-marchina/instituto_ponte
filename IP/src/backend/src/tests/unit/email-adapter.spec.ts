import { describe, expect, it, jest } from "@jest/globals";
import { FakeEmailAdapter } from "../../services/email-adapter.js";

describe("EmailAdapter - unitário", () => {
describe("FakeEmailAdapter", () => {
  it("deve retornar success true quando EMAIL_FAIL_MODE não está definido", async () => {
    delete process.env.EMAIL_FAIL_MODE;
    const adapter = new FakeEmailAdapter();
    const result = await adapter.send("teste@test.com", "Assunto", "Corpo");
    expect(result).toEqual({ success: true });
  });

  it("deve retornar success false quando EMAIL_FAIL_MODE é always", async () => {
    process.env.EMAIL_FAIL_MODE = "always";
    const adapter = new FakeEmailAdapter();
    const result = await adapter.send("teste@test.com", "Assunto", "Corpo");
    expect(result).toEqual({
      success: false,
      error: "Falha simulada no envio de e-mail.",
    });
    delete process.env.EMAIL_FAIL_MODE;
  });

  it("deve aceitar qualquer combinação de parâmetros (strings vazias) quando EMAIL_FAIL_MODE não está definido", async () => {
    const adapter = new FakeEmailAdapter();
    const result = await adapter.send("", "", "");
    expect(result).toEqual({ success: true });
  });
});
});
