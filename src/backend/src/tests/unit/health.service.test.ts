import { describe, expect, it, jest } from "@jest/globals";
import { HealthService } from "../../services/health.service.js";

describe("HealthService - unitário", () => {
  it("deve retornar status da aplicação", () => {
    const service = new HealthService({ ping: jest.fn<any>() } as any);

    expect(service.check()).toEqual({ status: "ok", service: "corrije-ai-api" });
  });

  it("deve testar conexão com banco", async () => {
    const repo = { ping: jest.fn<any>().mockResolvedValue(undefined) };
    const service = new HealthService(repo as any);

    await expect(service.database()).resolves.toEqual({ database: "ok" });
    expect(repo.ping).toHaveBeenCalledTimes(1);
  });
});
