import { businessRule, forbidden, notFound } from "../errors/api-error.js";
import type { AuthUser } from "../models/auth.model.js";
import { QuestaoRepository } from "../repositories/questao.repository.js";
import type { CreateQuestaoInput, ListQuestoesQuery, UpdateQuestaoInput } from "../schemas/questao.schema.js";

const hasDuplicateOrders = (alternativas: NonNullable<CreateQuestaoInput["alternativas"]>) => {
  const orders = new Set<number>();
  for (const alternativa of alternativas) {
    if (orders.has(alternativa.ordemOriginal)) {
      return true;
    }
    orders.add(alternativa.ordemOriginal);
  }
  return false;
};

/**
 * Gerencia o banco de questões com validações específicas por tipo.
 *
 * ## Tipos de questão e regras de alternativas
 * | Tipo | Alternativas mínimas | Alternativas corretas |
 * |---|---|---|
 * | multipla_escolha | ≥ 2 | exatamente 1 |
 * | verdadeiro_falso | exatas 2 | exatamente 1 |
 * | discursiva | 0 (nenhuma) | N/A |
 *
 * ## Exclusão (soft delete)
 * Se a questão já está vinculada a alguma prova, a exclusão é
 * lógica: `ativa = false`. Caso contrário, o registro é removido
 * fisicamente. Isso evita quebrar provas existentes que referenciam
 * a questão.
 *
 * ## Transação na criação/atualização
 * A operação é atômica: insere/atualiza `questao`, `enunciado`
 * e `alternativa` dentro da mesma transação.
 */
export class QuestaoService {
  constructor(private readonly questaoRepository = new QuestaoRepository()) {}

  /**
   * Valida as regras de alternativas conforme o tipo da questão.
   *
   * @param input - Dados da questão contendo tipo e array de alternativas.
   * @throws businessRule - Se houver ordens duplicadas, se discursiva tiver alternativas,
   *                        se múltipla escolha não tiver mínimo 2 alternativas e exatamente 1 correta,
   *                        ou se verdadeiro/falso não tiver exatamente 2 alternativas e 1 correta.
   */
  private validateAlternativas(input: CreateQuestaoInput | UpdateQuestaoInput) {
    const alternativas = input.alternativas ?? [];
    const corretas = alternativas.filter((alternativa) => alternativa.correta).length;

    if (hasDuplicateOrders(alternativas)) {
      throw businessRule("Ordem de alternativa duplicada.");
    }

    if (input.tipo === "discursiva") {
      if (alternativas.length > 0) {
        throw businessRule("Questões discursivas não devem ter alternativas.");
      }
      return;
    }

    if (input.tipo === "multipla_escolha") {
      if (alternativas.length < 2 || corretas !== 1) {
        throw businessRule("Questões de múltipla escolha precisam ter pelo menos duas alternativas e exatamente uma correta.");
      }
      return;
    }

    if (alternativas.length !== 2 || corretas !== 1) {
      throw businessRule("Questões de verdadeiro/falso precisam ter exatamente duas alternativas e uma correta.");
    }
  }

  /**
   * Garante que campos de limite só sejam usados em questões discursivas.
   *
   * @param input - Dados da questão contendo tipo e limites opcionais.
   * @throws businessRule - Se a questão não for discursiva e possuir limiteCaracteres, limitePalavras ou permiteAnexo.
   */
  private validateDiscursivaLimits(input: CreateQuestaoInput | UpdateQuestaoInput) {
    if (input.tipo !== "discursiva" && (input.limiteCaracteres || input.limitePalavras || input.permiteAnexo)) {
      throw businessRule("Limites e anexos só são válidos para questões discursivas.");
    }
  }

