import { conflict, forbidden, notFound } from "../errors/api-error.js";
import type { AuthUser } from "../middlewares/auth.js";
import { EmailEnvioRepository } from "../repositories/email-envio.repository.js";
import type { LiberarEmailInput } from "../schemas/email.schema.js";
import { EmailAdapter, FakeEmailAdapter } from "./email-adapter.js";

const CONCURRENCY_LIMIT = 10;

const runWithConcurrency = async <T>(
  items: T[],
  fn: (item: T) => Promise<void>,
  limit: number = CONCURRENCY_LIMIT,
): Promise<void> => {
  const executing: Promise<void>[] = [];
  for (const item of items) {
    const promise = fn(item).finally(() => {
      const idx = executing.indexOf(promise);
      if (idx >= 0) executing.splice(idx, 1);
    });
    executing.push(promise);
    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }
  await Promise.allSettled(executing);
};

export class EmailResultadoService {
  constructor(
    private readonly emailRepository = new EmailEnvioRepository(),
    private readonly emailAdapter: EmailAdapter = new FakeEmailAdapter(),
  ) {}

  async liberar(provaId: string, input: LiberarEmailInput, user: AuthUser) {
    const provaExiste = await this.emailRepository.findProvaExists(provaId);
    if (!provaExiste) {
      throw notFound("Prova não encontrada.");
    }

    const hasAccess = await this.emailRepository.hasAccessToProva(provaId, user);
    if (!hasAccess) {
      throw forbidden("Usuário sem permissão para liberar e-mails desta prova.");
    }

    const pendencias = await this.emailRepository.countPendenciasCorrecaoPorProva(provaId);
    if (pendencias > 0 && !input.confirmarPendencias) {
      throw conflict(
        `Existem ${pendencias} pendência(s) de correção. Envie confirmarPendencias=true para liberar mesmo assim.`,
      );
    }

    const alunos = await this.emailRepository.findAlunosComResultado(provaId);
    let enviados = 0;
    let falhas = 0;

    const processarAluno = async (aluno: typeof alunos[number]) => {
      const assunto = `Resultado da avaliação`;
      const corpo = `Olá ${aluno.aluno_nome},\n\nSeu resultado já está disponível.`;

      const envioId = await this.emailRepository.createEnvio(
        aluno.prova_aluno_id,
        aluno.aluno_email,
        assunto,
        corpo,
      );

      try {
        const result = await this.emailAdapter.send(aluno.aluno_email, assunto, corpo);
        if (result.success) {
          await this.emailRepository.markAsSent(envioId);
          enviados += 1;
        } else {
          await this.emailRepository.markAsError(envioId, result.error ?? "Erro desconhecido.");
          falhas += 1;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Erro desconhecido no envio.";
        await this.emailRepository.markAsError(envioId, errorMsg);
        falhas += 1;
      }
    };

    await runWithConcurrency(alunos, processarAluno);

    return {
      enviados,
      falhas,
      pendentes: pendencias,
    };
  }

  async listarEnvios(provaId: string, user: AuthUser) {
    const provaExiste = await this.emailRepository.findProvaExists(provaId);
    if (!provaExiste) {
      throw notFound("Prova não encontrada.");
    }

    const hasAccess = await this.emailRepository.hasAccessToProva(provaId, user);
    if (!hasAccess) {
      throw forbidden("Usuário sem permissão para acessar e-mails desta prova.");
    }

    return this.emailRepository.findEnviosByProva(provaId);
  }

  async reenviar(emailEnvioId: string, user: AuthUser) {
    const envio = await this.emailRepository.findById(emailEnvioId);
    if (!envio) {
      throw notFound("Envio de e-mail não encontrado.");
    }

    if (envio.status !== "erro") {
      throw conflict("Apenas envios com status 'erro' podem ser reenviados.");
    }

    const hasAccess = await this.emailRepository.hasAccessToProva(envio.provaAlunoId, user);
    if (!hasAccess) {
      throw forbidden("Usuário sem permissão para reenviar e-mail.");
    }

    try {
      const result = await this.emailAdapter.send(envio.destinatario, envio.assunto, "Reenvio de resultado");
      if (result.success) {
        await this.emailRepository.markAsSent(emailEnvioId);
      } else {
        await this.emailRepository.markAsError(emailEnvioId, result.error ?? "Erro desconhecido.");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erro desconhecido no envio.";
      await this.emailRepository.markAsError(emailEnvioId, errorMsg);
    }

    const atualizado = await this.emailRepository.findById(emailEnvioId);
    return atualizado!;
  }
}
