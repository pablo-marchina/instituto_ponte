import { DatabaseRepository } from "../database/ping.repository.js";

/** Health-check da aplicação e banco de dados. */
export class HealthService {
  constructor(private readonly databaseRepository = new DatabaseRepository()) {}

  /**
   * Verifica o status básico da aplicação.
   *
   * @returns Objeto com status "ok" e nome do serviço.
   */
  check() {
    return {
      status: "ok",
      service: "corrije-ai-api",
    };
  }

  /**
   * Verifica a conexão com o banco de dados.
   *
   * @returns Objeto com status "ok" do banco de dados.
   * @throws Error - Se o ping ao banco de dados falhar.
   */
  async database() {
    await this.databaseRepository.ping();
    return {
      database: "ok",
    };
  }
}
