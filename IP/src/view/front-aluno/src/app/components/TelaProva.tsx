import { Paperclip, ChevronLeft, ChevronRight, Flag, AlertTriangle } from "lucide-react";
import { MathText } from "../../../../src/components/math/MathText";
import { Header } from "./Header";
import { ZoomableImage } from "./ZoomableImage";
import type { Question, StudentInfo } from "../App";

interface TimeWarningModalProps {
  minutesLeft: number;
  onBack: () => void;
  onFinalize: () => void;
}

function TimeWarningModal({ minutesLeft, onBack, onFinalize }: TimeWarningModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="bg-[#F9B233] px-5 py-4 flex items-center gap-3">
          <AlertTriangle size={22} className="text-[#05245F]" />
          <span className="text-[#05245F] font-bold text-base">Atenção!</span>
        </div>
        <div className="p-5">
          <p className="text-[#05245F] font-semibold text-base leading-relaxed mb-5">
            A prova será encerrada em{" "}
            <span className="text-[#D32F2F] font-bold">{minutesLeft} minutos</span>!
            Revise suas respostas antes do tempo acabar.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="flex-1 border-2 border-[#6B6FA3] text-[#6B6FA3] rounded-lg py-3 font-semibold text-sm active:opacity-80 transition-opacity"
            >
              Voltar para a prova
            </button>
            <button
              onClick={onFinalize}
              className="flex-1 bg-[#D32F2F] text-white rounded-lg py-3 font-semibold text-sm active:opacity-80 transition-opacity"
            >
              Finalizar agora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Props {
  questions: Question[];
  currentQIndex: number;
  timeLeft: string;
  showTimeWarning: boolean;
  onAnswerChange: (index: number, answer: string) => void;
  onToggleMark: (index: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onFinalize: () => void;
  onReviewMarked: () => void;
  onGoToQuestion: (index: number) => void;
  onDismissTimeWarning: () => void;
  onTimeWarningFinalize: () => void;
  onFileUpload: (questaoId: string) => void;
  studentInfo: StudentInfo;
  syncMessage?: string;
  uploadMessage?: string;
}

export function TelaProva({
  questions,
  currentQIndex,
  timeLeft,
  showTimeWarning,
  onAnswerChange,
  onToggleMark,
  onNext,
  onPrev,
  onFinalize,
  onReviewMarked,
  onGoToQuestion,
  onDismissTimeWarning,
  onTimeWarningFinalize,
  onFileUpload,
  syncMessage,
  uploadMessage,
}: Props) {
  const question = questions[currentQIndex];
  const markedCount = questions.filter((q) => q.marked).length;
  const isFirst = currentQIndex === 0;
  const isLast = currentQIndex === questions.length - 1;

  const minutesLeft = Number.parseInt(timeLeft.replace(/\D/g, ""), 10) || 0;

  return (
    <div className="flex flex-col min-h-screen bg-[#F2F2F2]">
      <Header title="Prova" timer={timeLeft} />

      {/* Question navigation strip */}
      <div className="bg-white px-4 py-3 border-b border-[#F2F2F2]">
        <p className="text-[10px] font-bold text-[#05245F] uppercase tracking-wider mb-2">Todas as questões</p>
        <div className="flex items-center gap-2 flex-wrap">
          {questions.map((q, i) => {
            const isCurrent = i === currentQIndex;
            const isAnswered = q.answer.trim().length > 0;
            return (
              <button
                key={q.id}
                onClick={() => onGoToQuestion(i)}
                className={`size-9 rounded-lg text-xs font-bold flex items-center justify-center transition-all ring-offset-1
                  ${isCurrent
                    ? "ring-2 ring-[#6B6FA3] scale-110 " + (isAnswered ? "bg-[#6B6FA3] text-white" : q.marked ? "bg-[#F9B233] text-[#05245F]" : "bg-[#F2F2F2] text-[#05245F]")
                    : q.marked
                    ? "bg-[#F9B233] text-[#05245F]"
                    : isAnswered
                    ? "bg-[#6B6FA3] text-white"
                    : "bg-[#F2F2F2] text-[#666666]"
                  }`}
              >
                {q.displayOrder}
              </button>
            );
          })}
        </div>
        <div className="flex gap-4 mt-2 text-[10px] text-[#666666]">
          <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-[#6B6FA3] inline-block" /> Respondida</span>
          <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-[#F9B233] inline-block" /> Marcada</span>
          <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-[#F2F2F2] border border-[#D9D9D9] inline-block" /> Em branco</span>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 flex flex-col gap-4 overflow-y-auto pb-32">
        {/* Question header */}
        <div className="bg-[#05245F] rounded-xl px-4 py-3">
          <span className="text-white font-bold text-base">Questão {question.displayOrder}</span>
        </div>

        {/* Statement */}
        <div className="bg-white rounded-xl p-4 shadow-sm min-h-[140px]">
          <MathText className="block text-[#000000] text-sm leading-relaxed" emptyText="Enunciado não informado.">
            {question.statement}
          </MathText>
          <ZoomableImage src={question.statementImage} alt={`Imagem do enunciado da questao ${question.displayOrder}`} />
        </div>

        {/* Answer area */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-[#05245F]">Resposta</label>
            {question.type === "discursiva" && question.permiteAnexo && (
              <button
                onClick={() => onFileUpload(question.id)}
                className="flex items-center gap-1.5 text-xs text-[#6B6FA3] bg-[#F2F2F2] px-2.5 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
              >
                <Paperclip size={13} />
                Anexar arquivos
              </button>
            )}
          </div>
          {question.type === "discursiva" ? (
            <textarea
              value={question.answer}
              onChange={(e) => onAnswerChange(currentQIndex, e.target.value)}
              placeholder="Digite aqui sua resposta..."
              className="w-full bg-white border border-[#D9D9D9] rounded-xl p-4 text-sm text-[#000000] placeholder:text-[#666666] outline-none focus:border-[#6B6FA3] transition-colors resize-none min-h-[160px]"
            />
          ) : (
            <div className="flex flex-col gap-2">
              {question.alternatives.map((alternative) => {
                const selected = question.answer === alternative.id;
                return (
                  <div
                    key={alternative.id}
                    role="radio"
                    aria-checked={selected}
                    tabIndex={0}
                    onClick={() => onAnswerChange(currentQIndex, alternative.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onAnswerChange(currentQIndex, alternative.id);
                      }
                    }}
                    className={`w-full text-left rounded-xl px-4 py-3 border-2 transition-all ${
                      selected
                        ? "border-[#6B6FA3] bg-[#6B6FA3]/10"
                        : "border-[#D9D9D9] bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 size-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selected ? "border-[#6B6FA3] bg-[#6B6FA3]" : "border-[#D9D9D9]"
                      }`}>
                        {selected && <span className="size-2 rounded-full bg-white" />}
                      </span>
                      <MathText className="text-sm text-[#000000] leading-relaxed">
                        {alternative.conteudoLatex}
                      </MathText>
                    </div>
                    <ZoomableImage
                      src={alternative.urlImagem}
                      alt={`Imagem da alternativa ${alternative.ordem} da questao ${question.displayOrder}`}
                    />
                  </div>
                );
              })}
            </div>
          )}
          {syncMessage && (
            <p className={`text-xs ${syncMessage.includes("Falha") || syncMessage.includes("não") ? "text-[#D32F2F]" : "text-[#6A7181]"}`}>
              {syncMessage}
            </p>
          )}
          {uploadMessage && (
            <p className={`text-xs ${uploadMessage.includes("Falha") || uploadMessage.includes("não") ? "text-[#D32F2F]" : "text-[#6A7181]"}`}>
              {uploadMessage}
            </p>
          )}
        </div>

        {/* Mark for review */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <div
            onClick={() => onToggleMark(currentQIndex)}
            className={`size-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0
              ${question.marked
                ? "bg-[#6B6FA3] border-[#6B6FA3]"
                : "bg-white border-[#D9D9D9]"
              }`}
          >
            {question.marked && (
              <svg className="text-white" viewBox="0 0 12 12" fill="none" width="12" height="12">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span className="text-sm text-[#000000]">Marcar para revisar</span>
          {question.marked && (
            <Flag size={14} className="text-[#F9B233]" />
          )}
        </label>

        {/* Review marked link */}
        {markedCount > 0 && (
          <button
            onClick={onReviewMarked}
            className="text-center text-xs text-[#6B6FA3] font-semibold underline underline-offset-2"
          >
            REVISAR {markedCount} {markedCount === 1 ? "QUESTÃO MARCADA" : "QUESTÕES MARCADAS"}
          </button>
        )}

      </div>

      {/* Fixed bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#F2F2F2] px-4 py-3 flex gap-2 max-w-[480px] mx-auto shadow-lg">
        <button
          onClick={onPrev}
          disabled={isFirst}
          className={`flex items-center gap-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all
            ${isFirst
              ? "bg-[#F2F2F2] text-[#666666] cursor-not-allowed"
              : "bg-white border-2 border-[#6B6FA3] text-[#6B6FA3] active:opacity-80"
            }`}
        >
          <ChevronLeft size={16} />
          Voltar
        </button>
        <button
          onClick={onFinalize}
          className="flex-1 bg-[#D32F2F] text-white rounded-lg py-3 font-semibold text-sm active:opacity-80 transition-opacity"
        >
          Finalizar
        </button>
        <button
          onClick={onNext}
          disabled={isLast}
          className={`flex items-center gap-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all
            ${isLast
              ? "bg-[#F2F2F2] text-[#666666] cursor-not-allowed"
              : "bg-[#6B6FA3] text-white active:opacity-80"
            }`}
        >
          Avançar
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Time warning modal */}
      {showTimeWarning && (
        <TimeWarningModal
          minutesLeft={Math.max(1, Math.round(minutesLeft))}
          onBack={onDismissTimeWarning}
          onFinalize={onTimeWarningFinalize}
        />
      )}
    </div>
  );
}
