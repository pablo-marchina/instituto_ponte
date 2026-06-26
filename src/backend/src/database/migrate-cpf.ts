import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./pool.js";
import { decryptCpf, encryptCpf, hashCpf, isEncryptedCpf } from "../security/cpf-crypto.js";

type CpfRow = { id: string; cpf: string; cpf_hash: string | null };

export const migrateCpfData = async (): Promise<number> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query<CpfRow>(
      'SELECT "id", "cpf", "cpf_hash" FROM "aluno" WHERE "cpf" IS NOT NULL FOR UPDATE',
    );

    let migrated = 0;
    for (const row of result.rows) {
      let cpf: string;
      try {
        cpf = decryptCpf(row.cpf);
      } catch {
        continue;
      }
      const cpfHash = hashCpf(cpf);
      const encrypted = isEncryptedCpf(row.cpf) ? row.cpf : encryptCpf(cpf);
      await client.query(
        'UPDATE "aluno" SET "cpf" = $1, "cpf_hash" = $2 WHERE "id" = $3',
        [encrypted, cpfHash, row.id],
      );
      if (!isEncryptedCpf(row.cpf)) migrated += 1;
    }

    await client.query("COMMIT");
    return migrated;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const filename = fileURLToPath(import.meta.url);
const isDirectExecution = process.argv[1] && path.resolve(process.argv[1]) === filename;
if (isDirectExecution) {
  migrateCpfData()
    .then(async (count) => {
      console.log(`${count} CPF record(s) encrypted.`);
      await pool.end();
    })
    .catch(async (error) => {
      console.error("CPF migration failed:", error);
      process.exitCode = 1;
      await pool.end();
    });
}
