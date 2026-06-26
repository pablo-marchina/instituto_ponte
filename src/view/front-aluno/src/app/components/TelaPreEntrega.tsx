import { AlertOctagon, FileText, ChevronRight } from "lucide-react";
import { Header } from "./Header";
import type { Question } from "../App";

interface SubmitWarningModalProps {
  onBack: () => void;
  onSubmit: () => void;
}

function SubmitWarningModal({ onBack, onSubmit }: SubmitWarningModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="bg-[#D32F2F] px-5 py-4 flex items-center gap-3">
          <AlertOctagon size={22} className="text-white" />
          <span className="text-white font-bold text-base">Atenção — Envio Único!</span>
        </div>
        <div className="p-5">
          <p className="text-[#05245F] font-medium text-sm leading-relaxed mb-5">
            Questões em branco <strong>não poderão ser respondidas</strong> após o envio.
            Esta ação é irreversível. Deseja finalizar agora?
          </p>
          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="flex-1 border-2 border-[#6B6FA3] text-[#6B6FA3] rounded-lg py-3 font-semibold text-sm active:opacity-80 transition-opacity"
            >
              Voltar
            </button>
            <button
              onClick={onSubmit}
              className="flex-1 bg-[#D32F2F] text-white rounded-lg py-3 font-semibold text-sm active:opacity-80 transition-opacity"
            >
              Finalizar e enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Props {
  questions: Question[];
  blankQuestions: Question[];
  timeLeft: string;
  showSubmitWarning: boolean;
  isSubmitting?: boolean;
  errorMessage?: string;
  onGoToQuestion: (index: number) => void;
  onBack: () => void;
  onConfirm: () => void;
  onDismissWarning: () => void;
  onSubmit: () => void;
}

export function TelaPreEntrega({
  questions,
  blankQuestions,
  timeLeft,
  showSubmitWarning,
  isSubmitting = false,
  errorMessage,
  onGoToQuestion,
  onBack,
  onConfirm,
  onDismissWarning,
  onSubmit,
}: Props) {
  return (
    <div className="flex flex-col min-h-screen bg-[#F2F2F2]">
      <Header title="Revisão pré-entrega" timer={timeLeft} />

      <div className="flex-1 px-4 py-5 flex flex-col gap-5 overflow-y-auto pb-28">
        {/* Status summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-[#05245F]">{questions.length}</p>
            <p className="text-[10px] text-[#666666] mt-0.5">Total</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-[#6B6FA3]">
              {questions.filter((q) => q.answer.trim()).length}
            </p>
            <p className="text-[10px] text-[#666666] mt-0.5">Respondidas</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-[#D32F2F]">{blankQuestions.length}</p>
            <p className="text-[10px] text-[#666666] mt-0.5">Em branco</p>
          </div>
        </div>

        {/* All questions — with state indicators */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-[#05245F] px-4 py-3 flex items-center gap-2">
            <FileText size={15} className="text-[#6B6FA3]" />
            <span className="text-white font-bold text-sm">Todas as questões</span>
          </div>
          <div className="divide-y divide-[#F2F2F2]">
            {questions.map((q, i) => {
              const isAnswered = q.answer.trim().length > 0;
              const isMarked = q.marked;

              let stateBadge: React.ReactNode;
              if (isMarked && isAnswered) {
                stateBadge = (
                  <span className="text-[10px] font-semibold bg-[#F9B233]/20 text-[#856a00] px-2 py-0.5 rounded-full">
                    Marcada
                  </span>
                );
              } else if (isMarked) {
                stateBadge = (
                  <span className="text-[10px] font-semibold bg-[#F9B233]/20 text-[#856a00] px-2 py-0.5 rounded-full">
                    Em branco · Marcada
                  </span>
                );
              } else if (isAnswered) {
                stateBadge = (
                  <span className="text-[10px] font-semibold bg-[#6B6FA3]/10 text-[#6B6FA3] px-2 py-0.5 rounded-full">
                    Respondida
                  </span>
                );
              } else {
                stateBadge = (
                  <span className="text-[10px] font-semibold bg-[#D32F2F]/10 text-[#D32F2F] px-2 py-0.5 rounded-full">
                    Em branco
                  </span>
                );
              }

              return (
                <button
                  key={q.id}
                  onClick={() => onGoToQuestion(i)}
                  className="w-full flex items-center justify-between px-4 py-3.5 active:bg-[#F9F9F9] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`size-7 rounded-lg flex items-center justify-center shrink-0
                      ${isMarked ? "bg-[#F9B233] " : isAnswered ? "bg-[#6B6FA3] " : "bg-[#F2F2F2] "}`}
                    >
                      <span className={`text-xs font-bold ${isAnswered && !isMarked ? "text-white" : "text-[#05245F]"}`}>
                        {q.displayOrder}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-[#000000]">Questão {q.displayOrder}</p>
                      <p className="text-[10px] text-[#666666] mt-0.5 truncate max-w-[180px]">{q.statement.slice(0, 60)}…</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {stateBadge}
                    <ChevronRight size={14} className="text-[#666666]" />
                  </div>
                </button>
              );
            })}
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
          onClick={onConfirm}
          disabled={isSubmitting}
          className="flex-1 bg-[#6B6FA3] text-white rounded-lg py-3 font-semibold text-sm active:opacity-80 transition-opacity"
        >
          {isSubmitting ? "Enviando..." : "Confirmar envio"}
        </button>
      </div>

      {errorMessage && (
        <div className="fixed bottom-20 left-4 right-4 max-w-[448px] mx-auto bg-white border border-[#D32F2F]/30 rounded-xl px-4 py-3 shadow-lg">
          <p className="text-sm text-[#D32F2F] font-medium">{errorMessage}</p>
        </div>
      )}

      {showSubmitWarning && (
        <SubmitWarningModal onBack={onDismissWarning} onSubmit={onSubmit} />
      )}
    </div>
  );
}
