import { CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onContinue: () => void;
}

export function CorrecaoCompletaModal({ isOpen, onClose, onSave, onContinue }: Props) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-md relative flex flex-col"
        style={{ boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.2)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-full"
              style={{ width: 48, height: 48, backgroundColor: "#E6FAF8" }}
            >
              <CheckCircleIcon className="w-6 h-6" style={{ color: "#05245F" }} />
            </div>
            <div>
              <h2 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: "20px", color: "#6B6FA3" }}>
                Correção Finalizada
              </h2>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#6A7181", marginTop: "2px" }}>
                Todas as questões foram corrigidas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:opacity-70 transition-opacity"
            style={{ backgroundColor: "#F2F2F2" }}
          >
            <XMarkIcon className="w-5 h-5" style={{ color: "#6A7181" }} />
          </button>
        </div>

        {/* Content */}
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#6A7181", marginBottom: "24px" }}>
          Você finalizou a correção de todas as questões. Deseja salvar a correção ou continuar revisando?
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onSave}
            className="w-full py-3 rounded-full transition-opacity hover:opacity-85"
            style={{
              backgroundColor: "#F9B233",
              color: "#6B6FA3",
              fontFamily: "Poppins, sans-serif",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            Salvar Correção
          </button>
          <button
            onClick={onContinue}
            className="w-full py-3 rounded-full transition-opacity hover:opacity-85"
            style={{
              backgroundColor: "#F2F2F2",
              color: "#6A7181",
              fontFamily: "Poppins, sans-serif",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            Continuar Corrigindo
          </button>
        </div>
      </div>
    </div>
  );
}
