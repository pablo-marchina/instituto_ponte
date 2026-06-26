import { apiRequest, apiRequestWithMeta, type PaginatedResult } from "../../lib/apiClient";
import { getAuthRequestOptions } from "../auth/auth.request";
import type { AlunoDto, UpdateAlunoPayload } from "./alunos.types";

export async function listAlunos() {
  const { data, meta } = await apiRequestWithMeta<AlunoDto[]>(
    "/alunos?limit=100",
    getAuthRequestOptions(),
  );

  return {
    data,
    meta,
  } satisfies PaginatedResult<AlunoDto>;
}

export function getAluno(alunoId: string) {
  return apiRequest<AlunoDto>(
    `/alunos/${alunoId}`,
    getAuthRequestOptions(),
  );
}

export function updateAluno(alunoId: string, payload: UpdateAlunoPayload) {
  return apiRequest<AlunoDto>(`/alunos/${alunoId}`, {
    ...getAuthRequestOptions(),
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAluno(alunoId: string) {
  return apiRequest<void>(`/alunos/${alunoId}`, {
    ...getAuthRequestOptions(),
    method: "DELETE",
  });
}
