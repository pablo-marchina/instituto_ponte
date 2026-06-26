import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { pool } from "./pool.js";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const SCHEMA_MIGRATIONS_TABLE = "schema_migrations";

export const orderMigrationFiles = (files: string[]): string[] =>
  [...files].sort((left, right) => migrationSortKey(left).localeCompare(migrationSortKey(right)));

export const migrationSortKey = (file: string): string =>
  file === "migration.sql" ? "001_initial_schema.sql" : file;

const LEGACY_BASE_MIGRATION = "migration.sql";
const INITIAL_SCHEMA_MIGRATION = "001_initial_schema.sql";

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

export const computeChecksum = (content: string): string => {
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

const updateMigrationChecksum = async (
  filename: string,
  checksum: string,
): Promise<void> => {
  await pool.query(
    `UPDATE "${SCHEMA_MIGRATIONS_TABLE}" SET "checksum" = $2 WHERE "filename" = $1`,
    [filename, checksum],
  );
};

export const hasExistingBaseSchema = async (): Promise<boolean> => {
  const result = await pool.query(
    `SELECT to_regclass('public.prova') IS NOT NULL
        AND to_regclass('public.aluno') IS NOT NULL
        AND to_regclass('public.prova_aluno') IS NOT NULL AS "exists"`,
  );
  return result.rows[0]?.exists === true;
};

export const hasExistingSupabaseAuth = async (): Promise<boolean> => {
  const result = await pool.query(
    `SELECT to_regnamespace('auth') IS NOT NULL
        AND to_regclass('auth.users') IS NOT NULL
        AND to_regprocedure('auth.uid()') IS NOT NULL AS "exists"`,
  );
  return result.rows[0]?.exists === true;
};

export const hasExistingSecurityResilienceSchema = async (): Promise<boolean> => {
  const result = await pool.query(
    `SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'aluno'
          AND column_name = 'cpf_hash'
      )
      AND to_regclass('public.idempotency_request') IS NOT NULL
      AND to_regclass('public.aluno_cpf_hash_unique') IS NOT NULL AS "exists"`,
  );
  return result.rows[0]?.exists === true;
};

export const hasExistingAlunoUniqueIndexes = async (): Promise<boolean> => {
  const result = await pool.query(
    `SELECT to_regclass('public.aluno_email_unique') IS NOT NULL
      AND to_regclass('public.aluno_auth_user_id_unique') IS NOT NULL AS "exists"`,
  );
  return result.rows[0]?.exists === true;
};

export async function migrate(options: { closePool?: boolean } = {}) {
  const closePool = options.closePool ?? true;
  const dir = path.join(__dirname, "migrations");
  const files = orderMigrationFiles(
    fs.readdirSync(dir).filter((file) => file.endsWith(".sql")),
  );

  if (files.length === 0) {
    console.log("Nenhum arquivo de migration encontrado.");
    if (closePool) await pool.end();
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

      const legacyBaseChecksum = file === INITIAL_SCHEMA_MIGRATION
        ? executedMap.get(LEGACY_BASE_MIGRATION)
        : undefined;
      const previousChecksum = executedMap.get(file) ?? legacyBaseChecksum;

      if (previousChecksum && previousChecksum !== checksum) {
        if (file === "000_supabase_compat.sql" && await hasExistingSupabaseAuth()) {
          console.log('Auth nativo do Supabase detectado; atualizando checksum de "000_supabase_compat.sql" sem reaplicar.');
          await updateMigrationChecksum(file, checksum);
          continue;
        }

        if (file === "004_security_resilience.sql" && await hasExistingSecurityResilienceSchema()) {
          console.log('Objetos de "004_security_resilience.sql" detectados; atualizando checksum sem reaplicar.');
          await updateMigrationChecksum(file, checksum);
          continue;
        }

        if (file === "005_expiration_scheduler.sql") {
          console.log('Reaplicando funcao substituivel de "005_expiration_scheduler.sql" e atualizando checksum.');
          await pool.query(sql);
          await updateMigrationChecksum(file, checksum);
          continue;
        }

        if (file === "006_restore_aluno_unique_constraints.sql" && await hasExistingAlunoUniqueIndexes()) {
          console.log('Indices de "006_restore_aluno_unique_constraints.sql" detectados; atualizando checksum sem reaplicar.');
          await updateMigrationChecksum(file, checksum);
          continue;
        }

        if (file === INITIAL_SCHEMA_MIGRATION && legacyBaseChecksum && await hasExistingBaseSchema()) {
          console.log('Schema-base legado detectado em "migration.sql"; registrando alias "001_initial_schema.sql" sem reaplicar.');
          if (!executedMap.has(INITIAL_SCHEMA_MIGRATION)) {
            await registerMigration(INITIAL_SCHEMA_MIGRATION, checksum);
          }
          continue;
        }

        throw new Error(
          `Migration "${file}" jÃ¡ foi executada com conteÃºdo diferente. ` +
            `Checksum anterior: ${previousChecksum}, atual: ${checksum}. ` +
            "NÃ£o Ã© possÃ­vel prosseguir.",
        );
      }

      if (!previousChecksum && (file === LEGACY_BASE_MIGRATION || file === INITIAL_SCHEMA_MIGRATION) && await hasExistingBaseSchema()) {
        console.log(`Schema-base existente detectado; registrando "${file}" sem reaplicar.`);
        await registerMigration(file, checksum);
        continue;
      }

      if (!previousChecksum && file === "000_supabase_compat.sql" && await hasExistingSupabaseAuth()) {
        console.log('Auth nativo do Supabase detectado; registrando "000_supabase_compat.sql" sem reaplicar.');
        await registerMigration(file, checksum);
        continue;
      }

      if (!previousChecksum) {
        console.log(`Running migration: ${file}`);
        await pool.query(sql);
        await registerMigration(file, checksum);
        console.log(`Migration "${file}" executada com sucesso.`);
      } else {
        console.log(`Migration "${file}" jÃ¡ executada, pulando.`);
      }
    }

    console.log("Migrations concluÃ­das com sucesso.");
  } finally {
    if (closePool) await pool.end();
  }
}

const isDirectExecution = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isDirectExecution) {
  migrate().catch((err) => {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  });
}

