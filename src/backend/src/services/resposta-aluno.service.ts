import { businessRule, conflict, notFound } from "../errors/api-error.js";
import { RespostaAlunoRepository } from "../repositories/resposta-aluno.repository.js";
import type { SalvarRespostaInput } from "../schemas/resposta-aluno.schema.js";

const objectiveTypes = new Set(["multipla_escolha", "verdadeiro_falso"]);

/**
 * Gerencia o salvamento de respostas do aluno durante a prova.
 *
 ## Fluxo
 * 1. Aluno responde → `salvarRascunho` (upsert a cada interação,
 *    sempre com `rascunho: true`).
 * 2. Aluno finaliza → `enviarFinal` (marca `rascunho: false` e
 *    `enviada_final: true`; status de `prova_aluno` vai para "enviada").
 *
 * ## Validações em ambas as etapas
 * - A prova deve estar "publicada" e dentro da janela de tempo.
 * - O registro `prova_aluno` deve estar com status "em_andamento".
 *
 * ## Validações específicas por tipo de questão
 * - **Múltipla escolha / V ou F**: deve enviar `alternativaId` e ele
 *   precisa pertencer à questão.
 * - **Discursiva**: não pode ter `alternativaId`, deve ter `respostaTexto`
 *   e respeitar o `limiteCaracteres` da questão.
 */
export class RespostaAlunoService {
  constructor(private readonly respostaAlunoRepository = new RespostaAlunoRepository()) {}

  /**
   * Salva ou atualiza o rascunho de uma resposta (upsert).
   *
   * @param provaAlunoId - ID do registro prova_aluno (sessão do aluno na prova).
   * @param questaoId - ID da questão sendo respondida.
   * @param input.alternativaId - ID da alternativa marcada (para questões objetivas).
   * @param input.respostaTexto - Texto da resposta (para questões discursivas).
   * @param input.rascunho - Sempre true neste método.
   * @returns Dados básicos da resposta salva (id, timestamp, rascunho).
   * @throws notFound - Se a questão não for encontrada na prova do aluno.
   * @throws businessRule - Se a validação por tipo de questão falhar (alternativa inválida, limite excedido).
   * @throws conflict - Se a prova não estiver em andamento ou fora do período.
   */
  async salvarRascunho(provaAlunoId: string, questaoId: string, input: SalvarRespostaInput) {
    await this.ensureProvaAlunoRespondivel(provaAlunoId);
    const questao = await this.respostaAlunoRepository.findQuestaoDaProva(provaAlunoId, questaoId);
    if (!questao) {
      throw notFound("Questão não encontrada na prova do aluno.");
    }

    if (objectiveTypes.has(questao.tipo)) {
      if (!input.alternativaId) {
        throw businessRule("Questões objetivas exigem alternativa marcada.");
      }

      const alternativaValida = await this.respostaAlunoRepository.alternativaBelongsToQuestao(
        input.alternativaId,
        questaoId,
      );
      if (!alternativaValida) {
        throw businessRule("Alternativa informada não pertence à questão.");
      }
    }

    if (questao.tipo === "discursiva") {
      if (input.alternativaId) {
        throw businessRule("Questões discursivas não aceitam alternativa marcada.");
      }
      if (!input.respostaTexto) {
        throw businessRule("Questões discursivas exigem resposta textual.");
      }
      if (questao.limiteCaracteres && input.respostaTexto.length > questao.limiteCaracteres) {
        throw businessRule("A resposta ultrapassa o limite de caracteres da questão.");
      }
    }

    return this.respostaAlunoRepository.upsert(provaAlunoId, questaoId, input);
  }

  /**
   * Lista todas as respostas de um aluno em uma prova.
   *
   * @param provaAlunoId - ID do registro prova_aluno (sessão do aluno na prova).
   * @returns Lista de respostas ordenadas por criação.
   * @throws notFound - Se a prova do aluno não for encontrada.
   */
  async listarRespostas(provaAlunoId: string) {
    await this.ensureProvaAlunoExists(provaAlunoId);
    return this.respostaAlunoRepository.findByProvaAluno(provaAlunoId);
  }

  /**
   * Finaliza a prova do aluno (envio definitivo).
   *
   * @param provaAlunoId - ID do registro prova_aluno (sessão do aluno na prova).
   * @returns Resumo do envio incluindo lista de `questoesEmBranco`.
   * @throws conflict - Se a prova não estiver em andamento ou fora do período.
   * @throws notFound - Se a prova do aluno não for encontrada.
   */
  async enviarFinal(provaAlunoId: string) {
    await this.ensureProvaAlunoRespondivel(provaAlunoId);
    const envio = await this.respostaAlunoRepository.markAsSubmitted(provaAlunoId);
    if (!envio.provaAlunoId) {
      throw notFound("Prova do aluno não encontrada.");
    }
    return envio;
  }

  /**
   * Verifica se o registro prova-aluno existe e retorna seu contexto.
   *
   * @param provaAlunoId - ID do registro prova_aluno.
   * @returns Contexto com dados da prova e do aluno.
   * @throws notFound - Se a prova do aluno não for encontrada.
   */
  private async ensureProvaAlunoExists(provaAlunoId: string) {
    const context = await this.respostaAlunoRepository.findProvaAlunoContext(provaAlunoId);
    if (!context) {
      throw notFound("Prova do aluno não encontrada.");
    }
    return context;
  }

  /**
   * Valida se o aluno ainda pode responder à prova.
   *
   * @param provaAlunoId - ID do registro prova_aluno.
   * @returns O contexto validado da prova do aluno.
   * @throws notFound - Se a prova do aluno não for encontrada.
   * @throws conflict - Se a prova não estiver em andamento, indisponível ou fora do período.
   */
  private async ensureProvaAlunoRespondivel(provaAlunoId: string) {
    const context = await this.ensureProvaAlunoExists(provaAlunoId);

    if (context.status !== "em_andamento") {
      throw conflict("A prova do aluno não está em andamento.");
    }

    if (context.provaStatus !== "publicada" || !context.dataInicio || !context.dataFim) {
      throw conflict("Prova indisponível para resposta.");
    }

    const now = Date.now();
    const windowEnd = new Date(context.dataFim).getTime();
    const attemptEnd = context.inicioEm && context.tempoLimiteMin !== null
      ? new Date(context.inicioEm).getTime() + context.tempoLimiteMin * 60_000
      : windowEnd;
    const effectiveEnd = Math.min(windowEnd, attemptEnd);
    if (now < new Date(context.dataInicio).getTime() || now > effectiveEnd) {
      throw conflict("Prova fora do período de resposta.");
    }

    return context;
  }
}
