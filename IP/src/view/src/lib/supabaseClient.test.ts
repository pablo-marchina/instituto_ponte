import { beforeEach, describe, expect, it, vi } from "vitest";

const createClient = vi.fn(() => ({ auth: { marker: true } }));

vi.mock("@supabase/supabase-js", () => ({
  createClient,
}));

describe("getSupabaseClient", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    createClient.mockClear();
  });

  it("falha claramente sem variaveis do Vite", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");

    const { getSupabaseClient } = await import("./supabaseClient");

    expect(() => getSupabaseClient()).toThrow(/VITE_SUPABASE_URL/);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("cria e reutiliza o cliente com configuracao de auth", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "public-key");

    const { getSupabaseClient } = await import("./supabaseClient");

    const first = getSupabaseClient();
    const second = getSupabaseClient();

    expect(first).toBe(second);
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "public-key",
      expect.objectContaining({
        auth: expect.objectContaining({
          autoRefreshToken: true,
          detectSessionInUrl: false,
          flowType: "pkce",
          persistSession: true,
        }),
      }),
    );
  });
});
