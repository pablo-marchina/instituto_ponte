import { describe, expect, it, jest, beforeEach } from "@jest/globals";

const mockQuery = jest.fn<any>();
jest.unstable_mockModule("../../database/pool.js", () => ({
  pool: { query: mockQuery },
}));

type AuthRepoModule = typeof import("../../repositories/auth.repository.js");
let AuthRepository: AuthRepoModule["AuthRepository"];

beforeEach(async () => {
  jest.resetModules();
  mockQuery.mockReset();
  const mod = await import("../../repositories/auth.repository.js");
  AuthRepository = mod.AuthRepository;
});

describe("AuthRepository - unitário", () => {
  it("deve retornar usuário quando encontrado pelo email", async () => {
    mockQuery.mockResolvedValue({
      rows: [
        { id: "prof-1", nome: "Professor", email: "prof@test.com", perfil: "professor" },
      ],
    });

    const repo = new AuthRepository();
    const result = await repo.findUserByEmail("prof@test.com");

    expect(result).toBeDefined();
    expect(result!.id).toBe("prof-1");
    expect(result!.perfil).toBe("professor");
    expect(result!.nome).toBe("Professor");
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("UNION ALL"),
      ["prof@test.com"],
    );
  });

  it("deve retornar null quando email não encontrado", async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    const repo = new AuthRepository();
    const result = await repo.findUserByEmail("nao-existe@test.com");

    expect(result).toBeNull();
  });

  it("deve dar preferência a professor sobre coordenador (LIMIT 1, ordem UNION)", async () => {
    mockQuery.mockResolvedValue({
      rows: [
        { id: "prof-1", nome: "Professor", email: "email@test.com", perfil: "professor" },
      ],
    });

    const repo = new AuthRepository();
    const result = await repo.findUserByEmail("email@test.com");

    expect(result).toBeDefined();
    expect(result!.perfil).toBe("professor");
  });

  it("deve retornar coordenador se não houver professor", async () => {
    mockQuery.mockResolvedValue({
      rows: [
        { id: "coord-1", nome: "Coordenador", email: "coord@test.com", perfil: "coordenador" },
      ],
    });

    const repo = new AuthRepository();
    const result = await repo.findUserByEmail("coord@test.com");

    expect(result).toBeDefined();
    expect(result!.perfil).toBe("coordenador");
  });
});
