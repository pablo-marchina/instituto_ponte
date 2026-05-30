import { describe, expect, it, jest, beforeEach } from "@jest/globals";

jest.unstable_mockModule("@fastify/cors", () => ({
  fastifyCors: jest.fn(),
}));
jest.unstable_mockModule("@fastify/swagger", () => ({
  fastifySwagger: jest.fn(),
}));
jest.unstable_mockModule("@fastify/swagger-ui", () => ({
  default: jest.fn(),
}));
jest.unstable_mockModule("fastify-type-provider-zod", () => ({
  jsonSchemaTransform: jest.fn(),
  serializerCompiler: () => (data: unknown) => data,
  validatorCompiler: ({ schema }: { schema: { safeParse?: Function } }) => {
    return (data: unknown) => {
      if (typeof schema?.safeParse === "function") {
        const result = schema.safeParse(data);
        if (!result.success) return { error: result.error };
        return { value: result.data };
      }
      return { value: data };
    };
  },
}));

type AppModule = typeof import("../../app.js");
let app: AppModule;

beforeEach(async () => {
  jest.resetModules();
  app = await import("../../app.js");
});

describe("app - buildApp", () => {
  it("deve construir o servidor Fastify sem erros", () => {
    const server = app.buildApp();
    expect(server).toBeDefined();
  });

  it("deve retornar 404 para rota inexistente", async () => {
    const server = app.buildApp();
    const response = await server.inject({ method: "GET", url: "/rota-inexistente" });
    expect(response.statusCode).toBe(404);
    expect(response.json().success).toBe(false);
    expect(response.json().error.code).toBe("NOT_FOUND");
  });

  it("deve retornar 422 para payload inválido com detalhes da validação Zod", async () => {
    const server = app.buildApp();
    const response = await server.inject({
      method: "POST",
      url: "/api/v1/public/provas/algum-url/iniciar",
      payload: {},
    });
    console.log("ZodError test body:", JSON.stringify(response.json()));
    expect(response.statusCode).toBe(422);
    const body = response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details).toBeDefined();
    expect(body.error.details.length).toBeGreaterThan(0);
    expect(body.error.details[0]).toHaveProperty("field");
    expect(body.error.details[0]).toHaveProperty("message");
  });

  it("deve retornar 422 com field aninhado quando path tem subpropriedades", async () => {
    const server = app.buildApp();
    const response = await server.inject({
      method: "POST",
      url: "/api/v1/public/provas/algum-url/iniciar",
      payload: { nome: "", email: "invalido", cpf: "123", aceiteTermos: false },
    });
    console.log("ZodError nested test body:", JSON.stringify(response.json()));
    expect(response.statusCode).toBe(422);
    const body = response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details).toBeDefined();
  });
});
