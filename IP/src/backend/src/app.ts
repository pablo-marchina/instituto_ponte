import Fastify from "fastify";
import { fastifyCors } from "@fastify/cors";
import {validatorCompiler, serializerCompiler} from "fastify-type-provider-zod";
import { fastifySwagger } from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";

// ? Porta onde o servidor roda
const PORT = 3333;

const app = Fastify({
    logger: {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true, 
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
        },
    }
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(fastifyCors, { origin: "*" });

// ? Configuração do Swagger para configuração da API
app.register(fastifySwagger, {
  openapi: {
    info: {
      title: "Api - Instituto Ponte",
      version: "1.0.0",
    },
  },
});

app.register(fastifySwaggerUi, {
  routePrefix: "/docs",
});


// ? Registro das rotas

app
  .listen({ port: PORT })
  .then(() => {
    console.log(`Servidor HTTP rodando na porta ${PORT}`);
  })
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });
