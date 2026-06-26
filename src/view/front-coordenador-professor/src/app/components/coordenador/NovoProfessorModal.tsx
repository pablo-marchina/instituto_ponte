import { useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { nome: string; email: string }) => void;
  isSaving?: boolean;
}

export function NovoProfessorModal({ isOpen, onClose, onSave, isSaving }: Props): JSX.Element | null {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ nome, email });
    setNome("");
    setEmail("");
    onClose();
  };

  const canSave = nome.trim().length > 0 && email.trim().length > 0;

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
        <h2
          className="mb-6"
          style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: "20px", color: "#6B6FA3" }}
        >
          Informações do novo professor
        </h2>

        <div className="space-y-4 mb-6">
          <div>
            <label
              htmlFor="nome"
              style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#6A7181", display: "block", marginBottom: "8px" }}
            >
              Nome:
            </label>
            <input
              id="nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-4 py-3 rounded-lg"
              style={{
                border: "2px solid #D9D9D9",
                fontFamily: "Inter, sans-serif",
                fontSize: "16px",
                color: "#6B6FA3",
              }}
              placeholder="Nome completo"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#6A7181", display: "block", marginBottom: "8px" }}
            >
              Email:
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg"
              style={{
                border: "2px solid #D9D9D9",
                fontFamily: "Inter, sans-serif",
                fontSize: "16px",
                color: "#6B6FA3",
              }}
              placeholder="email@exemplo.com"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-full transition-opacity hover:opacity-85"
            style={{
              backgroundColor: "#D9D9D9",
              color: "#6B6FA3",
              fontFamily: "Poppins, sans-serif",
              fontWeight: 600,
              fontSize: "16px",
            }}
          >
            CANCELAR
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || isSaving}
            className="flex-1 py-3 rounded-full transition-opacity hover:opacity-85 disabled:opacity-50"
            style={{
              backgroundColor: "#F9B233",
              color: "#6B6FA3",
              fontFamily: "Poppins, sans-serif",
              fontWeight: 600,
              fontSize: "16px",
            }}
          >
            {isSaving ? "SALVANDO..." : "SALVAR"}
          </button>
        </div>
      </div>
    </div>
  );
}
