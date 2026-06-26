import { conflict, forbidden, notFound } from "../errors/api-error.js";
import type { AuthUser } from "../models/auth.model.js";
import { EmailEnvioRepository } from "../repositories/email-envio.repository.js";
import type { LiberarEmailInput } from "../schemas/email.schema.js";
import { createEmailAdapter, type EmailAdapter } from "./email-adapter.js";

/** Limite de envios simultâneos de email. */
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

const formatNumber = (value: string | number | null | undefined) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : "0.00";
};

const buildResultadoEmailBody = (aluno: Awaited<ReturnType<EmailEnvioRepository["findAlunosComResultado"]>>[number]) => {
  const provaTitulo = aluno.prova_titulo ? `"${aluno.prova_titulo}"` : "sua avaliacao";
  const feedbacks = aluno.feedbacks?.trim()
    ? `Feedback:\n- ${aluno.feedbacks.trim()}`
    : "Feedback: nenhum comentario textual foi registrado.";

  return [
    `Ola ${aluno.aluno_nome},`,
    "",
    `Seu resultado de ${provaTitulo} esta disponivel.`,
    "",
    `Nota: ${formatNumber(aluno.nota_total)} de ${formatNumber(aluno.pontuacao_total)} (${formatNumber(aluno.percentual)}%).`,
    "",
    feedbacks,
    "",
    "Atenciosamente,",
    "Equipe Corrije Ai",
  ].join("\n");
};

/**
 * Envio de resultados por email para alunos com controle de
 * concorrência.
 *
 * ## Fluxo
 * 1. `liberar`: verifica pendências de correção, busca alunos com
 *    status "corrigida", dispara emails em paralelo (até 10 simultâneos).
 * 2. Cada envio passa por: criar registro pendente → chamar adapter →
 *    marcar como "enviado" ou "erro".
 * 3. `reenviar`: apenas registros com status "erro" podem ser reenviados.
 *
 * ## Adapter de email
 * O adapter padrão é resolvido por configuração. Em teste/dev explícito,
 * usa o fake; em runtime real, exige um webhook de envio configurado.
 *
 * ## Tratamento de pendências
 * Se a prova ainda tem correções pendentes, o método `liberar` exige
 * confirmação explícita (`confirmarPendencias: true`) para prosseguir.
 */
export class EmailResultadoService {
  constructor(
    private readonly emailRepository = new EmailEnvioRepository(),
    private readonly emailAdapter: EmailAdapter = createEmailAdapter(),
  ) {}

  /**
   * Dispara emails de resultado para todos os alunos com prova corrigida.
   *
   * @param provaId - ID da prova.
   * @param input.confirmarPendencias - Se true, ignora pendências de correção e envia mesmo assim.
   * @param user - Usuário autenticado (deve ter permissão de acesso à prova).
   * @returns Estatísticas de envios: { enviados, falhas, pendentes }.
   * @throws notFound - Se a prova não for encontrada.
   * @throws forbidden - Se o usuário não tiver permissão para liberar emails.
   * @throws conflict - Se houver pendências de correção e confirmarPendencias não for true.
   */
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
      const emailAssunto = "Resultado da avaliacao";
      const emailCorpo = buildResultadoEmailBody(aluno);
      const assunto = `Resultado da avaliação`;
      const corpo = `Olá ${aluno.aluno_nome},\n\nSeu resultado já está disponível.`;

      const envioId = await this.emailRepository.createEnvio(
        aluno.prova_aluno_id,
        aluno.aluno_email,
        emailAssunto,
        emailCorpo,
      );

      try {
        const result = await this.emailAdapter.send(aluno.aluno_email, emailAssunto, emailCorpo);
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

  /**
   * Lista o histórico de envios de email de uma prova.
   *
   * @param provaId - ID da prova.
   * @param user - Usuário autenticado (deve ter permissão de acesso).
   * @returns Lista de registros de envio ordenados do mais recente para o mais antigo.
   * @throws notFound - Se a prova não for encontrada.
   * @throws forbidden - Se o usuário não tiver permissão para acessar os envios.
   */
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

  /**
   * Reenvia um email que falhou anteriormente.
   *
   * @param emailEnvioId - ID do registro em email_envio.
   * @param user - Usuário autenticado (deve ter permissão de acesso).
   * @returns O registro de envio atualizado após o reenvio.
   * @throws notFound - Se o registro de envio não for encontrado.
   * @throws conflict - Se o envio original não estiver com status "erro".
   * @throws forbidden - Se o usuário não tiver permissão para reenviar.
   */
  async reenviar(emailEnvioId: string, user: AuthUser) {
    const envio = await this.emailRepository.findById(emailEnvioId);
    if (!envio) {
      throw notFound("Envio de e-mail não encontrado.");
    }

    if (envio.status !== "erro") {
      throw conflict("Apenas envios com status 'erro' podem ser reenviados.");
    }

    const hasAccess = await this.emailRepository.hasAccessToProva(envio.provaId!, user);
    if (!hasAccess) {
      throw forbidden("Usuário sem permissão para reenviar e-mail.");
    }

    try {
      const result = await this.emailAdapter.send(envio.destinatario, envio.assunto, envio.corpo ?? "Reenvio de resultado");
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
