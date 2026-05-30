import { describe, expect, it, jest, beforeEach } from "@jest/globals";

const mockConnect = jest.fn<any>();
const mockQuery = jest.fn<any>();
const mockRelease = jest.fn<any>();

jest.unstable_mockModule("../../database/pool.js", () => ({
  pool: { connect: mockConnect },
}));

type TransactionModule = typeof import("../../database/transaction.js");
let withTransaction: TransactionModule["withTransaction"];

beforeEach(async () => {
  jest.resetModules();
  mockConnect.mockReset();
  mockQuery.mockReset();
  mockRelease.mockReset();
  const mod = await import("../../database/transaction.js");
  withTransaction = mod.withTransaction;
});

describe("database/transaction", () => {
  it("deve executar callback com sucesso e commitar", async () => {
    const client = { query: mockQuery, release: mockRelease };
    mockConnect.mockResolvedValue(client);
    mockQuery.mockResolvedValue(undefined);

    const result = await withTransaction(async (c) => {
      await c.query("SELECT 1");
      return "ok";
    });

    expect(result).toBe("ok");
    expect(mockQuery).toHaveBeenCalledWith("BEGIN");
    expect(mockQuery).toHaveBeenCalledWith("COMMIT");
    expect(mockRelease).toHaveBeenCalled();
  });

  it("deve fazer rollback em caso de erro", async () => {
    const client = { query: mockQuery, release: mockRelease };
    mockConnect.mockResolvedValue(client);
    mockQuery.mockResolvedValue(undefined);

    const testError = new Error("falha na transacao");
    await expect(
      withTransaction(async () => {
        throw testError;
      }),
    ).rejects.toThrow("falha na transacao");

    expect(mockQuery).toHaveBeenCalledWith("BEGIN");
    expect(mockQuery).toHaveBeenCalledWith("ROLLBACK");
    expect(mockRelease).toHaveBeenCalled();
  });
});
