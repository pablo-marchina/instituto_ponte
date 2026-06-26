import { apiRequestWithMeta, type PaginatedResult } from "../../lib/apiClient";
import { getAuthRequestOptions } from "../auth/auth.request";
import type { MateriaDto } from "./materias.types";

export async function listMaterias() {
  const { data, meta } = await apiRequestWithMeta<MateriaDto[]>(
    "/materias?limit=100",
    getAuthRequestOptions(),
  );

  return {
    data,
    meta,
  } satisfies PaginatedResult<MateriaDto>;
}
