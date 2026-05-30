import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import type { FastifyRequest, FastifyReply } from "fastify";

const mockCreate = jest.fn<any>();
const mockListar = jest.fn<any>();
const mockBuscarPorId = jest.fn<any>();
const mockAtualizar = jest.fn<any>();
const mockAtualizarConfiguracoes = jest.fn<any>();
const mockPublicar = jest.fn<any>();
const mockEncerrar = jest.fn<any>();
const mockArquivar = jest.fn<any>();
const mockRemover = jest.fn<any>();
const mockListarHistorico = jest.fn<any>();

jest.unstable_mockModule("../../services/prova.service.js", () => ({
  ProvaService: jest.fn().mockImplementation(() => ({
    create: mockCreate,
    listar: mockListar,
    buscarPorId: mockBuscarPorId,
    atualizar: mockAtualizar,
    atualizarConfiguracoes: mockAtualizarConfiguracoes,
    publicar: mockPublicar,
    encerrar: mockEncerrar,
    arquivar: mockArquivar,
    remover: mockRemover,
    listarHistorico: mockListarHistorico,
  })),
}));

jest.unstable_mockModule("../../helpers/http.js", () => ({
  getAuthenticatedUser: jest.fn().mockReturnValue({ id: "prof-1", perfil: "professor" }),
  sendSuccess: jest.fn().mockImplementation((_reply, data, meta) => ({ success: true, data, meta })),
  sendCreated: jest.fn().mockImplementation((_reply, data) => ({ success: true, data })),
}));

type ProvaControllerModule = typeof import("../../controllers/prova.controller.js");
let ProvaController: ProvaControllerModule["ProvaController"];

beforeEach(async () => {
  jest.resetModules();
  const mocks = [mockCreate, mockListar, mockBuscarPorId, mockAtualizar, mockAtualizarConfiguracoes,
    mockPublicar, mockEncerrar, mockArquivar, mockRemover, mockListarHistorico];
  mocks.forEach((m) => m.mockReset());
  const mod = await import("../../controllers/prova.controller.js");
  ProvaController = mod.ProvaController;
});

const makeReq = (overrides: Record<string, unknown> = {}): FastifyRequest =>
  ({ params: {}, query: {}, body: {}, ...overrides }) as unknown as FastifyRequest;
const makeReply = (): FastifyReply =>
  ({ status: jest.fn<any>().mockReturnThis(), send: jest.fn<any>() }) as unknown as FastifyReply;

describe("ProvaController", () => {
  it("create deve criar prova", async () => {
    mockCreate.mockResolvedValue({ id: "prova-1" });
    const ctrl = new ProvaController();
    const result = await ctrl.create(makeReq({ body: { titulo: "Prova 1", materiaId: "mat-1" } }), makeReply());
    expect(result).toEqual({ success: true, data: { id: "prova-1" } });
  });

  it("listar deve listar provas", async () => {
    mockListar.mockResolvedValue({ data: [{ id: "prova-1" }], total: 1 });
    const ctrl = new ProvaController();
    const result = await ctrl.listar(makeReq({ query: { page: 1, limit: 10 } }), makeReply());
    expect(result.data).toEqual([{ id: "prova-1" }]);
    expect(result.meta.total).toBe(1);
  });

  it("buscarPorId deve retornar prova", async () => {
    mockBuscarPorId.mockResolvedValue({ id: "prova-1" });
    const ctrl = new ProvaController();
    const result = await ctrl.buscarPorId(makeReq({ params: { provaId: "prova-1" } }), makeReply());
    expect(result).toEqual({ success: true, data: { id: "prova-1" } });
  });

  it("atualizar deve atualizar prova", async () => {
    mockAtualizar.mockResolvedValue({ id: "prova-1", titulo: "Atualizado" });
    const ctrl = new ProvaController();
    const result = await ctrl.atualizar(makeReq({ params: { provaId: "prova-1" }, body: { titulo: "Atualizado" } }), makeReply());
    expect(result.data.titulo).toBe("Atualizado");
  });

  it("atualizarConfiguracoes deve atualizar configuracoes", async () => {
    mockAtualizarConfiguracoes.mockResolvedValue({ id: "prova-1", tempoLimiteMin: 60 });
    const ctrl = new ProvaController();
    const req = makeReq({ params: { provaId: "prova-1" }, body: { tempoLimiteMin: 60 } });
    const result = await ctrl.atualizarConfiguracoes(req, makeReply());
    expect(result.data.tempoLimiteMin).toBe(60);
  });

  it("publicar deve publicar prova", async () => {
    mockPublicar.mockResolvedValue({ id: "prova-1", status: "publicada" });
    const ctrl = new ProvaController();
    const result = await ctrl.publicar(makeReq({ params: { provaId: "prova-1" }, body: {} }), makeReply());
    expect(result.data.status).toBe("publicada");
  });

  it("encerrar deve encerrar prova", async () => {
    mockEncerrar.mockResolvedValue({ id: "prova-1", status: "encerrada" });
    const ctrl = new ProvaController();
    const result = await ctrl.encerrar(makeReq({ params: { provaId: "prova-1" } }), makeReply());
    expect(result.data.status).toBe("encerrada");
  });

  it("arquivar deve arquivar prova", async () => {
    mockArquivar.mockResolvedValue({ id: "prova-1", status: "antiga" });
    const ctrl = new ProvaController();
    const result = await ctrl.arquivar(makeReq({ params: { provaId: "prova-1" } }), makeReply());
    expect(result.data.status).toBe("antiga");
  });

  it("remover deve deletar prova e retornar 204", async () => {
    mockRemover.mockResolvedValue(undefined);
    const ctrl = new ProvaController();
    const reply = makeReply();
    await ctrl.remover(makeReq({ params: { provaId: "prova-1" } }), reply);
    expect(reply.status).toHaveBeenCalledWith(204);
  });

  it("listarHistorico deve listar historico", async () => {
    mockListarHistorico.mockResolvedValue([{ id: "hist-1", acao: "criou" }]);
    const ctrl = new ProvaController();
    const result = await ctrl.listarHistorico(makeReq({ params: { provaId: "prova-1" } }), makeReply());
    expect(result.data[0].acao).toBe("criou");
  });
});
