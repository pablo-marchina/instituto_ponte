import { apiRequest } from "../../lib/apiClient";
import { getAuthRequestOptions } from "../auth/auth.request";
import type { ProvaAnalyticsDto } from "./analytics.types";

export function getProvaAnalytics(provaId: string) {
  return apiRequest<ProvaAnalyticsDto>(
    `/provas/${provaId}/analytics`,
    getAuthRequestOptions(),
  );
}
