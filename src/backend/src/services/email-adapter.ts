/** Contrato para envio de emails. Pode ser substituído por um adaptador real (ex.: Resend, SendGrid). */
import dotenv from "dotenv";
import { CircuitBreaker, numberFromEnv, resilientFetch } from "../helpers/resilience.js";

dotenv.config();

export interface EmailAdapter {
  send(para: string, assunto: string, corpo: string): Promise<{ success: boolean; error?: string }>;
}

/**
 * Implementação falsa que nunca envia email de verdade.
 *
 * Útil em desenvolvimento/teste. Em modo de teste, é possível
 * simular falha configurando EMAIL_FAIL_MODE=always.
 */
export class FakeEmailAdapter implements EmailAdapter {
  async send(para: string, assunto: string, corpo: string) {
    if (process.env.EMAIL_FAIL_MODE === "always") {
      return { success: false, error: "Falha simulada no envio de e-mail." };
    }
    if (process.env.NODE_ENV !== "test" && process.env.AUTH_MODE !== "test") {
      return {
        success: false,
        error: "Envio real de email nao configurado. Configure EMAIL_WEBHOOK_URL para entregar mensagens aos alunos.",
      };
    }
    return { success: true };
  }
}

export class HttpEmailAdapter implements EmailAdapter {
  private readonly breaker: CircuitBreaker;

  constructor(
    private readonly url = process.env.EMAIL_WEBHOOK_URL,
    private readonly apiKey = process.env.EMAIL_API_KEY,
    private readonly environment = process.env,
  ) {
    if (!url) {
      throw new Error("EMAIL_WEBHOOK_URL is required for real email delivery.");
    }
    this.breaker = new CircuitBreaker({
      failureThreshold: numberFromEnv(environment, "EMAIL_CIRCUIT_FAILURE_THRESHOLD", 3),
      resetTimeoutMs: numberFromEnv(environment, "EMAIL_CIRCUIT_RESET_MS", 30_000),
    });
  }

  async send(para: string, assunto: string, corpo: string) {
    const response = await this.breaker.execute(
      () => resilientFetch(this.url!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({ to: para, subject: assunto, body: corpo }),
      }, {
        timeoutMs: numberFromEnv(this.environment, "EMAIL_TIMEOUT_MS", 5_000),
        retries: numberFromEnv(this.environment, "EMAIL_RETRY_ATTEMPTS", 2),
        backoffMs: numberFromEnv(this.environment, "EMAIL_RETRY_BACKOFF_MS", 100),
      }),
      () => undefined,
    );

    if (!response) {
      return { success: false, error: "Circuit breaker de email aberto; envio adiado." };
    }

    if (!response.ok) {
      return { success: false, error: `Email provider returned ${response.status}.` };
    }

    return { success: true };
  }
}

const parseSender = (value: string) => {
  const match = value.match(/^(.*?)\s*<([^>]+)>$/);
  if (!match) {
    return { email: value.trim(), name: undefined };
  }

  const name = match[1].trim();
  return {
    email: match[2].trim(),
    name: name || undefined,
  };
};

export class BrevoEmailAdapter implements EmailAdapter {
  private readonly breaker: CircuitBreaker;

  constructor(
    private readonly apiKey = process.env.EMAIL_API_KEY,
    private readonly from = process.env.EMAIL_FROM ?? "Corrije Ai <noreply@example.com>",
    private readonly url = process.env.EMAIL_WEBHOOK_URL ?? "https://api.brevo.com/v3/smtp/email",
    private readonly environment = process.env,
  ) {
    if (!apiKey) {
      throw new Error("EMAIL_API_KEY is required for Brevo email delivery.");
    }
    this.breaker = new CircuitBreaker({
      failureThreshold: numberFromEnv(environment, "EMAIL_CIRCUIT_FAILURE_THRESHOLD", 3),
      resetTimeoutMs: numberFromEnv(environment, "EMAIL_CIRCUIT_RESET_MS", 30_000),
    });
  }

  async send(para: string, assunto: string, corpo: string) {
    const apiKey = this.apiKey!;
    const sender = parseSender(this.from);
    const response = await this.breaker.execute(
      () => resilientFetch(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
        body: JSON.stringify({
          sender,
          to: [{ email: para }],
          subject: assunto,
          textContent: corpo,
        }),
      }, {
        timeoutMs: numberFromEnv(this.environment, "EMAIL_TIMEOUT_MS", 5_000),
        retries: numberFromEnv(this.environment, "EMAIL_RETRY_ATTEMPTS", 2),
        backoffMs: numberFromEnv(this.environment, "EMAIL_RETRY_BACKOFF_MS", 100),
      }),
      () => undefined,
    );

    if (!response) {
      return { success: false, error: "Circuit breaker de email aberto; envio adiado." };
    }

    if (!response.ok) {
      let details = "";
      try {
        const body = await response.json() as { message?: string; error?: string; code?: string };
        details = body.message ?? body.error ?? body.code ?? "";
      } catch {
        details = "";
      }
      return {
        success: false,
        error: details ? `Brevo returned ${response.status}: ${details}` : `Brevo returned ${response.status}.`,
      };
    }

    return { success: true };
  }
}

export const createEmailAdapter = (environment = process.env): EmailAdapter => {
  const adapter = environment.EMAIL_ADAPTER?.trim().toLowerCase();
  const provider = environment.EMAIL_PROVIDER?.trim().toLowerCase();
  const explicitFake = adapter === "fake" || environment.EMAIL_FAKE === "true";
  const testRuntime = environment.NODE_ENV === "test" || environment.AUTH_MODE === "test";

  if (explicitFake || testRuntime) {
    return new FakeEmailAdapter();
  }

  if (adapter === "brevo" || provider === "brevo" || environment.EMAIL_WEBHOOK_URL?.includes("api.brevo.com")) {
    return new BrevoEmailAdapter(
      environment.EMAIL_API_KEY,
      environment.EMAIL_FROM,
      environment.EMAIL_WEBHOOK_URL,
      environment,
    );
  }

  if (environment.EMAIL_WEBHOOK_URL) {
    return new HttpEmailAdapter(environment.EMAIL_WEBHOOK_URL, environment.EMAIL_API_KEY, environment);
  }

  throw new Error("Configure EMAIL_WEBHOOK_URL or set EMAIL_ADAPTER=fake for non-production test/dev runs.");
};
