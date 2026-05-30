import { DatabaseRepository } from "../database/ping.repository.js";

export class HealthService {
  constructor(private readonly databaseRepository = new DatabaseRepository()) {}

  check() {
    return {
      status: "ok",
      service: "corrije-ai-api",
    };
  }

  async database() {
    await this.databaseRepository.ping();
    return {
      database: "ok",
    };
  }
}
