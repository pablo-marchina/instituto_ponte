import { businessRule, forbidden, notFound } from "../errors/api-error.js";
import type { AuthUser } from "../middlewares/auth.js";
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

export class QuestaoService {
  constructor(private readonly questaoRepository = new QuestaoRepository()) {}

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

  private validateDiscursivaLimits(input: CreateQuestaoInput | UpdateQuestaoInput) {
    if (input.tipo !== "discursiva" && (input.limiteCaracteres || input.limitePalavras || input.permiteAnexo)) {
      throw businessRule("Limites e anexos só são válidos para questões discursivas.");
    }
  }

  private async validateMateriaAccess(input: CreateQuestaoInput | UpdateQuestaoInput, user: AuthUser) {
    const materiaExists = await this.questaoRepository.materiaExists(input.materiaId);
    if (!materiaExists) {
      throw businessRule("Matéria informada não existe.");
    }

    if (input.temaId) {
      const temaBelongs = await this.questaoRepository.temaBelongsToMateria(input.temaId, input.materiaId);
      if (!temaBelongs) {
        throw businessRule("Tema informado não pertence à matéria da questão.");
      }
    }

    if (user.perfil === "professor") {
      const vinculado = await this.questaoRepository.professorMateriaVinculados(user.id, input.materiaId);
      if (!vinculado) {
        throw forbidden("Professor não está vinculado à matéria informada.");
      }
    }
  }

  async criar(input: CreateQuestaoInput, user: AuthUser) {
    this.validateAlternativas(input);
    this.validateDiscursivaLimits(input);
    await this.validateMateriaAccess(input, user);
    return this.questaoRepository.create(input);
  }

  async listar(query: ListQuestoesQuery, user: AuthUser) {
    return this.questaoRepository.findMany(query, user);
  }

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

  async remover(questaoId: string, user: AuthUser) {
    await this.buscarPorId(questaoId, user);
    await this.questaoRepository.deleteOrDeactivate(questaoId);
  }
}
