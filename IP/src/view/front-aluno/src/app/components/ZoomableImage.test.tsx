import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ZoomableImage } from "./ZoomableImage";

describe("ZoomableImage", () => {
  it("nao renderiza sem URL", () => {
    const { container } = render(<ZoomableImage src={null} alt="Imagem" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("abre, recebe foco e fecha pelo Escape", async () => {
    const user = userEvent.setup();
    render(<ZoomableImage src="https://example.com/image.png" alt="Enunciado" />);
    await user.click(screen.getByRole("button", { name: "Ampliar Enunciado" }));
    expect(screen.getByRole("dialog", { name: "Enunciado" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Fechar imagem ampliada" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
