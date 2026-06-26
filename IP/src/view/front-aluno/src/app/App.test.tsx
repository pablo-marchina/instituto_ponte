import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const {
  enviarProva,
  getProvaPublica,
  iniciarProva,
  listarRespostas,
  salvarResposta,
  uploadAnexo,
} = vi.hoisted(() => ({
  enviarProva: vi.fn(),
  getProvaPublica: vi.fn(),
  iniciarProva: vi.fn(),
  listarRespostas: vi.fn(),
  salvarResposta: vi.fn(),
  uploadAnexo: vi.fn(),
}));

vi.mock("../../../src/features/aluno/aluno.api", () => ({
  enviarProva,
  getProvaPublica,
  iniciarProva,
  listarRespostas,
  salvarResposta,
  uploadAnexo,
}));

function setPath(path: string) {
  window.history.pushState({}, "", path);
}

function renderAlunoApp() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
}

const provaPublica = {
  titulo: "Prova publica",
  instrucoes: "Leia tudo antes de começar.",
  tempoLimiteMin: 30,
  dataInicio: "2026-06-16T10:00:00.000Z",
  dataFim: "2026-06-16T11:00:00.000Z",
  disponivel: true,
};

const questoes = [
  {
    id: "q1",
    ordem: 1,
    tipo: "multipla_escolha",
    permiteAnexo: false,
    enunciado: { conteudoLatex: "Quanto e 2 + 2?", urlImagem: null },
    alternativas: [
      { id: "a1", ordem: 1, conteudoLatex: "3", urlImagem: null },
      { id: "a2", ordem: 2, conteudoLatex: "4", urlImagem: null },
    ],
  },
  {
    id: "q2",
    ordem: 2,
    tipo: "discursiva",
    permiteAnexo: true,
    enunciado: { conteudoLatex: "Explique sua resposta", urlImagem: null },
    alternativas: [],
  },
] as const;

describe("front aluno App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getProvaPublica.mockResolvedValue(provaPublica);
    iniciarProva.mockResolvedValue({
      provaAlunoId: "pa-1",
      status: "em_andamento",
      inicioEm: "2026-06-16T10:00:00.000Z",
      expiraEm: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      questoes,
    });
    listarRespostas.mockResolvedValue([]);
    salvarResposta.mockResolvedValue({
      id: "resposta-1",
      sincronizadaEm: "2026-06-16T10:01:00.000Z",
      rascunho: true,
    });
    enviarProva.mockResolvedValue({
      provaAlunoId: "pa-1",
      status: "enviada",
      enviadaEm: "2026-06-16T10:20:00.000Z",
      questoesEmBranco: [],
    });
    uploadAnexo.mockResolvedValue({ id: "anexo-1" });
  });

  afterEach(() => {
    cleanup();
  });

  it("mostra erro quando link publico nao existe na URL", () => {
    setPath("/aluno");

    renderAlunoApp();

    expect(screen.getByText("Link inválido")).toBeInTheDocument();
    expect(screen.getByText(/link ou QR Code/i)).toBeInTheDocument();
    expect(getProvaPublica).not.toHaveBeenCalled();
  });

  it("mostra erro controlado quando API publica falha", async () => {
    setPath("/aluno/prova/link-com-erro");
    getProvaPublica.mockRejectedValue(new Error("Prova indisponivel"));

    renderAlunoApp();

    expect(await screen.findByText("Não foi possível abrir a prova")).toBeInTheDocument();
    expect(screen.getByText("Prova indisponivel")).toBeInTheDocument();
  });

  it("inicia prova, responde, revisa pre-entrega e envia", async () => {
    const user = userEvent.setup();
    setPath("/aluno/prova/link-publico");

    renderAlunoApp();

    expect(await screen.findByText(/como acessar/i)).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText(/nome completo/i), "Ada Lovelace");
    await user.type(screen.getByPlaceholderText(/email/i), "ada@example.com");
    await user.type(screen.getByPlaceholderText("000.000.000-00"), "12345678901");
    await user.click(screen.getByRole("button", { name: /continuar/i }));

    await waitFor(() => expect(iniciarProva).toHaveBeenCalledWith("link-publico", {
      aceiteTermos: true,
      cpf: "12345678901",
      email: "ada@example.com",
      nome: "Ada Lovelace",
    }));
    expect(await screen.findByText("Leia tudo antes de começar.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /come.ar a prova/i }));
    expect(await screen.findByText("Quanto e 2 + 2?")).toBeInTheDocument();

    await user.click(screen.getByText("4"));
    await waitFor(() => expect(salvarResposta).toHaveBeenCalledWith("pa-1", "q1", {
      alternativaId: "a2",
      rascunho: true,
    }));

    await user.click(screen.getByRole("button", { name: /avan.ar/i }));
    await user.type(screen.getByPlaceholderText(/digite aqui sua resposta/i), "Porque 2 + 2 soma quatro.");
    await user.click(screen.getByRole("button", { name: /finalizar/i }));

    expect(await screen.findByRole("heading", { name: /revis.o pr.-entrega/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /confirmar envio/i }));
    expect(screen.getByText(/aten..o.*envio .nico/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /finalizar e enviar/i }));

    await waitFor(() => expect(enviarProva).toHaveBeenCalledWith("pa-1"));
    expect(await screen.findByText(/enviada com sucesso/i)).toBeInTheDocument();
  }, 15_000);

  it("marca questao, abre revisao e volta para a prova", async () => {
    const user = userEvent.setup();
    setPath("/aluno/prova/link-publico");

    renderAlunoApp();

    await user.type(await screen.findByPlaceholderText(/nome completo/i), "Ada Lovelace");
    await user.type(screen.getByPlaceholderText(/email/i), "ada@example.com");
    await user.type(screen.getByPlaceholderText("000.000.000-00"), "12345678901");
    await user.click(screen.getByRole("button", { name: /continuar/i }));
    await user.click(await screen.findByRole("button", { name: /come.ar a prova/i }));

    await user.click(screen.getByText(/marcar para revisar/i));
    await user.click(screen.getByRole("button", { name: /finalizar/i }));

    expect(await screen.findByRole("heading", { name: /revis.o pr.-entrega/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /quest.o 1/i }));
    expect(await screen.findByText("Quanto e 2 + 2?")).toBeInTheDocument();
  }, 15_000);

  it("salva discursiva antes de abrir seletor e envia anexo selecionado", async () => {
    const user = userEvent.setup();
    const click = vi.fn(function click(this: HTMLInputElement) {
      Object.defineProperty(this, "files", {
        configurable: true,
        value: [new File(["conteudo"], "resolucao.pdf", { type: "application/pdf" })],
      });
      this.onchange?.(new Event("change"));
    });
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName, options) => {
      const element = originalCreateElement(tagName, options);
      if (tagName.toLowerCase() === "input") {
        Object.defineProperty(element, "click", { configurable: true, value: click });
      }
      return element;
    });
    salvarResposta.mockResolvedValueOnce({
      id: "resposta-discursiva",
      sincronizadaEm: "2026-06-16T10:01:00.000Z",
      rascunho: true,
    });
    setPath("/aluno/prova/link-publico");

    renderAlunoApp();

    await user.type(await screen.findByPlaceholderText(/nome completo/i), "Ada Lovelace");
    await user.type(screen.getByPlaceholderText(/email/i), "ada@example.com");
    await user.type(screen.getByPlaceholderText("000.000.000-00"), "12345678901");
    await user.click(screen.getByRole("button", { name: /continuar/i }));
    await user.click(await screen.findByRole("button", { name: /come.ar a prova/i }));
    await user.click(screen.getByRole("button", { name: /avan.ar/i }));
    await user.type(screen.getByPlaceholderText(/digite aqui sua resposta/i), "Texto para anexar");
    await user.click(screen.getByRole("button", { name: /anexar/i }));

    await waitFor(() => expect(click).toHaveBeenCalled());
    await waitFor(() => expect(uploadAnexo).toHaveBeenCalledWith(
      "resposta-discursiva",
      expect.objectContaining({ name: "resolucao.pdf" }),
    ));
    expect(await screen.findByText(/enviado.*sucesso/i)).toBeInTheDocument();
  }, 15_000);
});
