import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildAnexosZip } from "./anexos/anexos.zip";
import {
  createDraftQuestionFromBanco,
  getNextDraftQuestionId,
  getPersistedExamId,
  isDraftQuestionId,
  isPersistedExam,
  isPersistedId,
} from "./dashboard/dashboard.ui-adapter";
import { useAnalyticsSummary } from "./analytics/useAnalyticsSummary";

const { useQueries } = vi.hoisted(() => ({
  useQueries: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueries,
}));

describe("runtime helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("classifica ids persistidos e cria questoes draft incrementais", () => {
    const uuid = "123e4567-e89b-12d3-a456-426614174000";

    expect(isPersistedId(uuid)).toBe(true);
    expect(isPersistedId("draft-question-1")).toBe(false);
    expect(isDraftQuestionId("draft-question-2")).toBe(true);
    expect(isPersistedExam({ id: uuid })).toBe(true);
    expect(getPersistedExamId({ id: "draft", title: "x" } as never)).toBeNull();
    expect(getNextDraftQuestionId([{ id: "draft-question-3" }, { id: uuid }])).toBe("draft-question-4");
    expect(createDraftQuestionFromBanco({
      id: "b1",
      type: "Discursiva",
      materia: "Matematica",
      materiaId: "m1",
      semestre: "Banco",
      dificuldade: "Media",
      text: "Explique",
      answer: "A ser corrigido",
      timesUsed: 0,
      successRate: 0,
    }, [{ id: "draft-question-1" }])).toMatchObject({
      id: "draft-question-2",
      type: "Discursiva",
      text: "Explique",
    });
  });

  it("soma analytics somente de provas persistidas", () => {
    useQueries.mockImplementation(({ queries }) => {
      expect(queries).toHaveLength(1);
      return [
        {
          isLoading: false,
          isError: false,
          data: {
            provaId: "123e4567-e89b-12d3-a456-426614174000",
            totalAlunos: 10,
            acessos: 8,
            inicios: 7,
            envios: 6,
            totalRespostas: 20,
            totalAnexos: 2,
            pendenciasCorrecao: 1,
          },
        },
      ];
    });

    const { result } = renderHook(() => useAnalyticsSummary([
      { id: "draft" },
      { id: "123e4567-e89b-12d3-a456-426614174000" },
    ]));

    expect(result.current.summary).toEqual({
      totalAlunos: 10,
      acessos: 8,
      inicios: 7,
      envios: 6,
      totalRespostas: 20,
      totalAnexos: 2,
      pendenciasCorrecao: 1,
    });
    expect(result.current.analyticsByProvaId.has("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
  });

  it("monta zip de anexos com manifesto e contabiliza downloads falhos", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: true, blob: () => Promise.resolve(new Blob(["ok"])) })
      .mockResolvedValueOnce({ ok: false, status: 404 }));

    const result = await buildAnexosZip([
      {
        id: "a1",
        aluno: "Aluno Ã",
        alunoId: "aluno-1",
        questaoId: "q1",
        respostaId: "r1",
        nomeArquivo: "foto.png",
        mimeType: "image/png",
        tamanhoBytes: 10,
        urlArquivo: "https://files/a1",
        criadoEm: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "a2",
        aluno: "Aluno B",
        alunoId: "aluno-2",
        questaoId: "q2",
        respostaId: "r2",
        nomeArquivo: null,
        mimeType: "application/pdf",
        tamanhoBytes: 20,
        urlArquivo: "https://files/a2",
        criadoEm: "2026-01-01T00:00:00.000Z",
      },
    ], "Prova Final");

    expect(result.filename).toBe("Prova_Final-anexos.zip");
    expect(result.failedCount).toBe(1);
    expect(result.blob).toBeInstanceOf(Blob);
  });
});

