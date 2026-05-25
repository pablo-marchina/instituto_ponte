import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();
if(!process.env.DATABASE_URL) {
    throw new Error("The database is not definied");
}

const databaseUrl = process.env.DATABASE_URL;
const databaseHost = new URL(databaseUrl).hostname;
const isLocalDatabase = databaseHost === "localhost" || databaseHost === "127.0.0.1";

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: isLocalDatabase ? false : {
    rejectUnauthorized: false
  }
});
