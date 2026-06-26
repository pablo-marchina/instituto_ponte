import { useEffect, useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { nome: string; email: string; cpf: string | null; turma: string | null }) => void;
  isSaving?: boolean;
  turmas?: string[];
  initialData?: {
    nome: string;
    email: string;
    cpf: string | null;
    turma: string | null;
  };
}

export function EditarAlunoModal({ isOpen, onClose, onSave, isSaving, turmas = [], initialData }: Props): JSX.Element | null {
  const [nome, setNome] = useState(initialData?.nome ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [cpf, setCpf] = useState(initialData?.cpf ?? "");
  const [turma, setTurma] = useState(initialData?.turma ?? "");

  useEffect(() => {
    if (!isOpen) return;
    setNome(initialData?.nome ?? "");
    setEmail(initialData?.email ?? "");
    setCpf(initialData?.cpf ?? "");
    setTurma(initialData?.turma ?? "");
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ nome, email, cpf: cpf || null, turma: turma.trim() || null });
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
          Edite as informações do aluno
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

          <div>
            <label
              htmlFor="cpf"
              style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#6A7181", display: "block", marginBottom: "8px" }}
            >
              CPF:
            </label>
            <input
              id="cpf"
              type="text"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              className="w-full px-4 py-3 rounded-lg"
              style={{
                border: "2px solid #D9D9D9",
                fontFamily: "Inter, sans-serif",
                fontSize: "16px",
                color: "#6B6FA3",
              }}
              placeholder="00000000000"
            />
          </div>

          <div>
            <label
              htmlFor="turma"
              style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#6A7181", display: "block", marginBottom: "8px" }}
            >
              Turma:
            </label>
            <select
              id="turma"
              value={turma}
              onChange={(e) => setTurma(e.target.value)}
              className="w-full px-4 py-3 rounded-lg"
              style={{
                border: "2px solid #D9D9D9",
                fontFamily: "Inter, sans-serif",
                fontSize: "16px",
                color: "#6B6FA3",
              }}
            >
              <option value="">Sem turma vinculada</option>
              {turmas.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
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
              cursor: "pointer",
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
              cursor: canSave && !isSaving ? "pointer" : "not-allowed",
            }}
          >
            {isSaving ? "SALVANDO..." : "SALVAR"}
          </button>
        </div>
      </div>
    </div>
  );
}
