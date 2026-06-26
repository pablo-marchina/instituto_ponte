import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BancoQuestion } from "../../../../../src/features/dashboard/dashboard.types";
import type { Question } from "../../../../../src/features/questoes/questao.types";
import { EditarQuestaoModal } from "./EditarQuestaoModal";
import { EditarQuestaoProvaModal } from "./EditarQuestaoProvaModal";

const bancoQuestion: BancoQuestion = {
  id: "q-banco",
  type: "Alternativa",
  materia: "Matematica",
  materiaId: "materia-1",
  semestre: "1 Semestre",
  dificuldade: "Media",
  text: "Quanto e 2+2?",
  answer: "B",
  options: [
    { letter: "A", text: "3", correct: false },
    { letter: "B", text: "4", correct: true },
  ],
  pontuacaoPadrao: 1,
  timesUsed: 0,
  successRate: 0,
};

const provaQuestion: Question = {
  id: "q-prova",
  type: "Discursiva",
  text: "Explique limites",
  answer: "Resposta esperada",
};

describe("questao edit modals", () => {
  afterEach(() => {
    cleanup();
  });

  it("nao renderiza quando fechado ou sem questao", () => {
    const { container, rerender } = render(
      <EditarQuestaoModal isOpen={false} questao={bancoQuestion} onClose={vi.fn()} onSave={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();

    rerender(<EditarQuestaoProvaModal isOpen questao={null} onClose={vi.fn()} onSave={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("edita alternativa do banco, marca correta, salva e fecha", async () => {
    const onClose = vi.fn();
    const onSave = vi.fn();

    render(<EditarQuestaoModal isOpen questao={bancoQuestion} onClose={onClose} onSave={onSave} />);

    fireEvent.change(screen.getByPlaceholderText(/ex: cálculo/i), { target: { value: "Fisica" } });
    fireEvent.change(screen.getByPlaceholderText(/digite o enunciado/i), { target: { value: "Novo enunciado" } });
    fireEvent.change(screen.getByPlaceholderText("Texto da alternativa A"), { target: { value: "cinco" } });
    fireEvent.click(screen.getByText("A"));
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        materia: "Fisica",
        text: "Novo enunciado",
        options: [
          { letter: "A", text: "cinco", correct: true },
          { letter: "B", text: "4", correct: false },
        ],
      }),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("edita questao verdadeiro/falso do banco", () => {
    const onSave = vi.fn();

    render(
      <EditarQuestaoModal
        isOpen
        questao={{ ...bancoQuestion, type: "V/F", options: undefined, answer: "Verdadeiro" }}
        onClose={vi.fn()}
        onSave={onSave}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Falso" }));
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ answer: "Falso" }));
  });

  it("edita questao discursiva da prova", async () => {
    const onClose = vi.fn();
    const onSave = vi.fn();

    render(<EditarQuestaoProvaModal isOpen questao={provaQuestion} onClose={onClose} onSave={onSave} />);

    fireEvent.change(screen.getByPlaceholderText(/digite o gabarito/i), { target: { value: "Gabarito novo" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ answer: "Gabarito novo" }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("edita alternativa de questao da prova e fecha pelo overlay", () => {
    const onClose = vi.fn();
    const onSave = vi.fn();
    const question: Question = {
      id: "q-alt",
      type: "Alternativa",
      text: "Capital?",
      options: [
        { letter: "A", text: "Sao Paulo", correct: true },
        { letter: "B", text: "Brasilia", correct: false },
      ],
    };

    const { container } = render(<EditarQuestaoProvaModal isOpen questao={question} onClose={onClose} onSave={onSave} />);

    fireEvent.click(container.firstElementChild!);
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByPlaceholderText("Texto da alternativa B"), { target: { value: "Brasilia DF" } });
    fireEvent.click(screen.getByText("B"));
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [
          { letter: "A", text: "Sao Paulo", correct: false },
          { letter: "B", text: "Brasilia DF", correct: true },
        ],
      }),
    );
  });
});
