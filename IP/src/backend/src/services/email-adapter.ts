export interface EmailAdapter {
  send(para: string, assunto: string, corpo: string): Promise<{ success: boolean; error?: string }>;
}

export class FakeEmailAdapter implements EmailAdapter {
  async send(para: string, assunto: string, corpo: string) {
    if (process.env.EMAIL_FAIL_MODE === "always") {
      return { success: false, error: "Falha simulada no envio de e-mail." };
    }
    return { success: true };
  }
}
