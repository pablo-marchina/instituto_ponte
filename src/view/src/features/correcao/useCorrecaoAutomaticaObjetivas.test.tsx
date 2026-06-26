import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getStoredAuthSession } from "../auth/auth.storage";
import { executarCorrecaoAutomatica } from "./correcao.api";
import { useCorrecaoAutomaticaObjetivas } from "./useCorrecaoAutomaticaObjetivas";

vi.mock("../auth/auth.storage", () => ({
  getStoredAuthSession: vi.fn(),
}));

vi.mock("./correcao.api", () => ({
  executarCorrecaoAutomatica: vi.fn(),
}));

function createWrapper(queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useCorrecaoAutomaticaObjetivas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("nao executa sem prova ou sem perfil autorizado", async () => {
    vi.mocked(getStoredAuthSession).mockReturnValue(null);

    const { result } = renderHook(() => useCorrecaoAutomaticaObjetivas("prova-1"), { wrapper: createWrapper() });

    expect(result.current.fetchStatus).toBe("idle");
    expect(executarCorrecaoAutomatica).not.toHaveBeenCalled();
  });

  it("executa para professor e invalida queries relacionadas", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    vi.mocked(getStoredAuthSession).mockReturnValue({
      accessToken: "token",
      usuario: { id: "u1", nome: "Prof", email: "prof@example.com", perfil: "professor" },
    });
    vi.mocked(executarCorrecaoAutomatica).mockResolvedValue({
      provaId: "prova-1",
      respostasCorrigidas: 3,
      discursivasPendentes: 1,
    });

    const { result } = renderHook(() => useCorrecaoAutomaticaObjetivas("prova-1"), { wrapper: createWrapper(queryClient) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(executarCorrecaoAutomatica).toHaveBeenCalledWith("prova-1");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["correcao", "questoes", "prova-1"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["correcao", "respostas", "prova-1"] });
  });

  it("executa tambem para coordenador e propaga erro controlado", async () => {
    vi.mocked(getStoredAuthSession).mockReturnValue({
      accessToken: "token",
      usuario: { id: "u1", nome: "Coord", email: "coord@example.com", perfil: "coordenador" },
    });
    vi.mocked(executarCorrecaoAutomatica).mockRejectedValue(new Error("falha"));

    const { result } = renderHook(() => useCorrecaoAutomaticaObjetivas("prova-2"), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(executarCorrecaoAutomatica).toHaveBeenCalledWith("prova-2");
  });
});
