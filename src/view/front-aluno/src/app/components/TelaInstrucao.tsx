import { BookOpen, ChevronRight, BookMarked, Clock, CalendarDays } from "lucide-react";
import type { ProvaPublicaDto } from "../../../../src/features/aluno/aluno.types";
import { Header } from "./Header";

function formatTempo(minutos: number | null): string {
  if (!minutos) return "Sem limite";
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto ? `${horas}h ${resto}min` : `${horas}h`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const DEFAULT_INSTRUCTIONS = [
  "Mantenha-se atento ao cronômetro exibido na tela.",
  "Cada questão deve ser respondida com clareza, objetividade e fundamentação adequada.",
  "Questões deixadas em branco serão registradas como não respondidas.",
  "Após o envio, não será possível editar ou recuperar suas respostas.",
];

interface Props {
  prova: ProvaPublicaDto;
  onStart: () => void;
}

export function TelaInstrucao({ prova, onStart }: Props) {
  const instructions = prova.instrucoes
    ? prova.instrucoes.split(/\n+/).map((item) => item.trim()).filter(Boolean)
    : DEFAULT_INSTRUCTIONS;

  const examInfo = [
    { icon: BookMarked, label: "Prova", value: prova.titulo },
    { icon: Clock, label: "Tempo de prova", value: formatTempo(prova.tempoLimiteMin) },
    { icon: CalendarDays, label: "Início", value: formatDate(prova.dataInicio) },
    { icon: CalendarDays, label: "Fim", value: formatDate(prova.dataFim) },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F2F2F2]">
      <Header title="Instruções de Prova" />

      <div className="flex-1 px-4 py-6 flex flex-col gap-5 overflow-y-auto pb-8">
        <div className="grid grid-cols-2 gap-3">
          {examInfo.map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-white rounded-xl px-4 py-3.5 shadow-sm flex items-center gap-3">
              <div className="size-9 rounded-lg bg-[#6B6FA3]/10 flex items-center justify-center shrink-0">
                <Icon size={18} className="text-[#6B6FA3]" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-[#666666]">{label}</p>
                <p className="text-sm font-bold text-[#000000] truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-[#05245F] px-4 py-3 flex items-center gap-2">
            <BookOpen size={18} className="text-[#6B6FA3]" />
            <span className="text-white font-semibold text-sm">Leia com atenção antes de começar</span>
          </div>
          <div className="divide-y divide-[#F2F2F2]">
            {instructions.map((instruction, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3.5">
                <div className="mt-0.5 size-6 rounded-full bg-[#F2F2F2] flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-[#05245F]">{i + 1}</span>
                </div>
                <p className="text-sm text-[#000000] leading-relaxed">{instruction}</p>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onStart}
          className="w-full bg-[#6B6FA3] text-white rounded-lg py-4 font-bold text-sm tracking-widest uppercase active:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          Começar a prova
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
