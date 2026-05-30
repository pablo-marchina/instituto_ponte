import { describe, expect, it, jest, beforeEach } from "@jest/globals";

const mockFindProvaAlunoContext = jest.fn<any>();
const mockFindQuestaoDaProva = jest.fn<any>();
const mockAlternativaBelongsToQuestao = jest.fn<any>();
const mockUpsert = jest.fn<any>();
const mockFindByProvaAluno = jest.fn<any>();
const mockMarkAsSubmitted = jest.fn<any>();

jest.unstable_mockModule("../../repositories/resposta-aluno.repository.js", () => ({
  RespostaAlunoRepository: jest.fn().mockImplementation(() => ({
    findProvaAlunoContext: mockFindProvaAlunoContext,
    findQuestaoDaProva: mockFindQuestaoDaProva,
    alternativaBelongsToQuestao: mockAlternativaBelongsToQuestao,
    upsert: mockUpsert,
    findByProvaAluno: mockFindByProvaAluno,
    markAsSubmitted: mockMarkAsSubmitted,
  })),
}));

type RespostaAlunoServiceModule = typeof import("../../services/resposta-aluno.service.js");
let RespostaAlunoService: RespostaAlunoServiceModule["RespostaAlunoService"];

const makeContext = (overrides: Record<string, unknown> = {}) => ({
  id: "pa-1",
  status: "em_andamento",
  provaId: "prova-1",
  provaStatus: "publicada",
  dataInicio: new Date(Date.now() - 3600000).toISOString(),
  dataFim: new Date(Date.now() + 3600000).toISOString(),
  ...overrides,
});

beforeEach(async () => {
  jest.resetModules();
  [mockFindProvaAlunoContext, mockFindQuestaoDaProva, mockAlternativaBelongsToQuestao,
   mockUpsert, mockFindByProvaAluno, mockMarkAsSubmitted].forEach((m) => m.mockReset());
  const mod = await import("../../services/resposta-aluno.service.js");
  RespostaAlunoService = mod.RespostaAlunoService;
});

describe("RespostaAlunoService", () => {
  it("salvarRascunho deve lancar erro se prova aluno nao encontrada", async () => {
    mockFindProvaAlunoContext.mockResolvedValue(null);
    await expect(new RespostaAlunoService().salvarRascunho("pa-1", "q-1", { respostaTexto: "teste" })).rejects.toThrow("Prova do aluno não encontrada.");
  });

  it("salvarRascunho deve lancar erro se questao nao encontrada na prova", async () => {
    mockFindProvaAlunoContext.mockResolvedValue(makeContext());
    mockFindQuestaoDaProva.mockResolvedValue(null);
    await expect(new RespostaAlunoService().salvarRascunho("pa-1", "q-1", { respostaTexto: "teste" })).rejects.toThrow("Questão não encontrada na prova do aluno.");
  });

  it("salvarRascunho deve lancar erro se questao objetiva sem alternativa", async () => {
    mockFindProvaAlunoContext.mockResolvedValue(makeContext());
    mockFindQuestaoDaProva.mockResolvedValue({ tipo: "multipla_escolha" });
    await expect(new RespostaAlunoService().salvarRascunho("pa-1", "q-1", {})).rejects.toThrow("Questões objetivas exigem alternativa marcada.");
  });

  it("salvarRascunho deve lancar erro se alternativa nao pertence a questao", async () => {
    mockFindProvaAlunoContext.mockResolvedValue(makeContext());
    mockFindQuestaoDaProva.mockResolvedValue({ tipo: "multipla_escolha" });
    mockAlternativaBelongsToQuestao.mockResolvedValue(false);
    await expect(new RespostaAlunoService().salvarRascunho("pa-1", "q-1", { alternativaId: "alt-x" })).rejects.toThrow("Alternativa informada não pertence à questão.");
  });

  it("salvarRascunho deve lancar erro se discursiva tem alternativa", async () => {
    mockFindProvaAlunoContext.mockResolvedValue(makeContext());
    mockFindQuestaoDaProva.mockResolvedValue({ tipo: "discursiva" });
    await expect(new RespostaAlunoService().salvarRascunho("pa-1", "q-1", { alternativaId: "alt-x" })).rejects.toThrow("Questões discursivas não aceitam alternativa marcada.");
  });

  it("salvarRascunho deve lancar erro se discursiva sem texto", async () => {
    mockFindProvaAlunoContext.mockResolvedValue(makeContext());
    mockFindQuestaoDaProva.mockResolvedValue({ tipo: "discursiva" });
    await expect(new RespostaAlunoService().salvarRascunho("pa-1", "q-1", {})).rejects.toThrow("Questões discursivas exigem resposta textual.");
  });

  it("salvarRascunho deve lancar erro se resposta ultrapassa limite", async () => {
    mockFindProvaAlunoContext.mockResolvedValue(makeContext());
    mockFindQuestaoDaProva.mockResolvedValue({ tipo: "discursiva", limiteCaracteres: 5 });
    await expect(new RespostaAlunoService().salvarRascunho("pa-1", "q-1", { respostaTexto: "texto longo demais" })).rejects.toThrow("A resposta ultrapassa o limite de caracteres da questão.");
  });

  it("salvarRascunho deve salvar com sucesso", async () => {
    mockFindProvaAlunoContext.mockResolvedValue(makeContext());
    mockFindQuestaoDaProva.mockResolvedValue({ tipo: "discursiva" });
    mockUpsert.mockResolvedValue({ id: "resp-1" });
    const result = await new RespostaAlunoService().salvarRascunho("pa-1", "q-1", { respostaTexto: "minha resposta" });
    expect(result.id).toBe("resp-1");
  });

  it("enviarFinal deve lancar erro se prova nao encontrada", async () => {
    mockFindProvaAlunoContext.mockResolvedValue(null);
    await expect(new RespostaAlunoService().enviarFinal("pa-1")).rejects.toThrow("Prova do aluno não encontrada.");
  });

  it("enviarFinal deve lancar erro se markAsSubmitted retorna sem id", async () => {
    mockFindProvaAlunoContext.mockResolvedValue(makeContext());
    mockMarkAsSubmitted.mockResolvedValue({});
    await expect(new RespostaAlunoService().enviarFinal("pa-1")).rejects.toThrow("Prova do aluno não encontrada.");
  });
});
