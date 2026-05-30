import { buildApp } from "./app.js";

const PORT = Number(process.env.PORT ?? 3333);
const app = buildApp();

app
  .listen({ port: PORT })
  .then(() => {
    console.log(`Servidor HTTP rodando na porta ${PORT}`);
  })
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });
