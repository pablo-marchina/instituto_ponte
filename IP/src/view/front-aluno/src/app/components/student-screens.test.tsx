import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ProvaPublicaDto } from "../../../../src/features/aluno/aluno.types";
import type { Question } from "../App";
import { TelaAcesso } from "./TelaAcesso";
import { TelaConfirmacao } from "./TelaConfirmacao";
import { TelaInstrucao } from "./TelaInstrucao";
import { TelaPreEntrega } from "./TelaPreEntrega";
import { TelaProva } from "./TelaProva";
import { TelaRevisao } from "./TelaRevisao";

afterEach(() => cleanup());

const prova: ProvaPublicaDto = {
  titulo: "Prova de Matematica",
  instrucoes: "Leia tudo\nResponda com calma",
  tempoLimiteMin: 90,
  dataInicio: "2026-01-01T12:00:00.000Z",
  dataFim: "2026-01-01T14:00:00.000Z",
  disponivel: true,
};

const questions: Question[] = [
  {
    id: "q1",
    displayOrder: 1,
    type: "discursiva",
    statement: "Explique o raciocinio",
    statementImage: null,
    answer: "Resposta",
    marked: false,
    alternatives: [],
    permiteAnexo: true,
  },
  {
    id: "q2",
    displayOrder: 2,
    type: "discursiva",
    statement: "Questao em branco",
    statementImage: null,
    answer: "",
    marked: true,
    alternatives: [],
    permiteAnexo: false,
  },
];

