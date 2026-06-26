export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "BUSINESS_RULE_ERROR"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ApiErrorCode,
    message: string,
    public readonly details: unknown[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const unauthorized = (message = "Usuário não autenticado.") =>
  new ApiError(401, "UNAUTHORIZED", message);

export const forbidden = (message = "Usuário sem permissão para esta ação.") =>
  new ApiError(403, "FORBIDDEN", message);

export const notFound = (message = "Recurso não encontrado.") =>
  new ApiError(404, "NOT_FOUND", message);

export const conflict = (message: string) =>
  new ApiError(409, "CONFLICT", message);

export const businessRule = (message: string) =>
  new ApiError(422, "BUSINESS_RULE_ERROR", message);
