import { apiRequest } from "../../lib/apiClient";
import { getAuthRequestOptions } from "../auth/auth.request";
import type { TurmaDto, TurmaPayload } from "./turmas.types";

export function listTurmas() {
  return apiRequest<TurmaDto[]>("/turmas", getAuthRequestOptions());
}

export function createTurma(payload: TurmaPayload) {
  return apiRequest<TurmaDto>("/turmas", {
    ...getAuthRequestOptions(),
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTurma(turmaId: string, payload: TurmaPayload) {
  return apiRequest<TurmaDto>(`/turmas/${turmaId}`, {
    ...getAuthRequestOptions(),
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteTurma(turmaId: string) {
  return apiRequest<void>(`/turmas/${turmaId}`, {
    ...getAuthRequestOptions(),
    method: "DELETE",
  });
}