describe("student flow screens", () => {
  it("valida campos de acesso, formata CPF e envia dados validos", async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    render(<TelaAcesso onNext={onNext} errorMessage="Falha externa" />);

    await user.click(screen.getByRole("button", { name: /continuar/i }));
    expect(screen.getByText(/obrigat/i)).toBeInTheDocument();
    expect(onNext).not.toHaveBeenCalled();

    await user.type(screen.getByPlaceholderText("Nome completo"), " Ada Lovelace ");
    await user.type(screen.getByPlaceholderText("email@email.com.br"), "ada@example.com");
    await user.type(screen.getByPlaceholderText("000.000.000-00"), "12345678901");
    expect(screen.getByPlaceholderText("000.000.000-00")).toHaveValue("123.456.789-01");

    await user.click(screen.getByRole("button", { name: /continuar/i }));
    expect(onNext).toHaveBeenCalledWith({
      name: "Ada Lovelace",
      email: "ada@example.com",
      cpf: "123.456.789-01",
    });
    expect(screen.getByText("Falha externa")).toBeInTheDocument();
  });

  it("renderiza instrucoes customizadas e dispara inicio da prova", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(<TelaInstrucao prova={prova} onStart={onStart} />);

    expect(screen.getByText("Prova de Matematica")).toBeInTheDocument();
    expect(screen.getByText("1h 30min")).toBeInTheDocument();
    expect(screen.getByText("Leia tudo")).toBeInTheDocument();
    expect(screen.getByText("Responda com calma")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /come/i }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("renderiza confirmacao final com email do aluno", () => {
    render(<TelaConfirmacao studentInfo={{ name: "Ada", email: "ada@example.com", cpf: "123" }} />);

    expect(screen.getByText(/FINALIZADO/i)).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
  });

  it("resume questoes antes do envio e controla modal de confirmacao", async () => {
    const user = userEvent.setup();
    const onGoToQuestion = vi.fn();
    const onBack = vi.fn();
    const onConfirm = vi.fn();
    const onDismissWarning = vi.fn();
    const onSubmit = vi.fn();

    const { rerender } = render(
      <TelaPreEntrega
        questions={questions}
        blankQuestions={[questions[1]]}
        timeLeft="10 min"
        showSubmitWarning={false}
        errorMessage="Erro ao enviar"
        onGoToQuestion={onGoToQuestion}
        onBack={onBack}
        onConfirm={onConfirm}
        onDismissWarning={onDismissWarning}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("Respondidas")).toBeInTheDocument();
    expect(screen.getByText("Em branco")).toBeInTheDocument();
    expect(screen.getByText("Erro ao enviar")).toBeInTheDocument();
    await user.click(screen.getByText(/Quest.o 1/i).closest("button")!);
    expect(onGoToQuestion).toHaveBeenCalledWith(0);
    await user.click(screen.getByRole("button", { name: /voltar/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: /confirmar envio/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    rerender(
      <TelaPreEntrega
        questions={questions}
        blankQuestions={[questions[1]]}
        timeLeft="10 min"
        showSubmitWarning
        onGoToQuestion={onGoToQuestion}
        onBack={onBack}
        onConfirm={onConfirm}
        onDismissWarning={onDismissWarning}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: /finalizar e enviar/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("renderiza prova objetiva/discursiva, upload, navegacao e aviso de tempo", async () => {
    const user = userEvent.setup();
    const handlers = {
      onAnswerChange: vi.fn(),
      onToggleMark: vi.fn(),
      onNext: vi.fn(),
      onPrev: vi.fn(),
      onFinalize: vi.fn(),
      onReviewMarked: vi.fn(),
      onGoToQuestion: vi.fn(),
      onDismissTimeWarning: vi.fn(),
      onTimeWarningFinalize: vi.fn(),
      onFileUpload: vi.fn(),
    };
    const provaQuestions: Question[] = [
      questions[0],
      {
        id: "q3",
        displayOrder: 2,
        type: "multipla_escolha",
        statement: "Escolha uma alternativa",
        statementImage: "https://example.com/enunciado.png",
        answer: "",
        marked: false,
        permiteAnexo: false,
        alternatives: [
          { id: "a", ordem: 1, conteudoLatex: "Alternativa A", urlImagem: null },
          { id: "b", ordem: 2, conteudoLatex: "Alternativa B", urlImagem: "https://example.com/a.png" },
        ],
      },
    ];

    const { rerender } = render(
      <TelaProva
        questions={provaQuestions}
        currentQIndex={0}
        timeLeft="05:00"
        showTimeWarning={false}
        studentInfo={{ name: "Ada", email: "ada@example.com", cpf: "123" }}
        syncMessage="Salvo"
        uploadMessage="Anexo enviado"
        {...handlers}
      />,
    );

    await user.click(screen.getByRole("button", { name: /anexar arquivos/i }));
    expect(handlers.onFileUpload).toHaveBeenCalledWith("q1");
    await user.type(screen.getByPlaceholderText(/digite aqui/i), " nova");
    expect(handlers.onAnswerChange).toHaveBeenCalled();
    const markToggle = screen.getByText(/marcar para revisar/i).closest("label")?.querySelector("div");
    expect(markToggle).toBeTruthy();
    await user.click(markToggle as HTMLElement);
    expect(handlers.onToggleMark).toHaveBeenCalledWith(0);
    await user.click(screen.getByRole("button", { name: /avan.ar/i }));
    expect(handlers.onNext).toHaveBeenCalledTimes(1);

    rerender(
      <TelaProva
        questions={provaQuestions}
        currentQIndex={1}
        timeLeft="03:00"
        showTimeWarning
        studentInfo={{ name: "Ada", email: "ada@example.com", cpf: "123" }}
        {...handlers}
      />,
    );

    await user.click(screen.getByText("Alternativa B"));
    expect(handlers.onAnswerChange).toHaveBeenCalledWith(1, "b");
    await user.click(screen.getByRole("button", { name: /voltar para a prova/i }));
    expect(handlers.onDismissTimeWarning).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: /finalizar agora/i }));
    expect(handlers.onTimeWarningFinalize).toHaveBeenCalledTimes(1);
  });

  it("renderiza revisao e permite ir para questao e envio", async () => {
    const user = userEvent.setup();
    const onGoToQuestion = vi.fn();
    const onBack = vi.fn();
    const onSubmit = vi.fn();

    render(
      <TelaRevisao
        questions={questions}
        markedQuestions={[questions[1]]}
        timeLeft="04:00"
        onGoToQuestion={onGoToQuestion}
        onBack={onBack}
        onFinalize={onSubmit}
      />,
    );

    expect(screen.getByRole("heading", { name: /revis.o/i })).toBeInTheDocument();
    await user.click(screen.getByText(/Quest.o 2/i).closest("button")!);
    expect(onGoToQuestion).toHaveBeenCalledWith(1);
    await user.click(screen.getByRole("button", { name: /voltar/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: /finalizar/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
