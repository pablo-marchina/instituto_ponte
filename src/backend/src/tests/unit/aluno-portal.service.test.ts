import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { AlunoPortalService } from "../../services/aluno-portal.service.js";

const now = new Date("2026-06-01T12:00:00Z");
const prova = {
  id: "prova-1",
  titulo: "Prova",
  instrucoes: "Leia",
  tempoLimiteMin: 60,
  dataInicio: new Date("2026-06-01T11:00:00Z").toISOString(),
  dataFim: new Date("2026-06-01T13:00:00Z").toISOString(),
  status: "publicada",
};

const makeRepo = () => ({
  findPublicByUrl: jest.fn<any>().mockResolvedValue(prova),
  iniciarProva: jest.fn<any>().mockResolvedValue({ finalizada: false, provaAluno: { id: "pa-1", status: "em_andamento" } }),
  findQuestoesPublicas: jest.fn<any>().mockResolvedValue([{ id: "q-1" }]),
});

describe("AlunoPortalService - unitário", () => {
  let dateSpy: jest.SpiedFunction<typeof Date.now>;
  let repo: ReturnType<typeof makeRepo>;
  let service: AlunoPortalService;

  beforeEach(() => {
    dateSpy = jest.spyOn(Date, "now").mockReturnValue(now.getTime());
    repo = makeRepo();
    service = new AlunoPortalService(repo as any);
  });

  afterEach(() => dateSpy.mockRestore());

  it("deve retornar dados públicos quando prova está disponível", async () => {
    await expect(service.obterProvaPublica("url-1")).resolves.toEqual({
      titulo: "Prova",
      instrucoes: "Leia",
      tempoLimiteMin: 60,
      dataInicio: prova.dataInicio,
      dataFim: prova.dataFim,
      disponivel: true,
    });
  });

  it("deve iniciar prova e retornar provaAluno e questões", async () => {
    const result = await service.iniciarProva("url-1", { nome: "Aluno", email: "a@test.com", cpf: "12345678901", aceiteTermos: true } as any);

    expect(result).toMatchObject({
      provaAlunoId: "pa-1",
      status: "em_andamento",
      inicioEm: expect.any(String),
      expiraEm: expect.any(String),
      questoes: [{ id: "q-1" }],
    });
  });

  it("deve lançar notFound quando link não existe", async () => {
    repo.findPublicByUrl.mockResolvedValue(null);

    await expect(service.obterProvaPublica("x")).rejects.toThrow("Link de prova não encontrado.");
  });

  it("deve lançar conflict quando prova não está publicada", async () => {
    repo.findPublicByUrl.mockResolvedValue({ ...prova, status: "rascunho" });

    await expect(service.obterProvaPublica("url-1")).rejects.toThrow("Prova ainda não disponível ou encerrada.");
  });

  it("deve lançar conflict quando está fora do período", async () => {
    dateSpy.mockReturnValue(new Date("2026-06-01T14:00:00Z").getTime());

    await expect(service.obterProvaPublica("url-1")).rejects.toThrow("Prova ainda não disponível ou encerrada.");
  });

  it("deve bloquear nova tentativa quando já existe submissão final", async () => {
    repo.iniciarProva.mockResolvedValue({ finalizada: true, provaAluno: { id: "pa-1", status: "enviada" } });

    await expect(service.iniciarProva("url-1", {} as any)).rejects.toThrow("Já existe submissão final para esta prova e aluno.");
  });
});
