import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { getProvaAnalytics } from "./analytics.api";
import type { AnalyticsSummary, ProvaAnalyticsDto } from "./analytics.types";
import { isPersistedId } from "../dashboard/dashboard.ui-adapter";

type ExamLike = {
  id: string | number;
};

const emptySummary: AnalyticsSummary = {
  totalAlunos: 0,
  acessos: 0,
  inicios: 0,
  envios: 0,
  totalRespostas: 0,
  totalAnexos: 0,
  pendenciasCorrecao: 0,
};

function sumAnalytics(items: ProvaAnalyticsDto[]): AnalyticsSummary {
  return items.reduce(
    (acc, item) => ({
      totalAlunos: acc.totalAlunos + item.totalAlunos,
      acessos: acc.acessos + item.acessos,
      inicios: acc.inicios + item.inicios,
      envios: acc.envios + item.envios,
      totalRespostas: acc.totalRespostas + item.totalRespostas,
      totalAnexos: acc.totalAnexos + item.totalAnexos,
      pendenciasCorrecao: acc.pendenciasCorrecao + item.pendenciasCorrecao,
    }),
    emptySummary,
  );
}

export function useAnalyticsSummary(exams: ExamLike[]) {
  const persistedExamIds = useMemo(
    () => exams.map((exam) => String(exam.id)).filter(isPersistedId),
    [exams],
  );

  const queries = useQueries({
    queries: persistedExamIds.map((provaId) => ({
      queryKey: ["analytics", provaId],
      queryFn: () => getProvaAnalytics(provaId),
    })),
  });

  const analytics = queries
    .map((query) => query.data)
    .filter((item): item is ProvaAnalyticsDto => Boolean(item));

  return {
    analyticsByProvaId: new Map(analytics.map((item) => [item.provaId, item])),
    summary: sumAnalytics(analytics),
    isLoading: queries.some((query) => query.isLoading),
    isError: queries.some((query) => query.isError),
    error: queries.find((query) => query.isError)?.error,
  };
}
