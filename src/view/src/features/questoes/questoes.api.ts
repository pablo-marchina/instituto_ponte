import { apiRequest, apiRequestWithMeta, type PaginatedResult } from "../../lib/apiClient";
import { getAuthRequestOptions } from "../auth/auth.request";
import type {
  CreateQuestaoPayload,
  ListQuestoesParams,
  QuestaoBancoDto,
  UpdateQuestaoPayload,
} from "./questoes.types";

function buildQuestoesQuery(params: ListQuestoesParams = {}) {
  const searchParams = new URLSearchParams({ limit: "100", ativa: String(params.ativa ?? true) });

  if (params.materiaId) searchParams.set("materiaId", params.materiaId);
  if (params.tipo) searchParams.set("tipo", params.tipo);
  if (params.busca) searchParams.set("busca", params.busca);

  return searchParams.toString();
}

export async function listQuestoes(params: ListQuestoesParams = {}) {
  const { data, meta } = await apiRequestWithMeta<QuestaoBancoDto[]>(
    `/questoes?${buildQuestoesQuery(params)}`,
    getAuthRequestOptions(),
  );

  return {
    data,
    meta,
  } satisfies PaginatedResult<QuestaoBancoDto>;
}

export function createQuestao(payload: CreateQuestaoPayload) {
  return apiRequest<QuestaoBancoDto>("/questoes", {
    ...getAuthRequestOptions(),
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateQuestao(questaoId: string, payload: UpdateQuestaoPayload) {
  return apiRequest<QuestaoBancoDto>(`/questoes/${questaoId}`, {
    ...getAuthRequestOptions(),
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteQuestao(questaoId: string) {
  return apiRequest<void>(`/questoes/${questaoId}`, {
    ...getAuthRequestOptions(),
    method: "DELETE",
  });
}
