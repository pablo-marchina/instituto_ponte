import { describe, expect, it, jest } from "@jest/globals";
import type { AuthUser } from "../../middlewares/auth.js";
import { ProvaQuestaoService } from "../../services/prova-questao.service.js";

const user: AuthUser = { id: "prof-1", nome: "Prof", email: "p@test.com", perfil: "professor" };
const prova = { id: "prova-1", status: "rascunho", materia_id: "mat-1" };
const questao = { id: "q-1", materia_id: "mat-1", tem_enunciado: true };

const makeRepo = () => ({
  findProva: jest.fn<any>().mockResolvedValue(prova),
  hasAccess: jest.fn<any>().mockResolvedValue(true),
  findQuestao: jest.fn<any>().mockResolvedValue(questao),
  hasOrdem: jest.fn<any>().mockResolvedValue(false),
  hasQuestao: jest.fn<any>().mockResolvedValue(false),
  create: jest.fn<any>().mockResolvedValue({ provaId: "prova-1", questaoId: "q-1" }),
  findByProva: jest.fn<any>().mockResolvedValue([questao]),
  delete: jest.fn<any>().mockResolvedValue(undefined),
});

describe("ProvaQuestaoService - unitário", () => {
  it("deve adicionar questão válida à prova em rascunho", async () => {
    const service = new ProvaQuestaoService(makeRepo() as any);

    await expect(service.adicionar("prova-1", { questaoId: "q-1", ordemOriginal: 1, pontuacaoMax: 10 } as any, user)).resolves.toEqual({ provaId: "prova-1", questaoId: "q-1" });
  });

  it("deve lançar notFound quando prova não existe", async () => {
    const repo = makeRepo();
    repo.findProva.mockResolvedValue(null);
    const service = new ProvaQuestaoService(repo as any);

    await expect(service.listar("x", user)).rejects.toThrow("Prova não encontrada.");
  });

  it("deve lançar forbidden quando usuário não tem acesso", async () => {
    const repo = makeRepo();
    repo.hasAccess.mockResolvedValue(false);
    const service = new ProvaQuestaoService(repo as any);

    await expect(service.listar("prova-1", user)).rejects.toThrow("Usuário sem permissão para acessar esta prova.");
  });

  it("deve bloquear alteração quando prova não está em rascunho", async () => {
    const repo = makeRepo();
    repo.findProva.mockResolvedValue({ ...prova, status: "publicada" });
    const service = new ProvaQuestaoService(repo as any);

    await expect(service.adicionar("prova-1", { questaoId: "q-1", ordemOriginal: 1 } as any, user)).rejects.toThrow("Questões só podem ser alteradas em provas com status rascunho.");
  });

  it("deve validar matéria, enunciado, ordem e duplicidade da questão", async () => {
    const repo = makeRepo();
    const service = new ProvaQuestaoService(repo as any);

    repo.findQuestao.mockResolvedValueOnce({ ...questao, materia_id: "outra" });
    await expect(service.adicionar("prova-1", { questaoId: "q-1", ordemOriginal: 1 } as any, user)).rejects.toThrow("A questão não pertence à mesma matéria da prova.");

    repo.findQuestao.mockResolvedValueOnce({ ...questao, tem_enunciado: false });
    await expect(service.adicionar("prova-1", { questaoId: "q-1", ordemOriginal: 1 } as any, user)).rejects.toThrow("A questão precisa ter enunciado antes de ser associada à prova.");

    repo.findQuestao.mockResolvedValue(questao);
    repo.hasOrdem.mockResolvedValueOnce(true);
    await expect(service.adicionar("prova-1", { questaoId: "q-1", ordemOriginal: 1 } as any, user)).rejects.toThrow("Já existe questão nessa ordem para a prova.");

    repo.hasQuestao.mockResolvedValueOnce(true);
    await expect(service.adicionar("prova-1", { questaoId: "q-1", ordemOriginal: 1 } as any, user)).rejects.toThrow("Questão já vinculada à prova.");
  });

  it("deve listar e remover questão vinculada", async () => {
    const repo = makeRepo();
    repo.hasQuestao.mockResolvedValue(true);
    const service = new ProvaQuestaoService(repo as any);

    await expect(service.listar("prova-1", user)).resolves.toEqual([questao]);
    await service.remover("prova-1", "q-1", user);
    expect(repo.delete).toHaveBeenCalledWith("prova-1", "q-1");
  });
});
