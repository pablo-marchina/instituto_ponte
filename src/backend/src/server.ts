import { buildApp } from "./app.js";
import { pool } from "./database/pool.js";
import { startExpirationScheduler } from "./services/expiration.service.js";

const PORT = Number(process.env.PORT ?? 3333);
const app = buildApp();
let stopScheduler = () => {};
let shuttingDown = false;

export const shutdown = async (signal: string) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Encerrando servidor por ${signal}.`);
  stopScheduler();
  await app.close();
  await pool.end();
};

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

app
  .listen({ port: PORT })
  .then(() => {
    stopScheduler = startExpirationScheduler();
    console.log(`Servidor HTTP rodando na porta ${PORT}`);
  })
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });
