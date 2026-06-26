import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { RespostaAnexoService } from "../../services/resposta-anexo.service.js";

const context = {
  provaId: "prova-1",
  provaAlunoId: "pa-1",
  provaAlunoStatus: "em_andamento",
  provaStatus: "publicada",
  dataInicio: new Date("2026-06-01T11:00:00Z").toISOString(),
  dataFim: new Date("2026-06-01T13:00:00Z").toISOString(),
  inicioEm: new Date("2026-06-01T11:30:00Z").toISOString(),
  tempoLimiteMin: 90,
  permiteAnexo: true,
};

const file = {
  filename: "minha prova.pdf",
  mimeType: "application/pdf",
  content: Buffer.from("arquivo"),
};

const makeRepo = () => ({
  findRespostaContext: jest.fn<any>().mockResolvedValue(context),
  create: jest.fn<any>().mockResolvedValue({ id: "anexo-1" }),
});

const makeLog = () => ({
  create: jest.fn<any>().mockResolvedValue({ id: "log-1" }),
});

describe("RespostaAnexoService - unitário", () => {
  let dateSpy: jest.SpiedFunction<typeof Date.now>;

  beforeEach(() => {
    dateSpy = jest.spyOn(Date, "now").mockReturnValue(new Date("2026-06-01T12:00:00Z").getTime());
  });

  afterEach(() => dateSpy.mockRestore());

  it("deve salvar anexo válido com nome sanitizado", async () => {
    const repo = makeRepo();
    const service = new RespostaAnexoService(repo as any, makeLog() as any);

    await expect(service.salvarAnexo("resp-1", file as any)).resolves.toEqual({ id: "anexo-1" });
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
      respostaId: "resp-1",
      nomeArquivo: "minha_prova.pdf",
      mimeType: "application/pdf",
      tamanhoBytes: file.content.length,
    }));
  });

  it("deve registrar log e lançar notFound quando resposta não existe", async () => {
    const repo = makeRepo();
    const log = makeLog();
    repo.findRespostaContext.mockResolvedValue(null);
    const service = new RespostaAnexoService(repo as any, log as any);

    await expect(service.salvarAnexo("x", file as any)).rejects.toThrow("Resposta não encontrada.");
    expect(log.create).toHaveBeenCalledWith(expect.objectContaining({
      atorTipo: "aluno",
      acao: "upload_falhou",
    }));
  });

  it("deve bloquear status, disponibilidade, período e permissão de anexo", async () => {
    const repo = makeRepo();
    const service = new RespostaAnexoService(repo as any, makeLog() as any);

    repo.findRespostaContext.mockResolvedValueOnce({ ...context, provaAlunoStatus: "enviada" });
    await expect(service.salvarAnexo("resp-1", file as any)).rejects.toThrow("A prova do aluno não está em andamento.");

    repo.findRespostaContext.mockResolvedValueOnce({ ...context, provaStatus: "rascunho" });
    await expect(service.salvarAnexo("resp-1", file as any)).rejects.toThrow("Prova indisponível para upload de anexo.");

    dateSpy.mockReturnValue(new Date("2026-06-01T14:00:00Z").getTime());
    await expect(service.salvarAnexo("resp-1", file as any)).rejects.toThrow("Prova fora do período de resposta.");

    dateSpy.mockReturnValue(new Date("2026-06-01T12:00:00Z").getTime());
    repo.findRespostaContext.mockResolvedValueOnce({ ...context, permiteAnexo: false });
    await expect(service.salvarAnexo("resp-1", file as any)).rejects.toThrow("A questão respondida não permite anexo.");
  });

  it("deve bloquear upload depois do limite individual da tentativa", async () => {
    const repo = makeRepo();
    repo.findRespostaContext.mockResolvedValue({
      ...context,
      dataFim: new Date("2026-06-01T15:00:00Z").toISOString(),
      inicioEm: new Date("2026-06-01T11:00:00Z").toISOString(),
      tempoLimiteMin: 30,
    });
    dateSpy.mockReturnValue(new Date("2026-06-01T11:31:00Z").getTime());
    const service = new RespostaAnexoService(repo as any, makeLog() as any);

    await expect(service.salvarAnexo("resp-1", file as any)).rejects.toThrow("Prova fora do período de resposta.");
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("deve rejeitar MIME inválido e tamanho inválido", async () => {
    const service = new RespostaAnexoService(makeRepo() as any, makeLog() as any);

    await expect(service.salvarAnexo("resp-1", { ...file, mimeType: "text/plain" } as any)).rejects.toThrow("Tipo de arquivo inválido.");
    await expect(service.salvarAnexo("resp-1", { ...file, content: Buffer.alloc(0) } as any)).rejects.toThrow("Arquivo deve ter até 5MB.");
    await expect(service.salvarAnexo("resp-1", { ...file, content: Buffer.alloc(5 * 1024 * 1024 + 1) } as any)).rejects.toThrow("Arquivo deve ter até 5MB.");
  });
});
