import { useState } from "react";
import { XMarkIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import type { BancoQuestion, Exam } from "../../../../../src/features/dashboard/dashboard.types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  questao: BancoQuestion | null;
  provas: Exam[];
  onAddToProva: (provaId: Exam["id"], questao: BancoQuestion) => void | Promise<void>;
}

export function SelecionarProvaModal({ isOpen, onClose, questao, provas, onAddToProva }: Props) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen || !questao) return null;
  const provasDisponiveis = provas.filter((prova) => !prova.urlAcesso);

  const handleSelectProva = async (provaId: Exam["id"]) => {
    setErrorMessage(null);
    setIsAdding(true);
    try {
      await onAddToProva(provaId, questao);
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel adicionar a questao a prova.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-2xl relative flex flex-col"
        style={{ boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.2)", maxHeight: "80vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: "20px", color: "#6B6FA3" }}>
              Selecionar Prova
            </h2>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#6A7181", marginTop: "4px" }}>
              Escolha em qual prova deseja adicionar esta questão
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:opacity-70 transition-opacity"
            style={{ backgroundColor: "#F2F2F2" }}
          >
            <XMarkIcon className="w-5 h-5" style={{ color: "#6A7181" }} />
          </button>
        </div>

        {/* Questão preview */}
        <div
          className="rounded-xl p-4 mb-4"
          style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}
        >
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#6A7181", marginBottom: "6px" }}>
            Questão selecionada:
          </p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#111", fontWeight: 500 }}>
            {questao.text}
          </p>
        </div>

        {/* Lista de provas */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {errorMessage && (
            <div
              className="rounded-xl p-3"
              style={{ backgroundColor: "#FCE8E6", color: "#9A3412", fontFamily: "Inter, sans-serif", fontSize: "13px" }}
            >
              {errorMessage}
            </div>
          )}
          {provasDisponiveis.length === 0 ? (
            <div className="text-center py-8">
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#B1B4BD" }}>
                Nenhuma prova disponível. Crie uma prova primeiro.
              </p>
            </div>
          ) : (
            provasDisponiveis.map((prova) => (
              <button
                key={prova.id}
                onClick={() => handleSelectProva(prova.id)}
                disabled={isAdding}
                className="w-full text-left p-4 rounded-xl border-2 transition-all hover:border-opacity-70 hover:shadow-md"
                style={{
                  borderColor: "#E5E7EB",
                  backgroundColor: "#FFFFFF",
                  opacity: isAdding ? 0.65 : 1,
                  cursor: isAdding ? "not-allowed" : "pointer",
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex items-center justify-center rounded-lg shrink-0"
                    style={{ width: 40, height: 40, backgroundColor: "#EEF1F8" }}
                  >
                    <DocumentTextIcon className="w-5 h-5" style={{ color: "#6B6FA3" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: "14px", color: "#6B6FA3" }}>
                      {prova.title}
                    </p>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#6A7181", marginTop: "2px" }}>
                      {prova.subject} • {prova.semester}
                    </p>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "#9CA3AF", marginTop: "4px" }}>
                      {prova.submissions} submissões
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 mt-4 border-t" style={{ borderColor: "#E5E7EB" }}>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full transition-opacity hover:opacity-85"
            style={{
              backgroundColor: "#F2F2F2",
              color: "#6A7181",
              fontFamily: "Poppins, sans-serif",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
