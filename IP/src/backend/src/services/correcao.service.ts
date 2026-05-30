import { businessRule, conflict, forbidden, notFound } from "../errors/api-error.js";
import type { AuthUser } from "../middlewares/auth.js";
import { CorrecaoRepository } from "../repositories/correcao.repository.js";
import type { SalvarCorrecaoInput } from "../schemas/correcao.schema.js";

export class CorrecaoService {
  constructor(private readonly correcaoRepository = new CorrecaoRepository()) {}

  async listarQuestoesDaProva(provaId: string, user: AuthUser) {
    await this.ensureProvaAccess(provaId, user);
    return this.correcaoRepository.findQuestoesDaProva(provaId);
  }

  async listarRespostasPorQuestao(provaId: string, questaoId: string, user: AuthUser) {
    await this.ensureProvaAccess(provaId, user);
    return this.correcaoRepository.findRespostasPorQuestao(provaId, questaoId);
  }

  async salvarCorrecao(respostaId: string, input: SalvarCorrecaoInput, user: AuthUser) {
    if (user.perfil !== "professor") {
      throw forbidden("Somente professores podem corrigir respostas.");
    }

    const context = await this.correcaoRepository.findRespostaContext(respostaId);
    if (!context) {
      throw notFound("Resposta não encontrada.");
    }

    if (context.provaAlunoStatus !== "enviada" && context.provaAlunoStatus !== "corrigida") {
      throw conflict("A correção só pode ser feita depois do envio da prova.");
    }

    if (input.nota > context.pontuacaoMax) {
      throw businessRule("A nota não pode ser maior que a pontuação máxima da questão.");
    }

    if (context.professorId !== user.id) {
      const linked = await this.correcaoRepository.professorLinkedToMateria(user.id, context.materiaId);
      if (!linked) {
        throw forbidden("Professor sem vínculo com esta prova.");
      }
    }

    return this.correcaoRepository.upsertCorrecao(respostaId, user.id, input);
  }

  async executarCorrecaoAutomatica(provaId: string, user: AuthUser) {
    if (user.perfil !== "professor") {
      throw forbidden("Somente professores podem executar correção automática.");
    }

    await this.ensureProvaAccess(provaId, user);
    return this.correcaoRepository.corrigirObjetivas(provaId, user.id);
  }

  private async ensureProvaAccess(provaId: string, user: AuthUser) {
    const hasAccess = await this.correcaoRepository.hasAccessToProva(provaId, user);
    if (!hasAccess) {
      throw forbidden("Usuário sem permissão para acessar esta prova.");
    }
  }
}
