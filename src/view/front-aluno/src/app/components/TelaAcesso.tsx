import { useState } from "react";
import { User, Mail, Lock, ChevronRight } from "lucide-react";
import { Header } from "./Header";
import type { StudentInfo } from "../App";

const ACCESS_TIPS = [
  "Use o nome completo conforme consta no seu documento de identificação.",
  "Informe o e-mail cadastrado na sua instituição de ensino.",
  "Digite o CPF do titular da matrícula para confirmar sua identidade.",
];

interface Props {
  onNext: (info: StudentInfo) => void | Promise<void>;
  isLoading?: boolean;
  errorMessage?: string;
}

export function TelaAcesso({ onNext, isLoading = false, errorMessage }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Nome é obrigatório";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "E-mail inválido";
    if (cpf.replace(/\D/g, "").length !== 11)
      errs.cpf = "CPF deve ter 11 dígitos";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    try {
      await onNext({ name: name.trim(), email: email.trim(), cpf });
    } catch {
      // O erro é exibido por errorMessage.
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F2F2F2]">
      <Header title="Acesso" />

      <div className="flex-1 px-4 py-6 flex flex-col gap-6 overflow-y-auto pb-8">
        {/* Brief access instructions */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-[#05245F] px-4 py-3">
            <span className="text-white font-semibold text-sm">Como acessar</span>
          </div>
          <div className="divide-y divide-[#F2F2F2]">
            {ACCESS_TIPS.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <div className="mt-0.5 size-5 rounded-full bg-[#6B6FA3]/10 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-[#6B6FA3]">{i + 1}</span>
                </div>
                <p className="text-sm text-[#000000] leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Nome */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#05245F]">Nome completo</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]">
                <User size={18} />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: "" })); }}
                placeholder="Nome completo"
                className={`w-full bg-white border rounded-lg pl-10 pr-4 py-3 text-sm text-[#000000] placeholder:text-[#666666] outline-none transition-colors
                  ${errors.name ? "border-[#D32F2F]" : "border-[#D9D9D9] focus:border-[#6B6FA3]"}`}
              />
            </div>
            {errors.name && <p className="text-xs text-[#D32F2F]">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#05245F]">E-mail</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]">
                <Mail size={18} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: "" })); }}
                placeholder="email@email.com.br"
                className={`w-full bg-white border rounded-lg pl-10 pr-4 py-3 text-sm text-[#000000] placeholder:text-[#666666] outline-none transition-colors
                  ${errors.email ? "border-[#D32F2F]" : "border-[#D9D9D9] focus:border-[#6B6FA3]"}`}
              />
            </div>
            {errors.email && <p className="text-xs text-[#D32F2F]">{errors.email}</p>}
          </div>

          {/* CPF */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#05245F]">CPF</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]">
                <Lock size={18} />
              </div>
              <input
                type="text"
                value={cpf}
                onChange={(e) => { setCpf(formatCpf(e.target.value)); setErrors((p) => ({ ...p, cpf: "" })); }}
                placeholder="000.000.000-00"
                className={`w-full bg-white border rounded-lg pl-10 pr-4 py-3 text-sm text-[#000000] placeholder:text-[#666666] outline-none transition-colors
                  ${errors.cpf ? "border-[#D32F2F]" : "border-[#D9D9D9] focus:border-[#6B6FA3]"}`}
              />
            </div>
            {errors.cpf && <p className="text-xs text-[#D32F2F]">{errors.cpf}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#6B6FA3] text-white rounded-lg py-4 font-bold text-sm tracking-widest uppercase mt-2 active:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            {isLoading ? "Iniciando..." : "Continuar"}
            <ChevronRight size={18} />
          </button>
          {errorMessage && (
            <p className="text-sm text-[#D32F2F] text-center font-medium">{errorMessage}</p>
          )}
        </form>
      </div>
    </div>
  );
}
