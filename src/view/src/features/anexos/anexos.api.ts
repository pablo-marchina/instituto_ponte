import { apiRequest } from "../../lib/apiClient";
import { getAuthRequestOptions } from "../auth/auth.request";
import type { AnexoExportarItemDto } from "./anexos.types";

export function exportarAnexosProva(provaId: string) {
  return apiRequest<AnexoExportarItemDto[]>(`/provas/${provaId}/anexos/exportar`, {
    ...getAuthRequestOptions(),
    method: "POST",
  });
}