  /**
   * Valida o acesso do usuário à matéria da questão.
   *
   * @param input - Dados da questão contendo materiaId e temaId opcional.
   * @param user - Usuário autenticado (coordenadores pulam verificação de vínculo).
   * @throws businessRule - Se a matéria não existir ou o tema não pertencer à matéria.
   * @throws forbidden - Se o professor não estiver vinculado à matéria.
   */
  private async validateMateriaAccess(input: CreateQuestaoInput | UpdateQuestaoInput, user: AuthUser) {
    const materiaId = input.materiaId;
    if (!materiaId) return;

    const materiaExists = await this.questaoRepository.materiaExists(materiaId);
    if (!materiaExists) {
      throw businessRule("Matéria informada não existe.");
    }

    if (input.temaId) {
      const temaBelongs = await this.questaoRepository.temaBelongsToMateria(input.temaId, materiaId);
      if (!temaBelongs) {
        throw businessRule("Tema informado não pertence à matéria da questão.");
      }
    }

    if (user.perfil === "professor") {
      const vinculado = await this.questaoRepository.professorMateriaVinculados(user.id, materiaId);
      if (!vinculado) {
        throw forbidden("Professor não está vinculado à matéria informada.");
      }
    }
  }

  /**
   * Cria uma nova questão com enunciado e alternativas em transação.
   *
   * @param input - Dados completos da questão (tipo, materiaId, enunciado, alternativas, limites).
   * @param user - Usuário autenticado (deve ter acesso à matéria).
   * @returns A questão recém-criada com seus relacionamentos.
   * @throws businessRule - Se as regras de alternativas ou limites forem violadas.
   * @throws businessRule - Se a matéria não existir ou tema não pertencer à matéria.
   * @throws forbidden - Se o professor não estiver vinculado à matéria.
   */
  async criar(input: CreateQuestaoInput, user: AuthUser) {
    this.validateAlternativas(input);
    this.validateDiscursivaLimits(input);
    await this.validateMateriaAccess(input, user);
    return this.questaoRepository.create(input);
  }

  /**
   * Lista questões com filtros e paginação.
   *
   * @param query - Filtros (materiaId, temaId, tipo, busca textual) e paginação.
   * @param user - Usuário autenticado (professores veem apenas questões das matérias vinculadas).
   * @returns Lista paginada de questões ativas.
   */
  async listar(query: ListQuestoesQuery, user: AuthUser) {
    return this.questaoRepository.findMany(query, user);
  }

  /**
   * Busca questão por ID com verificação de acesso.
   *
   * @param questaoId - Identificador único da questão.
   * @param user - Usuário autenticado (professores só acessam questões de matérias vinculadas).
   * @returns A questão encontrada com seus dados completos.
   * @throws notFound - Se a questão não for encontrada.
   * @throws forbidden - Se o professor não estiver vinculado à matéria da questão.
   */
  async buscarPorId(questaoId: string, user: AuthUser) {
    const questao = await this.questaoRepository.findById(questaoId);
    if (!questao) {
      throw notFound("Questão não encontrada.");
    }

    if (user.perfil === "professor") {
      const vinculado = await this.questaoRepository.professorMateriaVinculados(user.id, questao.materiaId);
      if (!vinculado) {
        throw forbidden("Professor não está vinculado à matéria da questão.");
      }
    }

    return questao;
  }

  /**
   * Atualiza questão com substituição completa de enunciado e alternativas.
   *
   * @param questaoId - Identificador único da questão a ser atualizada.
   * @param input - Novos dados da questão (tipo, enunciado, alternativas — as antigas são deletadas e recriadas).
   * @param user - Usuário autenticado (deve ter acesso à matéria).
   * @returns A questão atualizada.
   * @throws notFound - Se a questão não for encontrada.
   * @throws businessRule - Se as regras de alternativas ou limites forem violadas.
   * @throws forbidden - Se o professor não estiver vinculado à matéria.
   */
  async atualizar(questaoId: string, input: UpdateQuestaoInput, user: AuthUser) {
    await this.buscarPorId(questaoId, user);
    this.validateAlternativas(input);
    this.validateDiscursivaLimits(input);
    await this.validateMateriaAccess(input, user);

    const updated = await this.questaoRepository.update(questaoId, input);
    if (!updated) {
      throw notFound("Questão não encontrada.");
    }

    return updated;
  }

  /**
   * Remove ou desativa uma questão.
   *
   * @param questaoId - Identificador único da questão a ser removida.
   * @param user - Usuário autenticado (deve ter acesso à questão).
   * @throws notFound - Se a questão não for encontrada (via buscarPorId).
   */
  async remover(questaoId: string, user: AuthUser) {
    await this.buscarPorId(questaoId, user);
    await this.questaoRepository.deleteOrDeactivate(questaoId);
  }
}
