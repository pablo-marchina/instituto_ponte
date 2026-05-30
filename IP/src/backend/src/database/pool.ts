import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();
const databaseUrl = process.env.DATABASE_URL;
const databaseHost = databaseUrl ? new URL(databaseUrl).hostname : "localhost";
const isLocalDatabase = databaseHost === "localhost" || databaseHost === "127.0.0.1";

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: isLocalDatabase ? false : {
    rejectUnauthorized: false
  }
});
