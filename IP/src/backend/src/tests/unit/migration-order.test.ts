import { describe, expect, it } from "@jest/globals";
import { computeChecksum, orderMigrationFiles } from "../../database/migrate.js";

describe("migration runner", () => {
  it("executa compatibilidade Supabase, base legada e migrations evolutivas em ordem", () => {
    expect(orderMigrationFiles(["010_last.sql", "migration.sql", "002_next.sql", "000_supabase_compat.sql"]))
      .toEqual(["000_supabase_compat.sql", "migration.sql", "002_next.sql", "010_last.sql"]);
  });

  it("gera checksum sha256 estavel", () => {
    expect(computeChecksum("SELECT 1;")).toMatch(/^[a-f0-9]{64}$/);
    expect(computeChecksum("SELECT 1;")).toBe(computeChecksum("SELECT 1;"));
  });
});
