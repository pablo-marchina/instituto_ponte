import { afterEach, describe, expect, it, jest } from "@jest/globals";
import {
  BrevoEmailAdapter,
  createEmailAdapter,
  FakeEmailAdapter,
  HttpEmailAdapter,
} from "../../services/email-adapter.js";

describe("EmailAdapter - unitario", () => {
  afterEach(() => {
    delete process.env.EMAIL_FAIL_MODE;
    delete process.env.EMAIL_API_KEY;
    delete process.env.EMAIL_FROM;
    delete process.env.EMAIL_PROVIDER;
    delete process.env.EMAIL_WEBHOOK_URL;
    jest.restoreAllMocks();
  });

  describe("FakeEmailAdapter", () => {
    it("deve retornar success true quando EMAIL_FAIL_MODE nao esta definido", async () => {
      delete process.env.EMAIL_FAIL_MODE;
      const adapter = new FakeEmailAdapter();
      const result = await adapter.send("teste@test.com", "Assunto", "Corpo");
      expect(result).toEqual({ success: true });
    });

    it("deve retornar success false quando EMAIL_FAIL_MODE e always", async () => {
      process.env.EMAIL_FAIL_MODE = "always";
      const adapter = new FakeEmailAdapter();
      const result = await adapter.send("teste@test.com", "Assunto", "Corpo");
      expect(result).toEqual({
        success: false,
        error: "Falha simulada no envio de e-mail.",
      });
    });

    it("deve aceitar strings vazias quando EMAIL_FAIL_MODE nao esta definido", async () => {
      const adapter = new FakeEmailAdapter();
      const result = await adapter.send("", "", "");
      expect(result).toEqual({ success: true });
    });
  });

  describe("HttpEmailAdapter", () => {
    it("deve exigir URL configurada", () => {
      expect(() => new HttpEmailAdapter("")).toThrow("EMAIL_WEBHOOK_URL is required");
    });

    it("deve enviar payload para webhook real configurado", async () => {
      const fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      const adapter = new HttpEmailAdapter("https://email.local/send", "secret");

      await expect(adapter.send("a@b.com", "Assunto", "Corpo")).resolves.toEqual({ success: true });
      expect(fetchMock).toHaveBeenCalledWith("https://email.local/send", expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer secret",
        },
        body: JSON.stringify({ to: "a@b.com", subject: "Assunto", body: "Corpo" }),
        signal: expect.any(AbortSignal),
      }));
    });

    it("deve retornar erro controlado quando provider rejeita", async () => {
      jest.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false,
        status: 503,
      } as Response);

      const adapter = new HttpEmailAdapter("https://email.local/send");

      await expect(adapter.send("a@b.com", "Assunto", "Corpo")).resolves.toEqual({
        success: false,
        error: "Email provider returned 503.",
      });
    });

    it("deve repetir status transitorio antes de confirmar envio", async () => {
      const fetchMock = jest.spyOn(globalThis, "fetch")
        .mockResolvedValueOnce({ ok: false, status: 503 } as Response)
        .mockResolvedValueOnce({ ok: true, status: 200 } as Response);

      const adapter = new HttpEmailAdapter("https://email.local/send", undefined, {
        EMAIL_RETRY_ATTEMPTS: "1",
        EMAIL_RETRY_BACKOFF_MS: "0",
      } as NodeJS.ProcessEnv);

      await expect(adapter.send("a@b.com", "Assunto", "Corpo")).resolves.toEqual({ success: true });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("deve abrir circuit breaker apos falha transitoria de rede", async () => {
      const fetchMock = jest.spyOn(globalThis, "fetch")
        .mockRejectedValue(new Error("fetch failed"));

      const adapter = new HttpEmailAdapter("https://email.local/send", undefined, {
        EMAIL_RETRY_ATTEMPTS: "0",
        EMAIL_CIRCUIT_FAILURE_THRESHOLD: "1",
        EMAIL_CIRCUIT_RESET_MS: "30000",
      } as NodeJS.ProcessEnv);

      await expect(adapter.send("a@b.com", "Assunto", "Corpo")).resolves.toEqual({
        success: false,
        error: "Circuit breaker de email aberto; envio adiado.",
      });
      await expect(adapter.send("a@b.com", "Assunto", "Corpo")).resolves.toEqual({
        success: false,
        error: "Circuit breaker de email aberto; envio adiado.",
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("BrevoEmailAdapter", () => {
    it("deve exigir API key", () => {
      expect(() => new BrevoEmailAdapter("")).toThrow("EMAIL_API_KEY is required");
    });

    it("deve enviar payload no formato da Brevo", async () => {
      const fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        status: 201,
      } as Response);

      const adapter = new BrevoEmailAdapter("xkeysib-secret", "Corrije Ai <noreply@example.com>");

      await expect(adapter.send("a@b.com", "Assunto", "Corpo")).resolves.toEqual({ success: true });
      expect(fetchMock).toHaveBeenCalledWith("https://api.brevo.com/v3/smtp/email", expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": "xkeysib-secret",
        },
        body: JSON.stringify({
          sender: { email: "noreply@example.com", name: "Corrije Ai" },
          to: [{ email: "a@b.com" }],
          subject: "Assunto",
          textContent: "Corpo",
        }),
        signal: expect.any(AbortSignal),
      }));
    });

    it("deve retornar mensagem da Brevo quando provider rejeita", async () => {
      jest.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: "Key not found" }),
      } as Response);

      const adapter = new BrevoEmailAdapter("xkeysib-secret", "Corrije Ai <noreply@example.com>");

      await expect(adapter.send("a@b.com", "Assunto", "Corpo")).resolves.toEqual({
        success: false,
        error: "Brevo returned 401: Key not found",
      });
    });
  });

  describe("createEmailAdapter", () => {
    it("deve usar fake em runtime de teste ou fake explicito", () => {
      expect(createEmailAdapter({ NODE_ENV: "test" } as NodeJS.ProcessEnv)).toBeInstanceOf(FakeEmailAdapter);
      expect(createEmailAdapter({ EMAIL_ADAPTER: "fake" } as NodeJS.ProcessEnv)).toBeInstanceOf(FakeEmailAdapter);
      expect(createEmailAdapter({ EMAIL_FAKE: "true" } as NodeJS.ProcessEnv)).toBeInstanceOf(FakeEmailAdapter);
      expect(createEmailAdapter({ AUTH_MODE: "test" } as NodeJS.ProcessEnv)).toBeInstanceOf(FakeEmailAdapter);
    });

    it("deve usar adapter HTTP quando webhook estiver configurado", () => {
      expect(
        createEmailAdapter({
          EMAIL_WEBHOOK_URL: "https://email.local/send",
          EMAIL_API_KEY: "secret",
        } as NodeJS.ProcessEnv),
      ).toBeInstanceOf(HttpEmailAdapter);
    });

    it("deve usar Brevo quando provider for brevo", () => {
      expect(
        createEmailAdapter({
          EMAIL_PROVIDER: "brevo",
          EMAIL_API_KEY: "xkeysib-secret",
          EMAIL_FROM: "Corrije Ai <noreply@example.com>",
        } as NodeJS.ProcessEnv),
      ).toBeInstanceOf(BrevoEmailAdapter);
      expect(
        createEmailAdapter({
          EMAIL_ADAPTER: "brevo",
          EMAIL_API_KEY: "xkeysib-secret",
          EMAIL_FROM: "Corrije Ai <noreply@example.com>",
        } as NodeJS.ProcessEnv),
      ).toBeInstanceOf(BrevoEmailAdapter);
    });

    it("deve falhar claramente sem adapter configurado", () => {
      expect(() => createEmailAdapter({} as NodeJS.ProcessEnv)).toThrow(
        "Configure EMAIL_WEBHOOK_URL or set EMAIL_ADAPTER=fake",
      );
    });
  });
});
