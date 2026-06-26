import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ImageWithFallback } from "./ImageWithFallback";

describe("ImageWithFallback", () => {
  afterEach(() => {
    cleanup();
  });

  it("renderiza a imagem original ate ocorrer erro", () => {
    render(<ImageWithFallback src="/ok.png" alt="Grafico" className="rounded" style={{ width: 10 }} />);

    const image = screen.getByAltText("Grafico");

    expect(image).toHaveAttribute("src", "/ok.png");
    expect(image).toHaveClass("rounded");
  });

  it("troca para fallback preservando atributos quando a imagem falha", () => {
    render(<ImageWithFallback src="/erro.png" alt="Grafico" className="rounded" width={88} />);

    fireEvent.error(screen.getByAltText("Grafico"));

    const fallback = screen.getByAltText("Error loading image");
    expect(fallback).toHaveAttribute("data-original-url", "/erro.png");
    expect(fallback).toHaveAttribute("width", "88");
    expect(fallback.parentElement?.parentElement).toHaveClass("rounded");
  });
});
