import { AvaliacaoLogRepository } from "../repositories/avaliacao-log.repository.js";
import type { CriarLogInput } from "../schemas/analytics.schema.js";

export class AvaliacaoLogService {
  constructor(private readonly logRepository = new AvaliacaoLogRepository()) {}

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
