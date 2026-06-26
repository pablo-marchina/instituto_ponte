import { apiRequest, apiRequestWithMeta, type PaginatedResult } from "../../lib/apiClient";
import { getAuthRequestOptions } from "../auth/auth.request";
import type { CreateTemaPayload, TemaDto, UpdateTemaPayload } from "./temas.types";

type ListTemasParams = {
  materiaId?: string;
};

function buildTemasQuery(params: ListTemasParams = {}) {
  const search = new URLSearchParams({ limit: "100" });
  if (params.materiaId) search.set("materiaId", params.materiaId);
  return search.toString();
}

export async function listTemas(params: ListTemasParams = {}) {
  const { data, meta } = await apiRequestWithMeta<TemaDto[]>(
    `/temas?${buildTemasQuery(params)}`,
    getAuthRequestOptions(),
  );

  return {
    data,
    meta,
  } satisfies PaginatedResult<TemaDto>;
}

export function createTema(payload: CreateTemaPayload) {
  return apiRequest<TemaDto>("/temas", {
    ...getAuthRequestOptions(),
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTema(temaId: string, payload: UpdateTemaPayload) {
  return apiRequest<TemaDto>(`/temas/${temaId}`, {
    ...getAuthRequestOptions(),
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteTema(temaId: string) {
  return apiRequest<void>(`/temas/${temaId}`, {
    ...getAuthRequestOptions(),
    method: "DELETE",
  });
}
