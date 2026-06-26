import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { RespostaAlunoService } from "../../services/resposta-aluno.service.js";

const context = {
  status: "em_andamento",
  provaStatus: "publicada",
  dataInicio: new Date("2026-06-01T11:00:00Z").toISOString(),
  dataFim: new Date("2026-06-01T13:00:00Z").toISOString(),
};

const makeRepo = () => ({
  findProvaAlunoContext: jest.fn<any>().mockResolvedValue(context),
  findQuestaoDaProva: jest.fn<any>().mockResolvedValue({ tipo: "multipla_escolha" }),
  alternativaBelongsToQuestao: jest.fn<any>().mockResolvedValue(true),
  upsert: jest.fn<any>().mockResolvedValue({ id: "resp-1" }),
  findByProvaAluno: jest.fn<any>().mockResolvedValue([{ id: "resp-1" }]),
  markAsSubmitted: jest.fn<any>().mockResolvedValue({ provaAlunoId: "pa-1", questoesEmBranco: [] }),
});

describe("RespostaAlunoService - unitário", () => {
  let dateSpy: jest.SpiedFunction<typeof Date.now>;

  beforeEach(() => {
    dateSpy = jest.spyOn(Date, "now").mockReturnValue(new Date("2026-06-01T12:00:00Z").getTime());
  });

  afterEach(() => dateSpy.mockRestore());

  it("deve salvar resposta objetiva válida", async () => {
    const service = new RespostaAlunoService(makeRepo() as any);

    await expect(service.salvarRascunho("pa-1", "q-1", { alternativaId: "alt-1" } as any)).resolves.toEqual({ id: "resp-1" });
  });

  it("deve validar questão objetiva", async () => {
    const repo = makeRepo();
    const service = new RespostaAlunoService(repo as any);

    await expect(service.salvarRascunho("pa-1", "q-1", {} as any)).rejects.toThrow("Questões objetivas exigem alternativa marcada.");

    repo.alternativaBelongsToQuestao.mockResolvedValue(false);
    await expect(service.salvarRascunho("pa-1", "q-1", { alternativaId: "alt-x" } as any)).rejects.toThrow("Alternativa informada não pertence à questão.");
  });

  it("deve validar questão discursiva", async () => {
    const repo = makeRepo();
    repo.findQuestaoDaProva.mockResolvedValue({ tipo: "discursiva", limiteCaracteres: 5 });
    const service = new RespostaAlunoService(repo as any);

    await expect(service.salvarRascunho("pa-1", "q-1", { alternativaId: "alt-1" } as any)).rejects.toThrow("Questões discursivas não aceitam alternativa marcada.");
    await expect(service.salvarRascunho("pa-1", "q-1", {} as any)).rejects.toThrow("Questões discursivas exigem resposta textual.");
    await expect(service.salvarRascunho("pa-1", "q-1", { respostaTexto: "muito grande" } as any)).rejects.toThrow("A resposta ultrapassa o limite de caracteres da questão.");
  });

  it("deve listar respostas e enviar prova final", async () => {
    const service = new RespostaAlunoService(makeRepo() as any);

    await expect(service.listarRespostas("pa-1")).resolves.toEqual([{ id: "resp-1" }]);
    await expect(service.enviarFinal("pa-1")).resolves.toEqual({ provaAlunoId: "pa-1", questoesEmBranco: [] });
  });

  it("deve bloquear prova inexistente, status inválido e período inválido", async () => {
    const repo = makeRepo();
    const service = new RespostaAlunoService(repo as any);

    repo.findProvaAlunoContext.mockResolvedValueOnce(null);
    await expect(service.listarRespostas("x")).rejects.toThrow("Prova do aluno não encontrada.");

    repo.findProvaAlunoContext.mockResolvedValueOnce({ ...context, status: "enviada" });
    await expect(service.salvarRascunho("pa-1", "q-1", {} as any)).rejects.toThrow("A prova do aluno não está em andamento.");

    repo.findProvaAlunoContext.mockResolvedValueOnce({ ...context, provaStatus: "rascunho" });
    await expect(service.salvarRascunho("pa-1", "q-1", {} as any)).rejects.toThrow("Prova indisponível para resposta.");

    dateSpy.mockReturnValue(new Date("2026-06-01T14:00:00Z").getTime());
    await expect(service.salvarRascunho("pa-1", "q-1", {} as any)).rejects.toThrow("Prova fora do período de resposta.");
  });
});
