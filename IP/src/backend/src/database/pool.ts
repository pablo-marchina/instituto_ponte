import { Pool } from "pg";
import dotenv from "dotenv";
import { numberFromEnv } from "../helpers/resilience.js";

dotenv.config();
const databaseUrl = process.env.DATABASE_URL;
const databaseHost = databaseUrl ? new URL(databaseUrl).hostname : "localhost";
const isLocalDatabase = databaseHost === "localhost" || databaseHost === "127.0.0.1";

export const pool = new Pool({
  connectionString: databaseUrl,
  max: numberFromEnv(process.env, "DB_POOL_MAX", 10),
  connectionTimeoutMillis: numberFromEnv(process.env, "DB_CONNECTION_TIMEOUT_MS", 8_000),
  idleTimeoutMillis: numberFromEnv(process.env, "DB_IDLE_TIMEOUT_MS", 30_000),
  statement_timeout: numberFromEnv(process.env, "DB_STATEMENT_TIMEOUT_MS", 15_000),
  application_name: process.env.DB_APPLICATION_NAME ?? "instituto-ponte-api",
  ssl: isLocalDatabase ? false : {
    rejectUnauthorized: false
  }
});
