import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { listarQuestoesCorrecao } from "../../../../../src/features/correcao/correcao.api";
import type { CorrecaoQuestaoDto } from "../../../../../src/features/correcao/correcao.types";
import { useCorrecaoAutomaticaObjetivas } from "../../../../../src/features/correcao/useCorrecaoAutomaticaObjetivas";
import { CorrecaoCompletaModal } from "./CorrecaoCompletaModal";
import { SuccessNotification } from "./SuccessNotification";

interface Props {
  onBack: () => void;
  onNavigateToQuestion: (questaoId: string, tipo: "Alternativa" | "V/F" | "Discursiva") => void;
  provaId: string | null;
  examTitle?: string;
  showCompletionModal?: boolean;
  onResetCompletionModal?: () => void;
}

const tipoToUiType: Record<string, "Alternativa" | "V/F" | "Discursiva"> = {
  multipla_escolha: "Alternativa",
  verdadeiro_falso: "V/F",
  discursiva: "Discursiva",
};

const typeColors: Record<string, { bg: string; color: string }> = {
  Alternativa: { bg: "#EEF1F8", color: "#6B6FA3" },
  "V/F": { bg: "#E6FAF8", color: "#05245F" },
  Discursiva: { bg: "#FFF8E0", color: "#B07D00" },
};

export function ProvaQuestoesCorrecaoPage({
  onBack,
  onNavigateToQuestion,
  provaId,
  examTitle = "Carregando...",
  showCompletionModal = false,
  onResetCompletionModal,
}: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const correcaoAutomaticaQuery = useCorrecaoAutomaticaObjetivas(provaId);
  const shouldWaitAutoCorrection = correcaoAutomaticaQuery.isLoading;

  const questoesQuery = useQuery({
    queryKey: ["correcao", "questoes", provaId],
    queryFn: () => listarQuestoesCorrecao(provaId!),
    enabled: !!provaId && !shouldWaitAutoCorrection,
  });

  const questoes: CorrecaoQuestaoDto[] = questoesQuery.data ?? [];

  const totalCorrigidas = questoes.reduce((acc, q) => acc + q.respostas.corrigidas, 0);
  const totalPendentes = questoes.reduce((acc, q) => acc + q.respostas.total - q.respostas.corrigidas, 0);

  useEffect(() => {
    if (showCompletionModal) {
      setIsModalOpen(true);
    }
  }, [showCompletionModal]);

  const handleSaveCorrection = () => {
    setIsModalOpen(false);
    setShowNotification(true);
    onResetCompletionModal?.();
  };

  const handleContinueCorrection = () => {
    setIsModalOpen(false);
    onResetCompletionModal?.();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    onResetCompletionModal?.();
  };

  return (
    <div className="p-8 flex flex-col gap-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 hover:opacity-70 transition-opacity self-start"
        style={{ color: "#6A7181" }}
      >
        <ArrowLeftIcon className="w-5 h-5" />
        <span style={{ fontFamily: "Poppins, sans-serif", fontWeight: 500, fontSize: "14px" }}>
          Voltar para correções
        </span>
      </button>

      <div>
        <h1 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "24px", color: "#6B6FA3" }}>
          {examTitle}
        </h1>
        {correcaoAutomaticaQuery.isLoading && (
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#6A7181", marginTop: 4 }}>
            Corrigindo questões objetivas automaticamente...
          </p>
        )}
        {correcaoAutomaticaQuery.data && correcaoAutomaticaQuery.data.respostasCorrigidas > 0 && (
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#05245F", marginTop: 4 }}>
            {correcaoAutomaticaQuery.data.respostasCorrigidas} resposta(s) objetiva(s) corrigida(s) automaticamente.
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "28px", color: "#6B6FA3" }}>
            {questoes.length}
          </p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#6A7181" }}>
            Questões na prova
          </p>
        </div>
        <div className="bg-white rounded-xl p-4" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "28px", color: "#05245F" }}>
            {totalCorrigidas}
          </p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#6A7181" }}>
            Total de correções feitas
          </p>
        </div>
        <div className="bg-white rounded-xl p-4" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "28px", color: "#FF6B6B" }}>
            {totalPendentes}
          </p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#6A7181" }}>
            Correções pendentes
          </p>
        </div>
      </div>

      <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", letterSpacing: "0.1em", color: "#6B6FA3", textTransform: "uppercase", fontWeight: 600, marginTop: "8px" }}>
        Selecione a questão para corrigir
      </p>

      <div className="flex flex-col gap-3">
        {questoes.length === 0 ? (
          <div className="bg-white rounded-xl p-8 flex items-center justify-center" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#B1B4BD" }}>
              {shouldWaitAutoCorrection || questoesQuery.isLoading
                ? "Carregando questões..."
                : "Nenhuma questão encontrada nesta prova"}
            </p>
          </div>
        ) : (
          questoes.map((questao) => {
            const pendentes = questao.respostas.total - questao.respostas.corrigidas;
            const progresso = questao.respostas.total > 0
              ? Math.round((questao.respostas.corrigidas / questao.respostas.total) * 100)
              : 0;
            const uiType = tipoToUiType[questao.tipo] ?? "Discursiva";
            const { bg, color } = typeColors[uiType];

            return (
              <button
                key={questao.questaoId}
                onClick={() => onNavigateToQuestion(questao.questaoId, uiType)}
                className="bg-white rounded-xl p-5 flex flex-col gap-4 cursor-pointer hover:shadow-md transition-shadow text-left"
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center rounded-lg shrink-0" style={{ width: 48, height: 48, backgroundColor: "#EEF1F8" }}>
                    <DocumentTextIcon className="w-6 h-6" style={{ color: "#6B6FA3" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-block px-2 py-0.5 rounded-md" style={{ backgroundColor: bg, color, fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: 600 }}>
                        {uiType}
                      </span>
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#B1B4BD" }}>
                        Questão {questao.ordemOriginal}
                      </span>
                    </div>
                    <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: "16px", color: "#6B6FA3" }}>
                      Pontuação máxima: {questao.pontuacaoMax}
                    </p>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#6A7181", marginTop: "4px" }}>
                      {questao.respostas.total} submissões
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg p-3 text-center" style={{ backgroundColor: "#F2F2F2" }}>
                    <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "20px", color: "#05245F" }}>
                      {questao.respostas.corrigidas}
                    </p>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "#6A7181" }}>
                      Corrigidas
                    </p>
                  </div>
                  <div className="rounded-lg p-3 text-center" style={{ backgroundColor: "#F2F2F2" }}>
                    <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "20px", color: "#FF6B6B" }}>
                      {pendentes}
                    </p>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "#6A7181" }}>
                      Pendentes
                    </p>
                  </div>
                  <div className="rounded-lg p-3 text-center" style={{ backgroundColor: "#F2F2F2" }}>
                    <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "20px", color: "#6B6FA3" }}>
                      {progresso}%
                    </p>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "#6A7181" }}>
                      Progresso
                    </p>
                  </div>
                </div>

                <div className="w-full rounded-full h-1.5" style={{ backgroundColor: "#E5E7EB" }}>
                  <div className="h-1.5 rounded-full transition-all" style={{ width: `${progresso}%`, backgroundColor: "#6B6FA3" }} />
                </div>
              </button>
            );
          })
        )}
      </div>

      <CorrecaoCompletaModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveCorrection}
        onContinue={handleContinueCorrection}
      />

      <SuccessNotification
        isVisible={showNotification}
        onClose={() => setShowNotification(false)}
        message="Correção salva com sucesso!"
      />
    </div>
  );
}
