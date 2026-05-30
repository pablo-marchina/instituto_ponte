import { pool } from "./pool.js";

export class DatabaseRepository {
  async ping() {
    await pool.query("SELECT 1");
  }
}
