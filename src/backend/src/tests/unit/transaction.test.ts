import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockQuery = jest.fn<any>();
const mockRelease = jest.fn<any>();
const mockConnect = jest.fn<any>();

jest.unstable_mockModule("../../database/pool.js", () => ({
  pool: {
    connect: mockConnect,
  },
}));

const { withTransaction } = await import("../../database/transaction.js");

beforeEach(() => {
  mockQuery.mockReset();
  mockRelease.mockReset();
  mockConnect.mockReset();
  mockConnect.mockResolvedValue({
    query: mockQuery,
    release: mockRelease,
  });
});

describe("withTransaction", () => {
  it("executa callback entre BEGIN e COMMIT e libera cliente", async () => {
    const result = await withTransaction(async (client) => {
      await client.query("SELECT 1");
      return "ok";
    });

    expect(result).toBe("ok");
    expect(mockQuery).toHaveBeenNthCalledWith(1, "BEGIN");
    expect(mockQuery).toHaveBeenNthCalledWith(2, "SELECT 1");
    expect(mockQuery).toHaveBeenNthCalledWith(3, "COMMIT");
    expect(mockRelease).toHaveBeenCalledTimes(1);
  });

  it("executa ROLLBACK, libera cliente e relanca erro", async () => {
    const error = new Error("boom");

    await expect(withTransaction(async () => {
      throw error;
    })).rejects.toBe(error);

    expect(mockQuery).toHaveBeenNthCalledWith(1, "BEGIN");
    expect(mockQuery).toHaveBeenNthCalledWith(2, "ROLLBACK");
    expect(mockRelease).toHaveBeenCalledTimes(1);
  });
});
