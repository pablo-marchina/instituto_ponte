import { describe, expect, it } from "vitest";
import { convertBancoToQuestion } from "./dashboard/dashboard.mappers";
import type { BancoQuestion, ExamBadge } from "./dashboard/dashboard.types";
import { mapExamBadgeToProvaStatus, mapProvaQuestaoToQuestion, mapProvaToExam } from "./provas/provas.mappers";
import type { ProvaDto, ProvaQuestaoDto, QuestaoDto } from "./provas/provas.types";
import {
  mapBancoQuestionToUpdatePayload,
  mapQuestaoToBancoQuestion,
  mapQuestaoToQuestion,
  mapQuestionToCreateQuestaoPayload,
} from "./questoes/questoes.mappers";
import type { Question } from "./questoes/questao.types";

const questaoAlternativa: QuestaoDto = {
  id: "q1",
  materiaId: "m1",
  temaId: null,
  tipo: "multipla_escolha",
  limiteCaracteres: null,
  limitePalavras: null,
  permiteAnexo: false,
  enunciado: { conteudoLatex: "Quanto e 2+2?", urlImagem: null },
  alternativas: [
    { id: "a1", conteudoLatex: "3", urlImagem: null, correta: false, ordemOriginal: 1 },
    { id: "a2", conteudoLatex: "4", urlImagem: null, correta: true, ordemOriginal: 2 },
  ],
  pontuacaoPadrao: 2,
  criadoEm: "2026-01-01",
  atualizadoEm: "2026-01-01",
  ativa: true,
};

describe("mappers", () => {
  it("converte banco para question preservando campos consumidos pela UI", () => {
    const banco: BancoQuestion = {
      id: "b1",
      type: "Discursiva",
      materia: "Matematica",
      materiaId: "m1",
      semestre: "Banco",
      dificuldade: "Media",
      text: "Explique",
      answer: "A ser corrigido",
      timesUsed: 2,
      successRate: 0.5,
    };

    expect(convertBancoToQuestion(banco)).toEqual({
      id: "b1",
      type: "Discursiva",
      text: "Explique",
      options: undefined,
      answer: "A ser corrigido",
    });
  });

  it("mapeia prova para exam usando defaults e status bidirecional", () => {
    const prova: ProvaDto = {
      id: "p1",
      titulo: "Prova 1",
      modalidade: "online",
      turma: "A",
      semestre: "2026.1",
      status: "publicada",
      materiaId: "m1",
      professorId: "prof1",
      criadoEm: "2026-01-01",
      atualizadoEm: "2026-01-01",
      embaralharQuestoes: true,
      embaralharAlternativas: false,
      materia: undefined,
      professor: { id: "prof1", nome: "Professora" },
      submissoes: 3,
      tempoLimiteMin: 45,
      dataInicio: "2026-01-01",
      dataFim: "2026-01-02",
      instrucoes: "Boa prova",
      urlAcesso: "abc",
      qrCode: "qr",
    };

    expect(mapProvaToExam(prova)).toMatchObject({
      id: "p1",
      title: "Prova 1",
      discipline: "Matéria",
      badge: "Publicada",
      submissions: "3",
      professorName: "Professora",
    });

    const badges: ExamBadge[] = ["Rascunho", "Publicada", "Encerrada", "Antiga"];
    expect(badges.map(mapExamBadgeToProvaStatus)).toEqual(["rascunho", "publicada", "encerrada", "antiga"]);
  });

  it("mapeia questoes objetivas, VF e discursivas para modelos da UI e payloads", () => {
    expect(mapQuestaoToQuestion(questaoAlternativa)).toEqual({
      id: "q1",
      type: "Alternativa",
      text: "Quanto e 2+2?",
      options: [
        { letter: "A", text: "3", correct: false },
        { letter: "B", text: "4", correct: true },
      ],
      answer: undefined,
    });

    const vf: QuestaoDto = {
      ...questaoAlternativa,
      id: "vf1",
      tipo: "verdadeiro_falso",
      alternativas: [
        { id: "v", conteudoLatex: "Verdadeiro", urlImagem: null, correta: false, ordemOriginal: 1 },
        { id: "f", conteudoLatex: "Falso", urlImagem: null, correta: true, ordemOriginal: 2 },
      ],
    };
    expect(mapQuestaoToQuestion(vf).answer).toBe("Falso");

    const discursiva: Question = { id: "d1", type: "Discursiva", text: "Explique" };
    expect(mapQuestionToCreateQuestaoPayload(discursiva, "m1")).toEqual({
      materiaId: "m1",
      tipo: "discursiva",
      permiteAnexo: false,
      pontuacaoPadrao: 1,
      enunciado: { conteudoLatex: "Explique", urlImagem: null },
      alternativas: [],
    });

    expect(mapQuestionToCreateQuestaoPayload({
      id: "vf2",
      type: "V/F",
      text: "O ceu e azul?",
      answer: "Falso",
    }, "m1", 3).alternativas).toEqual([
      { ordemOriginal: 1, conteudoLatex: "Verdadeiro", correta: false },
      { ordemOriginal: 2, conteudoLatex: "Falso", correta: true },
    ]);

    expect(mapQuestionToCreateQuestaoPayload({
      id: "alt",
      type: "Alternativa",
      text: "Escolha",
      options: [{ letter: "C", text: "Opcao", correct: true }],
    }, "m1").alternativas).toEqual([{ ordemOriginal: 3, conteudoLatex: "Opcao", correta: true }]);
  });

  it("mapeia questao de prova e banco para payload de update", () => {
    const item: ProvaQuestaoDto = {
      provaId: "p1",
      questaoId: "q1",
      ordemOriginal: 1,
      pontuacaoMax: 2,
      criadoEm: "2026-01-01",
      questao: questaoAlternativa,
    };
    expect(mapProvaQuestaoToQuestion(item).options?.[1]).toEqual({ letter: "B", text: "4", correct: true });
    expect(mapProvaQuestaoToQuestion({ ...item, questao: undefined })).toMatchObject({
      id: "q1",
      type: "Discursiva",
      text: "",
    });

    const banco = mapQuestaoToBancoQuestion(questaoAlternativa, "Matematica");
    expect(banco).toMatchObject({ materia: "Matematica", dificuldade: "Média", pontuacaoPadrao: 2 });
    expect(mapBancoQuestionToUpdatePayload(banco)).toMatchObject({
      materiaId: "m1",
      tipo: "multipla_escolha",
      pontuacaoPadrao: 2,
    });
  });
});
