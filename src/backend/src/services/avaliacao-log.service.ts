import { AvaliacaoLogRepository } from "../repositories/avaliacao-log.repository.js";
import type { CriarLogInput } from "../schemas/analytics.schema.js";

/**
 * Auditoria de ações durante a avaliação (upload, acesso, erros).
 *
 * Registra eventos como falhas de upload, tentativas de acesso
 * e outras ações relevantes para rastreabilidade.
 */
export class AvaliacaoLogService {
  constructor(private readonly logRepository = new AvaliacaoLogRepository()) {}

  /**
   * Registra um evento de log de auditoria.
   *
   * @param input - Dados do log (provaId, provaAlunoId, atorTipo, atorId, acao, detalhes).
   * @returns O registro de log criado.
   */
  async registrar(input: CriarLogInput) {
    return this.logRepository.create({
      provaId: input.provaId,
      provaAlunoId: input.provaAlunoId,
      atorTipo: input.atorTipo,
      atorId: input.atorId,
      acao: input.acao,
      detalhes: input.detalhes,
    });
  }
}
