import { apiRequest, apiRequestWithMeta, type PaginatedResult } from "../../lib/apiClient";
import { getAuthRequestOptions } from "../auth/auth.request";
import { getStoredAuthSession } from "../auth/auth.storage";
import type {
  CreateProvaPayload,
  AddQuestaoProvaPayload,
  ProvaConfiguracoesDto,
  ProvaDto,
  ProvaQuestaoDto,
  PublicarProvaPayload,
  ReorderQuestaoProvaPayload,
  UpdateProvaConfiguracoesPayload,
  UpdateProvaPayload,
} from "./provas.types";

export async function listProvas() {
  const session = getStoredAuthSession();
  const path = session?.usuario.perfil === "coordenador"
    ? "/coordenador/provas?limit=100"
    : "/provas?limit=100";
  const { data, meta } = await apiRequestWithMeta<ProvaDto[]>(
    path,
    getAuthRequestOptions(),
  );

  return {
    data,
    meta,
  } satisfies PaginatedResult<ProvaDto>;
}

export function createProva(payload: CreateProvaPayload) {
  return apiRequest<ProvaDto>("/provas", {
    ...getAuthRequestOptions(),
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteProva(provaId: string) {
  return apiRequest<void>(`/provas/${provaId}`, {
    ...getAuthRequestOptions(),
    method: "DELETE",
  });
}

export function updateProva(provaId: string, payload: UpdateProvaPayload) {
  return apiRequest<ProvaDto>(`/provas/${provaId}`, {
    ...getAuthRequestOptions(),
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function updateProvaConfiguracoes(
  provaId: string,
  payload: UpdateProvaConfiguracoesPayload,
) {
  return apiRequest<ProvaConfiguracoesDto>(`/provas/${provaId}/configuracoes`, {
    ...getAuthRequestOptions(),
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function publicarProva(provaId: string, payload: PublicarProvaPayload) {
  return apiRequest<ProvaDto>(`/provas/${provaId}/publicar`, {
    ...getAuthRequestOptions(),
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function despublicarProva(provaId: string) {
  return apiRequest<ProvaDto>(`/provas/${provaId}/despublicar`, {
    ...getAuthRequestOptions(),
    method: "POST",
  });
}

export function getProva(provaId: string) {
  return apiRequest<ProvaDto>(`/provas/${provaId}`, getAuthRequestOptions());
}

export function arquivarProva(provaId: string) {
  return apiRequest<ProvaDto>(`/provas/${provaId}/arquivar`, {
    ...getAuthRequestOptions(),
    method: "POST",
  });
}

export function listProvaQuestoes(provaId: string) {
  return apiRequest<ProvaQuestaoDto[]>(
    `/provas/${provaId}/questoes`,
    getAuthRequestOptions(),
  );
}

export function addQuestaoToProva(provaId: string, payload: AddQuestaoProvaPayload) {
  return apiRequest<ProvaQuestaoDto>(`/provas/${provaId}/questoes`, {
    ...getAuthRequestOptions(),
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function removeQuestaoFromProva(provaId: string, questaoId: string) {
  return apiRequest<void>(`/provas/${provaId}/questoes/${questaoId}`, {
    ...getAuthRequestOptions(),
    method: "DELETE",
  });
}

export function reorderQuestaoInProva(
  provaId: string,
  questaoId: string,
  payload: ReorderQuestaoProvaPayload,
) {
  return apiRequest<ProvaQuestaoDto[]>(`/provas/${provaId}/questoes/${questaoId}/ordem`, {
    ...getAuthRequestOptions(),
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
