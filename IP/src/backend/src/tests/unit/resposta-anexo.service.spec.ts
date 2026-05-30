import { describe, expect, it, jest, beforeEach } from "@jest/globals";

const mockFindRespostaContext = jest.fn<any>();
const mockCreateAnexo = jest.fn<any>();
const mockLogCreate = jest.fn<any>();

jest.unstable_mockModule("../../repositories/resposta-anexo.repository.js", () => ({
  RespostaAnexoRepository: jest.fn().mockImplementation(() => ({
    findRespostaContext: mockFindRespostaContext,
    create: mockCreateAnexo,
  })),
}));

jest.unstable_mockModule("../../repositories/avaliacao-log.repository.js", () => ({
  AvaliacaoLogRepository: jest.fn().mockImplementation(() => ({
    create: mockLogCreate,
  })),
}));

type RespostaAnexoServiceModule = typeof import("../../services/resposta-anexo.service.js");
let RespostaAnexoService: RespostaAnexoServiceModule["RespostaAnexoService"];

const makeContext = (overrides: Record<string, unknown> = {}) => ({
  respostaId: "resp-1",
  provaAlunoId: "pa-1",
  provaId: "prova-1",
  provaAlunoStatus: "em_andamento",
  provaStatus: "publicada",
  dataInicio: new Date(Date.now() - 3600000).toISOString(),
  dataFim: new Date(Date.now() + 3600000).toISOString(),
  permiteAnexo: true,
  ...overrides,
});

const makeFile = (overrides: Record<string, unknown> = {}) => ({
  filename: "anexo.pdf",
  mimeType: "application/pdf",
  content: Buffer.from("conteudo do arquivo"),
  ...overrides,
});

beforeEach(async () => {
  jest.resetModules();
  [mockFindRespostaContext, mockCreateAnexo, mockLogCreate].forEach((m) => m.mockReset());
  const mod = await import("../../services/resposta-anexo.service.js");
  RespostaAnexoService = mod.RespostaAnexoService;
});

describe("RespostaAnexoService", () => {
  it("salvarAnexo deve lancar erro se resposta nao encontrada", async () => {
    mockFindRespostaContext.mockResolvedValue(null);
    await expect(new RespostaAnexoService().salvarAnexo("resp-x", makeFile())).rejects.toThrow("Resposta não encontrada.");
  });

  it("salvarAnexo deve lancar erro se prova aluno nao esta em andamento", async () => {
    mockFindRespostaContext.mockResolvedValue(makeContext({ provaAlunoStatus: "enviada" }));
    await expect(new RespostaAnexoService().salvarAnexo("resp-1", makeFile())).rejects.toThrow("A prova do aluno não está em andamento.");
  });

  it("salvarAnexo deve lancar erro se prova indisponivel", async () => {
    mockFindRespostaContext.mockResolvedValue(makeContext({ provaStatus: "encerrada" }));
    await expect(new RespostaAnexoService().salvarAnexo("resp-1", makeFile())).rejects.toThrow("Prova indisponível para upload de anexo.");
  });

  it("salvarAnexo deve lancar erro se fora do periodo", async () => {
    mockFindRespostaContext.mockResolvedValue(makeContext({
      dataInicio: new Date(Date.now() + 86400000).toISOString(),
    }));
    await expect(new RespostaAnexoService().salvarAnexo("resp-1", makeFile())).rejects.toThrow("Prova fora do período de resposta.");
  });

  it("salvarAnexo deve lancar erro se questao nao permite anexo", async () => {
    mockFindRespostaContext.mockResolvedValue(makeContext({ permiteAnexo: false }));
    await expect(new RespostaAnexoService().salvarAnexo("resp-1", makeFile())).rejects.toThrow("A questão respondida não permite anexo.");
  });

  it("salvarAnexo deve lancar erro se mime type invalido", async () => {
    mockFindRespostaContext.mockResolvedValue(makeContext());
    await expect(new RespostaAnexoService().salvarAnexo("resp-1", makeFile({ mimeType: "text/plain" }))).rejects.toThrow("Tipo de arquivo inválido.");
  });

  it("salvarAnexo deve lancar erro se arquivo vazio", async () => {
    mockFindRespostaContext.mockResolvedValue(makeContext());
    await expect(new RespostaAnexoService().salvarAnexo("resp-1", makeFile({ content: Buffer.alloc(0) }))).rejects.toThrow("Arquivo deve ter até 5MB.");
  });

  it("salvarAnexo deve criar anexo com sucesso", async () => {
    mockFindRespostaContext.mockResolvedValue(makeContext());
    mockCreateAnexo.mockResolvedValue({ id: "anexo-1" });
    const result = await new RespostaAnexoService().salvarAnexo("resp-1", makeFile());
    expect(result.id).toBe("anexo-1");
  });

  it("salvarAnexo deve logar erro se falhar e continuar lancando", async () => {
    mockFindRespostaContext.mockResolvedValue(null);
    mockLogCreate.mockResolvedValue(undefined);
    await expect(new RespostaAnexoService().salvarAnexo("resp-x", makeFile())).rejects.toThrow("Resposta não encontrada.");
  });

  it("salvarAnexo deve limpar nome de arquivo com caracteres seguros", async () => {
    mockFindRespostaContext.mockResolvedValue(makeContext());
    mockCreateAnexo.mockResolvedValue({ id: "anexo-1" });
    await new RespostaAnexoService().salvarAnexo("resp-1", makeFile({ filename: "../../malicious.exe" }));
    expect(mockCreateAnexo.mock.calls[0][0].nomeArquivo).toBe(".._.._malicious.exe");
  });
});
