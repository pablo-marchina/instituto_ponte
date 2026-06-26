import { apiRequest, apiRequestWithMeta, type PaginatedResult } from "../../lib/apiClient";
import { getAuthRequestOptions } from "../auth/auth.request";
import type { MateriaDto } from "../materias/materias.types";
import type {
  CreateProfessorPayload,
  ProfessorDto,
  ProfessorMateriaVinculoDto,
  UpdateProfessorPayload,
} from "./professores.types";

export async function listProfessores() {
  const { data, meta } = await apiRequestWithMeta<ProfessorDto[]>(
    "/professores?limit=100",
    getAuthRequestOptions(),
  );

  return {
    data,
    meta,
  } satisfies PaginatedResult<ProfessorDto>;
}

export function getProfessor(professorId: string) {
  return apiRequest<ProfessorDto>(
    `/professores/${professorId}`,
    getAuthRequestOptions(),
  );
}

export function listProfessorMaterias(professorId: string) {
  return apiRequest<MateriaDto[]>(
    `/professores/${professorId}/materias`,
    getAuthRequestOptions(),
  );
}

export function createProfessor(payload: CreateProfessorPayload) {
  return apiRequest<ProfessorDto>("/professores", {
    ...getAuthRequestOptions(),
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateProfessor(professorId: string, payload: UpdateProfessorPayload) {
  return apiRequest<ProfessorDto>(`/professores/${professorId}`, {
    ...getAuthRequestOptions(),
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteProfessor(professorId: string) {
  return apiRequest<void>(`/professores/${professorId}`, {
    ...getAuthRequestOptions(),
    method: "DELETE",
  });
}

export function vincularProfessorMateria(professorId: string, materiaId: string) {
  return apiRequest<ProfessorMateriaVinculoDto>(`/professores/${professorId}/materias`, {
    ...getAuthRequestOptions(),
    method: "POST",
    body: JSON.stringify({ materiaId }),
  });
}

export function removerProfessorMateria(professorId: string, materiaId: string) {
  return apiRequest<void>(`/professores/${professorId}/materias/${materiaId}`, {
    ...getAuthRequestOptions(),
    method: "DELETE",
  });
}
