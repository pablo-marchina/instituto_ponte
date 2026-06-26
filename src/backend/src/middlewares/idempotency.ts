import { createHash } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { conflict } from "../errors/api-error.js";
import { stableJson } from "../helpers/stable-json.js";
import { IdempotencyRepository } from "../repositories/idempotency.repository.js";

type ActiveRequest = { key: string; method: string; route: string };
const activeRequests = new WeakMap<FastifyRequest, ActiveRequest>();
const MUTATING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

export const requestHash = (body: unknown): string =>
  createHash("sha256").update(stableJson(body ?? null)).digest("hex");

export function registerIdempotency(app: FastifyInstance) {
  const repository = new IdempotencyRepository();

  app.addHook("preHandler", async (request, reply) => {
    if (!MUTATING_METHODS.has(request.method)) return;
    const header = request.headers["idempotency-key"];
    if (header === undefined) return;
    const key = Array.isArray(header) ? header[0] : header;
    if (!key || key.length > 255) throw conflict("Idempotency-Key invalida.");

    const route = request.routeOptions.url ?? request.url;
    const hash = requestHash(request.body);
    const record = await repository.acquire(key, request.method, route, hash);
    if (record.requestHash !== hash) {
      throw conflict("Idempotency-Key reutilizada com payload diferente.");
    }
    if (record.state === "completed") {
      return reply.status(record.responseStatus ?? 200).send(record.responseBody);
    }
    if (!record.owned) {
      throw conflict("Uma requisicao com esta Idempotency-Key ainda esta em processamento.");
    }
    activeRequests.set(request, { key, method: request.method, route });
  });

  app.addHook("onSend", async (request, reply, payload) => {
    const active = activeRequests.get(request);
    if (!active) return payload;
    if (reply.statusCode >= 500) {
      await repository.release(active.key, active.method, active.route);
      return payload;
    }

    let body: unknown = payload;
    if (typeof payload === "string") {
      try {
        body = JSON.parse(payload);
      } catch {
        body = payload;
      }
    }
    await repository.complete(active.key, active.method, active.route, reply.statusCode, body);
    return payload;
  });

  app.addHook("onError", async (request) => {
    const active = activeRequests.get(request);
    if (active) await repository.release(active.key, active.method, active.route);
  });
}
