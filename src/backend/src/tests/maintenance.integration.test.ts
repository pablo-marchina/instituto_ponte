import { afterAll, describe, expect, it } from "@jest/globals";
import { migrateCpfData } from "../database/migrate-cpf.js";
import { pool } from "../database/pool.js";
import { ExpirationRepository } from "../repositories/expiration.repository.js";

describe("rotinas de manutencao - integracao", () => {
  afterAll(async () => pool.end());

  it("executa novamente a migracao de CPF sem alterar ciphertext existente", async () => {
    await expect(migrateCpfData()).resolves.toEqual(expect.any(Number));
    await expect(migrateCpfData()).resolves.toBe(0);
  });

  it("executa varredura idempotente de expiracoes", async () => {
    const repository = new ExpirationRepository();
    const first = await repository.sweep();
    const second = await repository.sweep();
    expect(first).toEqual({
      submittedAttempts: expect.any(Number),
      closedExams: expect.any(Number),
    });
    expect(second).toEqual({ submittedAttempts: 0, closedExams: 0 });
  });
});
