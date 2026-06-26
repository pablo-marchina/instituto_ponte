import { CheckCircle2, Mail } from "lucide-react";
import { Logo } from "./Header";
import type { StudentInfo } from "../App";

interface Props {
  studentInfo: StudentInfo;
}

export function TelaConfirmacao({ studentInfo }: Props) {
  return (
    <div className="flex flex-col min-h-screen bg-[#F2F2F2]">
      {/* Header without sticky — confirmation is final */}
      <header className="bg-white shadow-sm px-4 h-16 flex items-center">
        <Logo />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-8">
        {/* Success icon */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="size-28 rounded-full bg-[#05245F]/8 flex items-center justify-center">
              <div className="size-20 rounded-full bg-[#05245F]/12 flex items-center justify-center">
                <CheckCircle2 size={52} className="text-[#6B6FA3]" strokeWidth={1.5} />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-black text-[#05245F] tracking-tight">FINALIZADO!</h1>
        </div>

        {/* Success message card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 w-full">
          <p className="text-[#000000] text-lg font-semibold leading-relaxed text-center">
            Sua prova foi enviada com sucesso!
          </p>
          <p className="text-[#666666] text-sm text-center mt-2 leading-relaxed">
            Aguarde o feedback via email. O resultado será enviado em até 5 dias úteis.
          </p>

          {studentInfo.email && (
            <div className="mt-5 bg-[#F2F2F2] rounded-xl px-4 py-3 flex items-center gap-3">
              <Mail size={16} className="text-[#6B6FA3] shrink-0" />
              <p className="text-sm text-[#05245F] font-medium truncate">{studentInfo.email}</p>
            </div>
          )}
        </div>

        {/* Additional info */}
        <div className="text-center">
          <p className="text-xs text-[#666666]">
            Você pode fechar esta janela com segurança.
          </p>
          <p className="text-xs text-[#666666] mt-1">
            Guarde o comprovante enviado para o seu email.
          </p>
        </div>

        {/* Branding footer */}
        <div className="mt-auto pt-4">
          <p className="text-xs text-[#666666] text-center">
            Powered by <span className="font-bold text-[#6B6FA3]">corrije ai</span>
          </p>
        </div>
      </div>
    </div>
  );
}