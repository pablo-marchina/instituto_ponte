import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Header } from "./Header";

describe("Header", () => {
  it("oculta e reexibe o cronometro", async () => {
    const user = userEvent.setup();
    render(<Header title="Prova" timer="10 min" />);
    expect(screen.getByText("10 min")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Ocultar cronometro" }));
    expect(screen.queryByText("10 min")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Mostrar cronometro" }));
    expect(screen.getByText("10 min")).toBeVisible();
  });
});
