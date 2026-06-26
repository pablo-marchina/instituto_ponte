import { beforeEach, describe, expect, it, vi } from "vitest";

const apiRequest = vi.fn();
const apiRequestWithMeta = vi.fn();
const apiUpload = vi.fn();
const getAuthRequestOptions = vi.fn(() => ({ token: "token-1", role: "professor" }));
const getStoredAuthSession = vi.fn();

vi.mock("../lib/apiClient", () => ({
  apiRequest,
  apiRequestWithMeta,
  apiUpload,
}));

vi.mock("./auth/auth.request", () => ({
  getAuthRequestOptions,
}));

vi.mock("./auth/auth.storage", () => ({
  getStoredAuthSession,
}));

describe("feature API contracts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiRequest.mockResolvedValue({ ok: true });
    apiRequestWithMeta.mockResolvedValue({ data: [{ id: "1" }], meta: { total: 1 } });
    apiUpload.mockResolvedValue({ id: "anexo-1" });
    getAuthRequestOptions.mockReturnValue({ token: "token-1", role: "professor" });
    getStoredAuthSession.mockReturnValue(null);
    vi.stubGlobal("crypto", { randomUUID: () => "idempotency-1" });
  });

  it("chama endpoints publicos do fluxo do aluno com paths e idempotencia esperados", async () => {
    const alunoApi = await import("./aluno/aluno.api");
    const signal = new AbortController().signal;

    alunoApi.getProvaPublica("prova com espaco", signal);
    alunoApi.iniciarProva("prova/1", { cpf: "12345678901", nome: "Ada", email: "ada@example.com", aceiteTermos: true });
    alunoApi.listarRespostas("pa-1");
    alunoApi.salvarResposta("pa-1", "q-1", { respostaTexto: "resposta", rascunho: true });
    alunoApi.enviarProva("pa-1");

    expect(apiRequest).toHaveBeenNthCalledWith(1, "/public/provas/prova%20com%20espaco", { signal });
    expect(apiRequest).toHaveBeenNthCalledWith(2, "/public/provas/prova%2F1/iniciar", {
      method: "POST",
      headers: { "Idempotency-Key": "idempotency-1" },
      body: JSON.stringify({ cpf: "12345678901", nome: "Ada", email: "ada@example.com", aceiteTermos: true }),
    });
    expect(apiRequest).toHaveBeenNthCalledWith(3, "/public/provas-aluno/pa-1/respostas");
    expect(apiRequest).toHaveBeenNthCalledWith(4, "/public/provas-aluno/pa-1/respostas/q-1", {
      method: "PUT",
      body: JSON.stringify({ respostaTexto: "resposta", rascunho: true }),
    });
    expect(apiRequest).toHaveBeenNthCalledWith(5, "/public/provas-aluno/pa-1/enviar", {
      method: "POST",
      headers: { "Idempotency-Key": "idempotency-1" },
      body: JSON.stringify({ confirmarEnvio: true }),
    });
  });

  it("nao comprime arquivos que nao sao imagem antes do upload de anexo", async () => {
    const alunoApi = await import("./aluno/aluno.api");
    const file = new File(["pdf"], "resposta.pdf", { type: "application/pdf" });

    await alunoApi.uploadAnexo("resposta-1", file);

    expect(apiUpload).toHaveBeenCalledWith(
      "/public/respostas/resposta-1/anexos",
      expect.any(FormData),
    );
    const formData = apiUpload.mock.calls[0][1] as FormData;
    expect(formData.get("file")).toBe(file);
  });

  it("comprime imagem grande antes do upload quando o canvas gera arquivo menor", async () => {
    const alunoApi = await import("./aluno/aluno.api");
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const originalImage = globalThis.Image;
    const originalCreateElement = document.createElement.bind(document);
    const file = new File([new Uint8Array(2048)], "resposta.png", { type: "image/png" });
    let loadedSrc = "";

    URL.createObjectURL = vi.fn(() => "blob:imagem");
    URL.revokeObjectURL = vi.fn();
    globalThis.Image = class {
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;
      naturalWidth = 3200;
      naturalHeight = 1600;
      private _src = "";
      set src(value: string) {
        this._src = value;
        loadedSrc = value;
        queueMicrotask(() => this.onload?.());
      }
      get src() {
        return this._src;
      }
    } as unknown as typeof Image;
    const createElementSpy = vi.spyOn(document, "createElement").mockImplementation(((tagName: string, options?: ElementCreationOptions) => {
      if (tagName === "canvas") {
        return {
          width: 0,
          height: 0,
          getContext: () => ({ drawImage: vi.fn() }),
          toBlob: (callback: BlobCallback) => callback(new Blob(["small"], { type: "image/jpeg" })),
        } as unknown as HTMLCanvasElement;
      }
      return originalCreateElement(tagName, options);
    }) as typeof document.createElement);

    await alunoApi.uploadAnexo("resposta-img", file);

    const formData = apiUpload.mock.calls.at(-1)?.[1] as FormData;
    const uploaded = formData.get("file") as File;
    expect(loadedSrc).toBe("blob:imagem");
    expect(uploaded.name).toBe("resposta.jpg");
    expect(uploaded.type).toBe("image/jpeg");

    URL.createObjectURL = originalCreateObjectUrl;
    URL.revokeObjectURL = originalRevokeObjectUrl;
    globalThis.Image = originalImage;
    createElementSpy.mockRestore();
  });

  it("mantem imagem original quando canvas nao esta disponivel ou compressao falha", async () => {
    const alunoApi = await import("./aluno/aluno.api");
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const originalImage = globalThis.Image;
    const originalCreateElement = document.createElement.bind(document);
    const file = new File([new Uint8Array(64)], "foto.jpg", { type: "image/jpeg" });

    URL.createObjectURL = vi.fn(() => "blob:foto");
    URL.revokeObjectURL = vi.fn();
    globalThis.Image = class {
      onload: null | (() => void) = null;
      naturalWidth = 100;
      naturalHeight = 80;
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    } as unknown as typeof Image;
    const createElementSpy = vi.spyOn(document, "createElement").mockImplementation(((tagName: string, options?: ElementCreationOptions) => {
      if (tagName === "canvas") {
        return { getContext: () => null } as unknown as HTMLCanvasElement;
      }
      return originalCreateElement(tagName, options);
    }) as typeof document.createElement);

    await alunoApi.uploadAnexo("resposta-img-original", file);

    const formData = apiUpload.mock.calls.at(-1)?.[1] as FormData;
    expect(formData.get("file")).toBe(file);

    URL.createObjectURL = originalCreateObjectUrl;
    URL.revokeObjectURL = originalRevokeObjectUrl;
    globalThis.Image = originalImage;
    createElementSpy.mockRestore();
  });

  it("mantem imagem original quando a imagem falha ou o blob comprimido nao reduz tamanho", async () => {
    const alunoApi = await import("./aluno/aluno.api");
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const originalImage = globalThis.Image;
    const originalCreateElement = document.createElement.bind(document);

    URL.createObjectURL = vi.fn(() => "blob:erro");
    URL.revokeObjectURL = vi.fn();
    globalThis.Image = class {
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;
      set src(_value: string) {
        queueMicrotask(() => this.onerror?.());
      }
    } as unknown as typeof Image;

    await expect(alunoApi.uploadAnexo(
      "resposta-img-erro",
      new File([new Uint8Array(64)], "foto-erro.jpg", { type: "image/jpeg" }),
    )).rejects.toThrow("processar a imagem");

    globalThis.Image = class {
      onload: null | (() => void) = null;
      naturalWidth = 4000;
      naturalHeight = 3000;
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    } as unknown as typeof Image;
    const file = new File([new Uint8Array(4)], "foto-pequena.png", { type: "image/png" });
    const createElementSpy = vi.spyOn(document, "createElement").mockImplementation(((tagName: string, options?: ElementCreationOptions) => {
      if (tagName === "canvas") {
        return {
          width: 0,
          height: 0,
          getContext: () => ({ drawImage: vi.fn() }),
          toBlob: (callback: BlobCallback) => callback(new Blob([new Uint8Array(16)], { type: "image/jpeg" })),
        } as unknown as HTMLCanvasElement;
      }
      return originalCreateElement(tagName, options);
    }) as typeof document.createElement);

    await alunoApi.uploadAnexo("resposta-img-maior", file);

    const formData = apiUpload.mock.calls.at(-1)?.[1] as FormData;
    expect(formData.get("file")).toBe(file);

    URL.createObjectURL = originalCreateObjectUrl;
    URL.revokeObjectURL = originalRevokeObjectUrl;
    globalThis.Image = originalImage;
    createElementSpy.mockRestore();
  });

  it("propaga erro quando canvas nao retorna blob", async () => {
    const alunoApi = await import("./aluno/aluno.api");
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const originalImage = globalThis.Image;
    const originalCreateElement = document.createElement.bind(document);

    URL.createObjectURL = vi.fn(() => "blob:nulo");
    URL.revokeObjectURL = vi.fn();
    globalThis.Image = class {
      onload: null | (() => void) = null;
      naturalWidth = 4000;
      naturalHeight = 3000;
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    } as unknown as typeof Image;
    const createElementSpy = vi.spyOn(document, "createElement").mockImplementation(((tagName: string, options?: ElementCreationOptions) => {
      if (tagName === "canvas") {
        return {
          width: 0,
          height: 0,
          getContext: () => ({ drawImage: vi.fn() }),
          toBlob: (callback: BlobCallback) => callback(null),
        } as unknown as HTMLCanvasElement;
      }
      return originalCreateElement(tagName, options);
    }) as typeof document.createElement);

    await expect(alunoApi.uploadAnexo(
      "resposta-img-blob-nulo",
      new File([new Uint8Array(64)], "foto-nula.png", { type: "image/png" }),
    )).rejects.toThrow("comprimir a imagem");

    URL.createObjectURL = originalCreateObjectUrl;
    URL.revokeObjectURL = originalRevokeObjectUrl;
    globalThis.Image = originalImage;
    createElementSpy.mockRestore();
  });

  it("lista recursos paginados com opcoes autenticadas", async () => {
    const { listAlunos } = await import("./alunos/alunos.api");
    const { listMaterias } = await import("./materias/materias.api");
    const { listProfessores } = await import("./professores/professores.api");

    await expect(listAlunos()).resolves.toEqual({ data: [{ id: "1" }], meta: { total: 1 } });
    await expect(listMaterias()).resolves.toEqual({ data: [{ id: "1" }], meta: { total: 1 } });
    await expect(listProfessores()).resolves.toEqual({ data: [{ id: "1" }], meta: { total: 1 } });

    expect(apiRequestWithMeta).toHaveBeenCalledWith("/alunos?limit=100", { token: "token-1", role: "professor" });
    expect(apiRequestWithMeta).toHaveBeenCalledWith("/materias?limit=100", { token: "token-1", role: "professor" });
    expect(apiRequestWithMeta).toHaveBeenCalledWith("/professores?limit=100", { token: "token-1", role: "professor" });
  });

  it("usa rotas de coordenador ao listar provas com sessao de coordenador", async () => {
    const { listProvas } = await import("./provas/provas.api");
    getStoredAuthSession.mockReturnValue({ usuario: { perfil: "coordenador" } });

    await listProvas();

    expect(apiRequestWithMeta).toHaveBeenCalledWith("/coordenador/provas?limit=100", {
      token: "token-1",
      role: "professor",
    });
  });

  it("executa mutacoes administrativas com metodo e payload corretos", async () => {
    const alunos = await import("./alunos/alunos.api");
    const professores = await import("./professores/professores.api");
    const provas = await import("./provas/provas.api");
    const questoes = await import("./questoes/questoes.api");
    const temas = await import("./temas/temas.api");
    const correcao = await import("./correcao/correcao.api");
    const emails = await import("./emails/emails.api");
    const resultados = await import("./resultados/resultados.api");
    const anexos = await import("./anexos/anexos.api");
    const analytics = await import("./analytics/analytics.api");

    alunos.getAluno("a1");
    alunos.updateAluno("a1", { nome: "Aluno" });
    alunos.deleteAluno("a1");
    professores.createProfessor({ nome: "Prof", email: "p@x.com", coordenadorId: "coord1" });
    professores.updateProfessor("p1", { nome: "Prof 2" });
    professores.deleteProfessor("p1");
    professores.getProfessor("p1");
    professores.listProfessorMaterias("p1");
    professores.vincularProfessorMateria("p1", "m1");
    professores.removerProfessorMateria("p1", "m1");
    provas.createProva({ titulo: "P", materiaId: "m1", turma: "A", semestre: "2026.1", modalidade: "online" });
    provas.updateProva("prova1", { titulo: "P2" });
    provas.updateProvaConfiguracoes("prova1", { tempoLimiteMin: 60 });
    provas.publicarProva("prova1", { baseUrlAluno: "http://localhost:5173/aluno/prova", dataFim: "2026-07-01T15:00:00.000Z" });
    provas.getProva("prova1");
    provas.arquivarProva("prova1");
    provas.listProvaQuestoes("prova1");
    provas.addQuestaoToProva("prova1", { questaoId: "q1", ordemOriginal: 1, pontuacaoMax: 2 });
    provas.removeQuestaoFromProva("prova1", "q1");
    questoes.listQuestoes({ materiaId: "m1", tipo: "discursiva", busca: "limite", ativa: false });
    questoes.createQuestao({ materiaId: "m1", tipo: "discursiva", enunciado: { conteudoLatex: "Q", urlImagem: null }, alternativas: [] });
    questoes.updateQuestao("q1", { pontuacaoPadrao: 2 });
    questoes.deleteQuestao("q1");
    temas.listTemas({ materiaId: "m1" });
    temas.createTema({ materiaId: "m1", nome: "Tema" });
    temas.updateTema("t1", { nome: "Tema 2" });
    temas.deleteTema("t1");
    correcao.listarQuestoesCorrecao("prova1");
    correcao.executarCorrecaoAutomatica("prova1");
    correcao.listarRespostasPorQuestao("prova1", "q1");
    correcao.salvarCorrecao("r1", { nota: 8, observacao: "ok" });
    emails.liberarEmailsResultado("prova1", true);
    emails.listarEmailsProva("prova1");
    emails.reenviarEmailResultado("email1");
    resultados.exportarResultados("prova1", { formato: "csv" });
    anexos.exportarAnexosProva("prova1");
    analytics.getProvaAnalytics("prova1");

    expect(apiRequest).toHaveBeenCalledWith("/alunos/a1", { token: "token-1", role: "professor" });
    expect(apiRequest).toHaveBeenCalledWith("/alunos/a1", expect.objectContaining({ method: "PUT", body: JSON.stringify({ nome: "Aluno" }) }));
    expect(apiRequest).toHaveBeenCalledWith("/alunos/a1", expect.objectContaining({ method: "DELETE" }));
    expect(apiRequest).toHaveBeenCalledWith("/professores", expect.objectContaining({ method: "POST" }));
    expect(apiRequest).toHaveBeenCalledWith("/professores/p1/materias", expect.objectContaining({ method: "POST", body: JSON.stringify({ materiaId: "m1" }) }));
    expect(apiRequest).toHaveBeenCalledWith("/provas/prova1/configuracoes", expect.objectContaining({ method: "PATCH" }));
    expect(apiRequest).toHaveBeenCalledWith("/provas/prova1/questoes/q1", expect.objectContaining({ method: "DELETE" }));
    expect(apiRequestWithMeta).toHaveBeenCalledWith("/questoes?limit=100&ativa=false&materiaId=m1&tipo=discursiva&busca=limite", { token: "token-1", role: "professor" });
    expect(apiRequestWithMeta).toHaveBeenCalledWith("/temas?limit=100&materiaId=m1", { token: "token-1", role: "professor" });
    expect(apiRequest).toHaveBeenCalledWith("/provas/prova1/correcao/objetivas", expect.objectContaining({ method: "POST" }));
    expect(apiRequest).toHaveBeenCalledWith("/provas/prova1/resultados/liberar-email", expect.objectContaining({ method: "POST", body: JSON.stringify({ confirmarPendencias: true }) }));
    expect(apiRequest).toHaveBeenCalledWith("/provas/prova1/resultados/exportar", expect.objectContaining({ method: "POST", body: JSON.stringify({ formato: "csv" }) }));
    expect(apiRequest).toHaveBeenCalledWith("/provas/prova1/anexos/exportar", expect.objectContaining({ method: "POST" }));
    expect(apiRequest).toHaveBeenCalledWith("/provas/prova1/analytics", { token: "token-1", role: "professor" });
  });
});
