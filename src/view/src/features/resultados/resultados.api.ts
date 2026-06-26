import { apiRequest } from "../../lib/apiClient";
import { getAuthRequestOptions } from "../auth/auth.request";
import type { ExportacaoResultadoDto, ExportarResultadoPayload } from "./resultados.types";

export function exportarResultados(provaId: string, payload: ExportarResultadoPayload) {
  return apiRequest<ExportacaoResultadoDto>(`/provas/${provaId}/resultados/exportar`, {
    ...getAuthRequestOptions(),
    method: "POST",
    body: JSON.stringify(payload),
  });
}
