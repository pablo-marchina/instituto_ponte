import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import Fastify from "fastify";
import { pool } from "../database/pool.js";
import { registerIdempotency } from "../middlewares/idempotency.js";

describe("Idempotency-Key - integracao", () => {
  const app = Fastify();
  const prefix = `jest-${Date.now()}`;
  let calls = 0;

  beforeAll(async () => {
    registerIdempotency(app);
    app.post("/critical", async (request, reply) => {
      calls += 1;
      return reply.status(201).send({ success: true, data: request.body });
    });
    await app.ready();
  });

  afterAll(async () => {
    await pool.query('DELETE FROM "idempotency_request" WHERE "key" LIKE $1', [`${prefix}%`]);
    await app.close();
    await pool.end();
  });

  it("reutiliza a resposta para a mesma chave e payload", async () => {
    const headers = { "idempotency-key": `${prefix}-same`, "content-type": "application/json" };
    const first = await app.inject({ method: "POST", url: "/critical", headers, payload: { value: 1 } });
    const second = await app.inject({ method: "POST", url: "/critical", headers, payload: { value: 1 } });
    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(201);
    expect(second.json()).toEqual(first.json());
    expect(calls).toBe(1);
  });

  it("retorna 409 quando a mesma chave recebe payload diferente", async () => {
    const headers = { "idempotency-key": `${prefix}-conflict`, "content-type": "application/json" };
    await app.inject({ method: "POST", url: "/critical", headers, payload: { value: 1 } });
    const response = await app.inject({ method: "POST", url: "/critical", headers, payload: { value: 2 } });
    expect(response.statusCode).toBe(409);
  });
});
