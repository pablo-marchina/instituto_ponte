import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CadastroScreen } from "./CadastroScreen";
import { LoginScreen } from "./LoginScreen";

describe("internal auth screens", () => {
  it("alterna perfil e inicia login Google", async () => {
    const user = userEvent.setup();
    const onRoleChange = vi.fn();
    const onGoogleLogin = vi.fn();

    render(
      <LoginScreen
        role="professor"
        onRoleChange={onRoleChange}
        onGoogleLogin={onGoogleLogin}
        errorMessage="Nao autorizado"
      />,
    );

    expect(screen.getByText("Acesso interno")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Nao autorizado");

    await user.click(screen.getByRole("button", { name: "Coordenador" }));
    await user.click(screen.getByRole("button", { name: /Entrar com Google/i }));

    expect(onRoleChange).toHaveBeenCalledWith("coordenador");
    expect(onGoogleLogin).toHaveBeenCalledTimes(1);
  });

  it("mostra estado de carregamento", () => {
    render(
      <LoginScreen
        role="coordenador"
        isLoading
        onRoleChange={vi.fn()}
        onGoogleLogin={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /Abrindo Google/i })).toBeDisabled();
  });

  it("renderiza cadastro interno e volta para login", async () => {
    const user = userEvent.setup();
    const onNavigateToLogin = vi.fn();

    render(<CadastroScreen onNavigateToLogin={onNavigateToLogin} />);

    expect(screen.getByText("Cadastro interno")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Voltar para login/i }));
    expect(onNavigateToLogin).toHaveBeenCalledTimes(1);
  });
});
