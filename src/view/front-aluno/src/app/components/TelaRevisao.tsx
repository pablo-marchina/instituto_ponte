import { Flag, CheckCircle, ChevronRight } from "lucide-react";
import { Header } from "./Header";
import type { Question } from "../App";

interface Props {
  questions: Question[];
  markedQuestions: Question[];
  timeLeft: string;
  onGoToQuestion: (index: number) => void;
  onBack: () => void;
  onFinalize: () => void;
}

export function TelaRevisao({
  questions,
  markedQuestions,
  timeLeft,
  onGoToQuestion,
  onBack,
  onFinalize,
}: Props) {
  return (
    <div className="flex flex-col min-h-screen bg-[#F2F2F2]">
      <Header title="Revisão" timer={timeLeft} />

      <div className="flex-1 px-4 py-5 flex flex-col gap-4 overflow-y-auto pb-28">
        {/* Section header */}
        <div className="bg-[#05245F] rounded-xl px-4 py-3 flex items-center gap-2">
          <Flag size={16} className="text-[#F9B233]" />
          <span className="text-white font-bold text-sm">Questões marcadas para revisão</span>
          <span className="ml-auto bg-[#F9B233] text-[#05245F] text-xs font-bold px-2 py-0.5 rounded-full">
            {markedQuestions.length}
          </span>
        </div>

        {markedQuestions.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <CheckCircle size={36} className="text-[#6B6FA3] mx-auto mb-3" />
            <p className="text-sm text-[#666666] font-medium">Nenhuma questão marcada para revisão.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {markedQuestions.map((q) => {
              const originalIndex = questions.findIndex((orig) => orig.id === q.id);
              return (
                <button
                  key={q.id}
                  onClick={() => onGoToQuestion(originalIndex)}
                  className="bg-white rounded-xl px-4 py-3.5 shadow-sm flex items-center gap-3 text-left active:opacity-80 transition-opacity"
                >
                  <div className="size-8 rounded-full bg-[#F2F2F2] flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-[#05245F]">{q.displayOrder}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#05245F]">Questão {q.displayOrder}</p>
                    <p className="text-xs text-[#666666] mt-0.5 truncate">{q.statement}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {q.answer.trim() ? (
                      <span className="text-[10px] text-[#6B6FA3] font-semibold bg-[#6B6FA3]/10 px-2 py-0.5 rounded-full">
                        Respondida
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#D32F2F] font-semibold bg-[#D32F2F]/10 px-2 py-0.5 rounded-full">
                        Em branco
                      </span>
                    )}
                    <ChevronRight size={15} className="text-[#666666]" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* All questions summary */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs font-bold text-[#05245F] mb-3 uppercase tracking-wider">Todas as questões</p>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => onGoToQuestion(i)}
                className={`size-9 rounded-lg text-xs font-bold flex items-center justify-center transition-colors
                  ${q.marked
                    ? "bg-[#F9B233] text-[#05245F]"
                    : q.answer.trim()
                    ? "bg-[#6B6FA3] text-white"
                    : "bg-[#F2F2F2] text-[#05245F]"
                  }`}
              >
                {q.displayOrder}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-[#666666]">
            <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-[#6B6FA3] inline-block" /> Respondida</span>
            <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-[#F9B233] inline-block" /> Marcada</span>
            <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-[#F2F2F2] inline-block" /> Em branco</span>
          </div>
        </div>
      </div>

      {/* Fixed bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#F2F2F2] px-4 py-3 flex gap-3 max-w-[480px] mx-auto shadow-lg">
        <button
          onClick={onBack}
          className="flex-1 border-2 border-[#6B6FA3] text-[#6B6FA3] rounded-lg py-3 font-semibold text-sm active:opacity-80 transition-opacity"
        >
          Voltar
        </button>
        <button
          onClick={onFinalize}
          className="flex-1 bg-[#6B6FA3] text-white rounded-lg py-3 font-semibold text-sm active:opacity-80 transition-opacity"
        >
          Finalizar
        </button>
      </div>
    </div>
  );
}
