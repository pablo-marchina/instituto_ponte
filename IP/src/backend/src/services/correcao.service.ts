import { businessRule, conflict, forbidden, notFound } from "../errors/api-error.js";
import type { AuthUser } from "../models/auth.model.js";
import { CorrecaoRepository } from "../repositories/correcao.repository.js";
import type { SalvarCorrecaoInput } from "../schemas/correcao.schema.js";

/**
 * Gerencia a correção de respostas, tanto manual quanto automática.
 *
 * ## Correção manual
 * - Professor seleciona uma resposta e atribui nota + opcionalmente
 *   observação e feedback.
 * - Valida que a resposta já foi enviada (status "enviada" ou "corrigida").
 * - A nota não pode exceder a `pontuacaoMax` configurada na prova
 *   para aquela questão.
 * - O professor deve ser o autor da prova ou estar vinculado à matéria.
 *
 * ## Correção automática
 * - Processa todas as questões objetivas (multipla_escolha e V/F) de uma
 *   prova de uma só vez.
 * - Lógica: se a alternativa selecionada pelo aluno tem `correta = true`,
 *   recebe `pontuacaoMax`; senão, nota zero.
 * - Questões discursivas permanecem pendentes para correção manual.
 * - Usa `INSERT ... ON CONFLICT` para que re-executar a correção
 *   automática atualize notas existentes (útil se o gabarito mudar).
 */
export class CorrecaoService {
  constructor(private readonly correcaoRepository = new CorrecaoRepository()) {}

  /**
   * Lista as questões de uma prova com estatísticas de correção.
   *
   * @param provaId - ID da prova.
   * @param user - Usuário autenticado (deve ter permissão de acesso).
   * @returns Lista de questões com total de respostas e quantidade já corrigidas.
   */
  async listarQuestoesDaProva(provaId: string, user: AuthUser) {
    await this.ensureProvaAccess(provaId, user);
    return this.correcaoRepository.findQuestoesDaProva(provaId);
  }

  /**
   * Lista as respostas de uma questão específica em uma prova.
   *
   * @param provaId - ID da prova.
   * @param questaoId - ID da questão.
   * @param user - Usuário autenticado (deve ter permissão de acesso).
   * @returns Lista de respostas com dados do aluno, anexos e status da correção.
   */
  async listarRespostasPorQuestao(provaId: string, questaoId: string, user: AuthUser) {
    await this.ensureProvaAccess(provaId, user);
    return this.correcaoRepository.findRespostasPorQuestao(provaId, questaoId);
  }

  /**
   * Salva ou atualiza a correção manual de uma resposta (upsert).
   *
   * @param respostaId - ID da resposta a ser corrigida.
   * @param input.nota - Valor numérico da nota (não pode exceder pontuacaoMax da questão).
   * @param input.observacao - Comentário opcional do corretor.
   * @param input.feedback - Mensagem opcional enviada ao aluno.
   * @param user - Usuário autenticado (deve ser professor com vínculo à prova).
   * @returns A correção salva ou atualizada.
   * @throws forbidden - Se o usuário não for professor ou não tiver vínculo com a prova.
   * @throws notFound - Se a resposta não for encontrada.
   * @throws conflict - Se a prova do aluno não estiver no status "enviada" ou "corrigida".
   * @throws businessRule - Se a nota exceder a pontuação máxima da questão.
   */
  async salvarCorrecao(respostaId: string, input: SalvarCorrecaoInput, user: AuthUser) {
    if (user.perfil !== "professor" && user.perfil !== "coordenador") {
      throw forbidden("Somente professores e coordenadores podem corrigir respostas.");
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

    if (user.perfil === "professor" && context.professorId !== user.id) {
      const linked = await this.correcaoRepository.professorLinkedToMateria(user.id, context.materiaId);
      if (!linked) {
        throw forbidden("Professor sem vínculo com esta prova.");
      }
    }

    const corretorProfessorId = user.perfil === "coordenador" ? context.professorId : user.id;
    return this.correcaoRepository.upsertCorrecao(respostaId, corretorProfessorId, input);
  }

  /**
   * Executa a correção automática para todas as questões objetivas da prova.
   *
   * @param provaId - ID da prova.
   * @param user - Usuário autenticado (deve ser professor ou coordenador).
   * @returns Resumo com total de respostas corrigidas e quantidade de questões discursivas pendentes.
   * @throws forbidden - Se o usuário não for professor ou não tiver acesso à prova.
   */
  async executarCorrecaoAutomatica(provaId: string, user: AuthUser) {
    if (user.perfil !== "professor" && user.perfil !== "coordenador") {
      throw forbidden("Somente professores e coordenadores podem executar correção automática.");
    }

    await this.ensureProvaAccess(provaId, user);
    return this.correcaoRepository.corrigirObjetivas(provaId);
  }

  /**
   * Verifica se o usuário tem permissão para acessar a correção da prova.
   *
   * @param provaId - ID da prova.
   * @param user - Usuário autenticado.
   * @throws forbidden - Se o usuário não tiver permissão de acesso à prova.
   */
  private async ensureProvaAccess(provaId: string, user: AuthUser) {
    const hasAccess = await this.correcaoRepository.hasAccessToProva(provaId, user);
    if (!hasAccess) {
      const provaExists = await this.correcaoRepository.findProvaExists(provaId);
      if (!provaExists) {
        throw notFound("Prova não encontrada.");
      }
      throw forbidden("Usuário sem permissão para acessar esta prova.");
    }
  }
}
