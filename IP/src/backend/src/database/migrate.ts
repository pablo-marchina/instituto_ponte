import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { pool } from "./pool.js";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCHEMA_MIGRATIONS_TABLE = "schema_migrations";

const ensureMigrationsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "${SCHEMA_MIGRATIONS_TABLE}" (
      "id" SERIAL PRIMARY KEY,
      "filename" TEXT NOT NULL UNIQUE,
      "checksum" TEXT,
      "executed_at" TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
};

const getExecutedMigrations = async (): Promise<
  { filename: string; checksum: string | null }[]
> => {
  const result = await pool.query(
    `SELECT "filename", "checksum" FROM "${SCHEMA_MIGRATIONS_TABLE}" ORDER BY "id" ASC`,
  );
  return result.rows;
};

const computeChecksum = (content: string): string => {
  return crypto.createHash("sha256").update(content, "utf-8").digest("hex");
};

const registerMigration = async (
  filename: string,
  checksum: string,
): Promise<void> => {
  await pool.query(
    `INSERT INTO "${SCHEMA_MIGRATIONS_TABLE}" ("filename", "checksum") VALUES ($1, $2)`,
    [filename, checksum],
  );
};

async function migrate() {
  const dir = path.join(__dirname, "migrations");
  const files: string[] = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("Nenhum arquivo de migration encontrado.");
    await pool.end();
    return;
  }

  try {
    await ensureMigrationsTable();
    const executed = await getExecutedMigrations();
    const executedMap = new Map(
      executed.map((m) => [m.filename, m.checksum]),
    );

    for (const file of files) {
      const sql = fs.readFileSync(path.join(dir, file), "utf8");
      const checksum = computeChecksum(sql);

      const previousChecksum = executedMap.get(file);

      if (previousChecksum && previousChecksum !== checksum) {
        throw new Error(
          `Migration "${file}" já foi executada com conteúdo diferente. ` +
            `Checksum anterior: ${previousChecksum}, atual: ${checksum}. ` +
            "Não é possível prosseguir.",
        );
      }

      if (!previousChecksum) {
        console.log(`Running migration: ${file}`);
        await pool.query(sql);
        await registerMigration(file, checksum);
        console.log(`Migration "${file}" executada com sucesso.`);
      } else {
        console.log(`Migration "${file}" já executada, pulando.`);
      }
    }

    console.log("Migrations concluídas com sucesso.");
  } finally {
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
