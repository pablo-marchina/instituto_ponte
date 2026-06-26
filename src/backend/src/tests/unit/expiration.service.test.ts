import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { ExpirationService, startExpirationScheduler } from "../../services/expiration.service.js";

afterEach(() => {
  jest.useRealTimers();
});

describe("ExpirationService", () => {
  it("delega a varredura ao repositorio", async () => {
    const repository = { sweep: jest.fn<any>().mockResolvedValue({ submittedAttempts: 2, closedExams: 1 }) };
    await expect(new ExpirationService(repository as any).sweep()).resolves.toEqual({ submittedAttempts: 2, closedExams: 1 });
  });

  it("ignora varredura concorrente", async () => {
    let release!: () => void;
    const pending = new Promise((resolve) => { release = () => resolve({ submittedAttempts: 1, closedExams: 0 }); });
    const repository = { sweep: jest.fn<any>().mockReturnValue(pending) };
    const service = new ExpirationService(repository as any);
    const first = service.sweep();
    await expect(service.sweep()).resolves.toEqual({ submittedAttempts: 0, closedExams: 0 });
    release();
    await expect(first).resolves.toEqual({ submittedAttempts: 1, closedExams: 0 });
  });

  it("libera o bloqueio mesmo quando a varredura falha", async () => {
    const repository = { sweep: jest.fn<any>().mockRejectedValueOnce(new Error("db")).mockResolvedValueOnce({ submittedAttempts: 0, closedExams: 0 }) };
    const service = new ExpirationService(repository as any);
    await expect(service.sweep()).rejects.toThrow("db");
    await expect(service.sweep()).resolves.toEqual({ submittedAttempts: 0, closedExams: 0 });
  });

  it("inicia e interrompe o agendador periodico", async () => {
    jest.useFakeTimers();
    const service = { sweep: jest.fn<any>().mockResolvedValue({ submittedAttempts: 0, closedExams: 0 }) };
    const stop = startExpirationScheduler(service as any, 1_000);
    await Promise.resolve();
    expect(service.sweep).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(2_000);
    await Promise.resolve();
    expect(service.sweep).toHaveBeenCalledTimes(3);
    stop();
  });

  it("registra erro quando a varredura agendada falha", async () => {
    jest.useFakeTimers();
    const error = new Error("scheduler");
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const service = { sweep: jest.fn<any>().mockRejectedValue(error) };

    const stop = startExpirationScheduler(service as any, 1_000);
    await Promise.resolve();
    await Promise.resolve();

    expect(consoleError).toHaveBeenCalledWith("Expiration sweep failed:", error);
    stop();
    consoleError.mockRestore();
  });
});
