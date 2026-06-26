import { PlusIcon, CircleStackIcon } from "@heroicons/react/24/outline";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNovaQuestao: () => void;
  onBancoQuestoes: () => void;
}

export function SelecionarOrigemQuestaoModal({ isOpen, onClose, onNovaQuestao, onBancoQuestoes }: Props): JSX.Element | null {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-8 w-full max-w-md relative"
        style={{ boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.2)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Título */}
        <h2
          className="mb-2"
          style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: "20px", color: "#6B6FA3" }}
        >
          Adicionar Questão
        </h2>
        <p
          className="mb-6"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#6A7181" }}
        >
          Escolha a origem da questão
        </p>

        {/* Opções */}
        <div className="space-y-3">
          {/* Nova Questão */}
          <button
            onClick={() => {
              onNovaQuestao();
              onClose();
            }}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all hover:border-opacity-70"
            style={{
              borderColor: "#F9B233",
              backgroundColor: "#FFFEF5",
            }}
          >
            <div
              className="flex items-center justify-center rounded-lg shrink-0"
              style={{
                width: 48,
                height: 48,
                backgroundColor: "#F9B233",
              }}
            >
              <PlusIcon className="w-6 h-6" style={{ color: "#6B6FA3" }} />
            </div>
            <div className="flex-1 text-left">
              <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: "16px", color: "#6B6FA3" }}>
                Nova Questão
              </p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#6A7181" }}>
                Criar uma questão do zero
              </p>
            </div>
          </button>

          {/* Banco de Questões */}
          <button
            onClick={() => {
              onBancoQuestoes();
              onClose();
            }}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all hover:border-opacity-70"
            style={{
              borderColor: "#05245F",
              backgroundColor: "#F0FFFE",
            }}
          >
            <div
              className="flex items-center justify-center rounded-lg shrink-0"
              style={{
                width: 48,
                height: 48,
                backgroundColor: "#05245F",
              }}
            >
              <CircleStackIcon className="w-6 h-6" style={{ color: "#FFFFFF" }} />
            </div>
            <div className="flex-1 text-left">
              <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: "16px", color: "#6B6FA3" }}>
                Banco de Questões
              </p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#6A7181" }}>
                Selecionar questões já criadas
              </p>
            </div>
          </button>
        </div>

        {/* Botão Cancelar */}
        <button
          onClick={onClose}
          className="w-full mt-6 py-3 rounded-full transition-opacity hover:opacity-85"
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
  );
}
