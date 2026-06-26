import { apiRequest } from "../../lib/apiClient";
import { getAuthRequestOptions } from "../auth/auth.request";
import type { EmailEnvioDto, EmailLiberadoDto } from "./emails.types";

export function liberarEmailsResultado(provaId: string, confirmarPendencias = false) {
  return apiRequest<EmailLiberadoDto>(`/provas/${provaId}/resultados/liberar-email`, {
    ...getAuthRequestOptions(),
    method: "POST",
    body: JSON.stringify({ confirmarPendencias }),
  });
}

export function listarEmailsProva(provaId: string) {
  return apiRequest<EmailEnvioDto[]>(`/provas/${provaId}/emails`, getAuthRequestOptions());
}

export function reenviarEmailResultado(emailEnvioId: string) {
  return apiRequest<EmailEnvioDto>(`/emails/${emailEnvioId}/reenviar`, {
    ...getAuthRequestOptions(),
    method: "POST",
  });
}
