import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { StorageService } from "../../services/storage.service.js";

describe("StorageService - unitário", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("deve retornar caminho local quando SUPABASE_STORAGE_URL não está configurado", async () => {
    delete process.env.SUPABASE_STORAGE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const service = new StorageService();
    const result = await service.upload({
      path: "exports/teste.xlsx",
      content: "conteudo",
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    expect(result).toBe(
      "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,Y29udGV1ZG8=",
    );
  });

  it("deve retornar caminho local quando SUPABASE_SERVICE_ROLE_KEY não está configurado mesmo com URL definida", async () => {
    process.env.SUPABASE_STORAGE_URL = "https://supabase.co";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const service = new StorageService();
    const result = await service.upload({
      path: "exports/teste.xlsx",
      content: "conteudo",
      contentType: "text/plain",
    });
    expect(result).toBe("data:text/plain;base64,Y29udGV1ZG8=");
  });

  it("deve fazer upload para Supabase storage quando URL e service role key estão configurados", async () => {
    process.env.SUPABASE_STORAGE_URL = "https://supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
    process.env.SUPABASE_STORAGE_BUCKET = "exports";

    const mockResponse = { ok: true, text: async () => "" };
    const mockFetch = jest.fn<typeof fetch>().mockResolvedValue(mockResponse as Response);
    (globalThis as Record<string, unknown>).fetch = mockFetch;

    const service = new StorageService();
    const result = await service.upload({
      path: "exports/teste.xlsx",
      content: "conteudo",
      contentType: "application/json",
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callUrl = mockFetch.mock.calls[0][0];
    expect(callUrl).toContain("supabase.co/storage/v1/object/exports/exports/teste.xlsx");
    expect(result).toBe("https://supabase.co/storage/v1/object/public/exports/exports/teste.xlsx");
  });

  it("deve lançar erro quando o upload para Supabase retorna status diferente de 200", async () => {
    process.env.SUPABASE_STORAGE_URL = "https://supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
    process.env.SUPABASE_STORAGE_BUCKET = "exports";

    const mockResponse = {
      ok: false,
      status: 403,
      text: async () => "Forbidden",
    };
    const mockFetch = jest.fn<typeof fetch>().mockResolvedValue(mockResponse as Response);
    (globalThis as Record<string, unknown>).fetch = mockFetch;

    const service = new StorageService();
    await expect(
      service.upload({
        path: "exports/teste.xlsx",
        content: "conteudo",
        contentType: "text/plain",
      }),
    ).rejects.toThrow("Falha ao enviar arquivo para o storage: 403 Forbidden");
  });

  it("deve normalizar base URL removendo trailing slash antes de fazer upload", async () => {
    process.env.SUPABASE_STORAGE_URL = "https://supabase.co/";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
    process.env.SUPABASE_STORAGE_BUCKET = "exports";

    const mockResponse = { ok: true, text: async () => "" };
    const mockFetch = jest.fn<typeof fetch>().mockResolvedValue(mockResponse as Response);
    (globalThis as Record<string, unknown>).fetch = mockFetch;

    const service = new StorageService();
    await service.upload({
      path: "exports/teste.xlsx",
      content: "conteudo",
      contentType: "text/plain",
    });

    const callUrl = mockFetch.mock.calls[0][0] as string;
    expect(callUrl.startsWith("https://supabase.co/storage")).toBe(true);
    expect(callUrl.includes("//storage")).toBe(false);
  });
});
