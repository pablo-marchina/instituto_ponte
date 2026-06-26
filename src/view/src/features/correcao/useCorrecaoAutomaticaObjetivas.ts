import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getStoredAuthSession } from "../auth/auth.storage";
import { executarCorrecaoAutomatica } from "./correcao.api";

export function useCorrecaoAutomaticaObjetivas(provaId: string | null) {
  const queryClient = useQueryClient();
  const session = getStoredAuthSession();
  const canRunAutoCorrection =
    session?.usuario.perfil === "professor" || session?.usuario.perfil === "coordenador";

  return useQuery({
    queryKey: ["correcao", "objetivas", provaId],
    queryFn: async () => {
      const result = await executarCorrecaoAutomatica(provaId!);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["correcao", "questoes", provaId] }),
        queryClient.invalidateQueries({ queryKey: ["correcao", "respostas", provaId] }),
        queryClient.invalidateQueries({ queryKey: ["questoes"] }),
      ]);
      return result;
    },
    enabled: Boolean(provaId && canRunAutoCorrection),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
