import { businessRule, conflict, notFound } from "../errors/api-error.js";
import { RespostaAlunoRepository } from "../repositories/resposta-aluno.repository.js";
import type { SalvarRespostaInput } from "../schemas/resposta-aluno.schema.js";

const objectiveTypes = new Set(["multipla_escolha", "verdadeiro_falso"]);

export class RespostaAlunoService {
  constructor(private readonly respostaAlunoRepository = new RespostaAlunoRepository()) {}

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

  async listarRespostas(provaAlunoId: string) {
    await this.ensureProvaAlunoExists(provaAlunoId);
    return this.respostaAlunoRepository.findByProvaAluno(provaAlunoId);
  }

  async enviarFinal(provaAlunoId: string) {
    await this.ensureProvaAlunoRespondivel(provaAlunoId);
    const envio = await this.respostaAlunoRepository.markAsSubmitted(provaAlunoId);
    if (!envio.provaAlunoId) {
      throw notFound("Prova do aluno não encontrada.");
    }
    return envio;
  }

  private async ensureProvaAlunoExists(provaAlunoId: string) {
    const context = await this.respostaAlunoRepository.findProvaAlunoContext(provaAlunoId);
    if (!context) {
      throw notFound("Prova do aluno não encontrada.");
    }
    return context;
  }

  private async ensureProvaAlunoRespondivel(provaAlunoId: string) {
    const context = await this.ensureProvaAlunoExists(provaAlunoId);

    if (context.status !== "em_andamento") {
      throw conflict("A prova do aluno não está em andamento.");
    }

    if (context.provaStatus !== "publicada" || !context.dataInicio || !context.dataFim) {
      throw conflict("Prova indisponível para resposta.");
    }

    const now = Date.now();
    if (now < new Date(context.dataInicio).getTime() || now > new Date(context.dataFim).getTime()) {
      throw conflict("Prova fora do período de resposta.");
    }

    return context;
  }
}
