import { describe, expect, it, jest } from "@jest/globals";
import { AvaliacaoLogService } from "../../services/avaliacao-log.service.js";

describe("AvaliacaoLogService - unitário", () => {
  it("deve repassar campos do log para o repository", async () => {
    const repo = {
      create: jest.fn<any>().mockResolvedValue({ id: "log-1" }),
    };
    const service = new AvaliacaoLogService(repo as any);
    const input = {
      provaId: "prova-1",
      provaAlunoId: "pa-1",
      atorTipo: "aluno",
      atorId: "aluno-1",
      acao: "iniciou",
      detalhes: { ip: "127.0.0.1" },
    };

    await expect(service.registrar(input as any)).resolves.toEqual({ id: "log-1" });
    expect(repo.create).toHaveBeenCalledWith(input);
  });
});
