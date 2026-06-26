import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AlunoModule } from "./AlunoModule";
import { CoordenadorProfessorModule } from "./CoordenadorProfessorModule";

vi.mock("../../front-aluno/src/app/App", () => ({
  default: () => <main>Aluno app real boundary</main>,
}));

vi.mock("../../front-coordenador-professor/src/app/App", () => ({
  default: () => <main>Interno app real boundary</main>,
}));

describe("root modules", () => {
  it("renderiza modulo do aluno", () => {
    render(<AlunoModule />);

    expect(screen.getByText("Aluno app real boundary")).toBeInTheDocument();
  });

  it("renderiza modulo coordenador/professor", () => {
    render(<CoordenadorProfessorModule />);

    expect(screen.getByText("Interno app real boundary")).toBeInTheDocument();
  });
});
