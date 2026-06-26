import { apiRequest } from "../../lib/apiClient";
import { getAuthRequestOptions } from "../auth/auth.request";
import type {
  CorrecaoAutomaticaDto,
  CorrecaoQuestaoDto,
  CorrecaoRespostaDto,
  CorrecaoSalvaDto,
  SalvarCorrecaoPayload,
} from "./correcao.types";

export function listarQuestoesCorrecao(provaId: string) {
  return apiRequest<CorrecaoQuestaoDto[]>(
    `/provas/${provaId}/correcao/questoes`,
    getAuthRequestOptions(),
  );
}

export function executarCorrecaoAutomatica(provaId: string) {
  return apiRequest<CorrecaoAutomaticaDto>(
    `/provas/${provaId}/correcao/objetivas`,
    {
      ...getAuthRequestOptions(),
      method: "POST",
    },
  );
}

export function listarRespostasPorQuestao(provaId: string, questaoId: string) {
  return apiRequest<CorrecaoRespostaDto[]>(
    `/provas/${provaId}/questoes/${questaoId}/respostas`,
    getAuthRequestOptions(),
  );
}

export function salvarCorrecao(respostaId: string, payload: SalvarCorrecaoPayload) {
  return apiRequest<CorrecaoSalvaDto>(
    `/respostas/${respostaId}/correcao`,
    {
      ...getAuthRequestOptions(),
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}
