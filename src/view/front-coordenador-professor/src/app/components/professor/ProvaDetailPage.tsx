import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MathText } from "../../../../../src/components/math/MathText";
import {
  ChevronLeftIcon, ShareIcon, PlusIcon, Bars2Icon, PencilIcon, TrashIcon,
  CheckCircleIcon, ClockIcon, CalendarDaysIcon, AcademicCapIcon, BookOpenIcon,
  UsersIcon, XMarkIcon, BookmarkIcon, DocumentTextIcon, AcademicCapIcon as SemesterIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { CompartilharModal } from "./CompartilharModal";
import { SelecionarOrigemQuestaoModal } from "./SelecionarOrigemQuestaoModal";
import { SelecionarDoBancoModal } from "./SelecionarDoBancoModal";
import { EditarQuestaoProvaModal } from "./EditarQuestaoProvaModal";
import { getProvaAnalytics } from "../../../../../src/features/analytics/analytics.api";
import { listarQuestoesCorrecao } from "../../../../../src/features/correcao/correcao.api";
import { isPersistedId } from "../../../../../src/features/dashboard/dashboard.ui-adapter";
import type { BancoQuestion, Exam } from "../../../../../src/features/dashboard/dashboard.types";
import type { MateriaDto } from "../../../../../src/features/materias/materias.types";
import type { Question, QuestionType } from "../../../../../src/features/questoes/questao.types";
import { confirmDiscardChanges, useUnsavedChangesWarning } from "./useUnsavedChangesWarning";

interface Props {
  onBack: () => void;
  onNavigate?: (tab: string) => void;
  questions: Question[];
  onDeleteQuestion?: (id: Question["id"]) => void;
  onUpdateQuestion?: (question: Question) => void | Promise<void>;
  onReorderQuestion?: (id: Question["id"], targetOrder: number) => void;
  onAddQuestions?: (questions: Question[]) => void | Promise<void>;
  bancoQuestoes?: BancoQuestion[];
  examTitle?: string;
  examSubject?: string;
  examSemester?: string;
  examTurma?: string;
  turmas?: string[];
  examModalidade?: string;
  examTempoProva?: number;
  examDataInicio?: string;
  examDataLimite?: string;
  examOrientacoes?: string;
  selectedExam?: Exam;
  materias?: MateriaDto[];
  onUpdateExam?: (exam: Exam) => void | Promise<void>;
  onPublish?: (dataFim?: string) => void;
  onUnpublish?: () => void;
  showPublishModal?: boolean;
  onClosePublishModal?: () => void;
  isLoading?: boolean;
  errorMessage?: string;
  isUpdatingExam?: boolean;
  updateExamErrorMessage?: string;
  isPublishing?: boolean;
  isUnpublishing?: boolean;
}

type TabId = "questoes" | "submissoes" | "respostas" | "configuracoes";

const tabs: { id: TabId; label: string }[] = [
  { id: "questoes", label: "Questões" },
  { id: "submissoes", label: "Submissões" },
  { id: "respostas", label: "Respostas por questão" },
  { id: "configuracoes", label: "Configurações" },
];

export type { Question, QuestionType } from "../../../../../src/features/questoes/questao.types";

const typeColors: Record<QuestionType, { bg: string; color: string }> = {
  Alternativa: { bg: "#EEF1F8", color: "#6B6FA3" },
  "V/F": { bg: "#E6FAF8", color: "#05245F" },
  Discursiva: { bg: "#FFF8E0", color: "#B07D00" },
};

const modalidades = ["Prova", "Trabalho", "Atividade", "Simulado"];
const turmasPadrao = ["3A", "3B", "Extensivo", "Turma 2026"];
const semestres = ["1º Semestre 2026", "2º Semestre 2025", "1º Semestre 2025", "2º Semestre 2024"];
const duracoes = [
  { label: "30 minutos", value: 30 },
  { label: "45 minutos", value: 45 },
  { label: "1 hora", value: 60 },
  { label: "1h 30min", value: 90 },
  { label: "2 horas", value: 120 },
  { label: "2h 30min", value: 150 },
  { label: "3 horas", value: 180 },
  { label: "4 horas", value: 240 },
  { label: "Sem limite de tempo", value: 0 },
];

function formatTempo(minutos?: number): string {
  if (minutos == null) return "Não definido";
  if (minutos === 0) return "Sem limite";
  if (minutos < 60) return `${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function formatDataLimite(iso?: string): string {
  if (!iso) return "Não definida";
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function toDatetimeLocalInputValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 40,
  backgroundColor: "#F2F3F5",
  border: "1px solid transparent",
  borderRadius: 8,
  padding: "0 13px",
  fontFamily: "Inter, sans-serif",
  fontSize: 14,
  color: "#111",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "Inter, sans-serif",
  fontSize: 13,
  color: "#111",
  marginBottom: 4,
};

const chevron = (
  <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width={16} height={16} viewBox="0 0 16 16" fill="none">
    <path d="M4 6L8 10L12 6" stroke="#6B6B6B" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function TypeBadge({ type }: { type: QuestionType }) {
  const { bg, color } = typeColors[type];
  return (
    <span className="px-2 py-0.5 rounded-md shrink-0" style={{ backgroundColor: bg, color, fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600 }}>
      {type}
    </span>
  );
}

function PointsBadge() {
  return (
    <span className="px-2 py-0.5 rounded-md shrink-0" style={{ backgroundColor: "#F2F2F2", color: "#6A7181", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 500 }}>
      Pontuação: 1,0
    </span>
  );
}

function QuestionCard({
  question,
  index,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onDelete,
  onEdit,
}: {
  question: Question;
  index?: number;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}) {
  return (
    <div className="bg-white rounded-xl p-4 flex gap-3 items-start" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #EBEBEB" }}>
      <div className="flex flex-col gap-1 shrink-0">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={!canMoveUp}
          className="p-1 rounded-md transition-opacity"
          style={{ backgroundColor: "#F2F3F5", opacity: canMoveUp ? 1 : 0.35, cursor: canMoveUp ? "pointer" : "not-allowed" }}
          title="Mover para cima"
        >
          <Bars2Icon className="w-[16px] h-[16px]" style={{ color: "#6B6FA3", transform: "rotate(90deg)" }} />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={!canMoveDown}
          className="p-1 rounded-md transition-opacity"
          style={{ backgroundColor: "#F2F3F5", opacity: canMoveDown ? 1 : 0.35, cursor: canMoveDown ? "pointer" : "not-allowed" }}
          title="Mover para baixo"
        >
          <Bars2Icon className="w-[16px] h-[16px]" style={{ color: "#6B6FA3", transform: "rotate(90deg)" }} />
        </button>
      </div>
      <div className="flex items-center justify-center rounded-full shrink-0" style={{ width: 26, height: 26, backgroundColor: "#EEF1F8" }}>
        <span style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: 13, color: "#6B6FA3" }}>{index ?? question.id}</span>
      </div>
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <div className="flex gap-2 flex-wrap">
          <TypeBadge type={question.type} />
          <PointsBadge />
        </div>
        <MathText style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#111" }}>{question.text}</MathText>
        {question.imageUrl && (
          <img
            src={question.imageUrl}
            alt="Imagem do enunciado"
            className="rounded-xl"
            style={{ width: "100%", maxHeight: 260, objectFit: "contain", border: "1px solid #E6E6E6", backgroundColor: "#F7F8FA" }}
          />
        )}
        {question.options && (
          <div className="flex flex-col gap-1.5">
            {question.options.map((opt) => (
              <div key={opt.letter} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: opt.correct ? "#6B6FA3" : "#F2F3F5" }}>
                {opt.correct && <CheckCircleIcon className="w-[14px] h-[14px] shrink-0" style={{ color: "#F9B233" }} />}
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: opt.correct ? "#fff" : "#333" }}>
                  <strong>{opt.letter})</strong>&nbsp;&nbsp;<MathText>{opt.text}</MathText>
                </span>
              </div>
            ))}
          </div>
        )}
        {question.answer && (
          <p className="px-3 py-2 rounded-xl" style={{ backgroundColor: "#F2F3F5", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#333" }}>
            <span style={{ fontWeight: 600 }}>Resposta: </span>{question.answer}
          </p>
        )}
      </div>
      <div className="flex gap-2 shrink-0">
        <button onClick={onEdit} title="Editar" className="p-1.5 rounded-lg hover:opacity-70 transition-opacity" style={{ backgroundColor: "#EEF1F8" }}>
          <PencilIcon className="w-[14px] h-[14px]" style={{ color: "#6B6FA3" }} />
        </button>
        <button onClick={onDelete} title="Excluir" className="p-1.5 rounded-lg hover:opacity-70 transition-opacity" style={{ backgroundColor: "#FEE2E2" }}>
          <TrashIcon className="w-[14px] h-[14px]" style={{ color: "#EF4444" }} />
        </button>
      </div>
    </div>
  );
}

interface EditModalProps {
  exam: Exam;
  turmas?: string[];
  materias?: MateriaDto[];
  onClose: () => void;
  onSave: (exam: Exam) => void | Promise<void>;
  isSaving?: boolean;
  errorMessage?: string;
}

function EditarDadosProvaModal({ exam, turmas = [], materias = [], onClose, onSave, isSaving = false, errorMessage }: EditModalProps) {
  const [nome, setNome] = useState(exam.title);
  const [modalidade, setModalidade] = useState(exam.modalidade || "");
  const [materiaId, setMateriaId] = useState(exam.materiaId || "");
  const [turma, setTurma] = useState(exam.turma || "");
  const [semestre, setSemestre] = useState(exam.semester || "");
  const [tempoProva, setTempoProva] = useState(exam.tempoProva != null ? String(exam.tempoProva) : "");
  const [orientacoes, setOrientacoes] = useState(exam.orientacoes || "");
  const [embaralharQuestoes, setEmbaralharQuestoes] = useState(exam.embaralharQuestoes ?? false);
  const [embaralharAlternativas, setEmbaralharAlternativas] = useState(exam.embaralharAlternativas ?? false);
  const turmaOptions = Array.from(new Set([exam.turma, ...turmas, ...turmasPadrao].map((item) => item?.trim()).filter(Boolean) as string[])).sort();

  const selectedMateriaName = materias.find((materia) => materia.id === materiaId)?.nome ?? exam.discipline ?? "";
  const canSave = nome.trim() !== "" && turma.trim() !== "" && semestre !== "" && !isSaving;
  const hasUnsavedChanges =
    nome !== exam.title ||
    modalidade !== (exam.modalidade || "") ||
    materiaId !== (exam.materiaId || "") ||
    turma !== (exam.turma || "") ||
    semestre !== (exam.semester || "") ||
    tempoProva !== (exam.tempoProva != null ? String(exam.tempoProva) : "") ||
    orientacoes !== (exam.orientacoes || "") ||
    embaralharQuestoes !== (exam.embaralharQuestoes ?? false) ||
    embaralharAlternativas !== (exam.embaralharAlternativas ?? false);

  useUnsavedChangesWarning(hasUnsavedChanges && !isSaving);

  function handleClose() {
    if (confirmDiscardChanges(hasUnsavedChanges)) onClose();
  }

  async function handleSave() {
    if (!canSave) return;
    try {
      await onSave({
        ...exam,
        title: nome.trim(),
        modalidade: modalidade || exam.modalidade,
        materiaId: materiaId || exam.materiaId,
        discipline: selectedMateriaName,
        subject: selectedMateriaName,
        turma,
        semester: semestre || exam.semester,
        tempoProva: tempoProva !== "" ? Number(tempoProva) : undefined,
        dataInicio: exam.dataInicio,
        dataLimite: exam.dataLimite,
        orientacoes: orientacoes.trim() || undefined,
        embaralharQuestoes,
        embaralharAlternativas,
      });
    } catch {
      // O erro já é exibido pelo estado da mutation no modal.
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-2xl flex flex-col w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" style={{ border: "1px solid #E6E6E6", boxShadow: "0 8px 32px rgba(0,0,0,0.14)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5" style={{ borderBottom: "1px solid #E6E6E6" }}>
          <h2 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: 18, color: "#111" }}>Editar Dados da Prova</h2>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:opacity-70 transition-opacity" style={{ backgroundColor: "#F2F3F5" }}>
            <XMarkIcon className="w-5 h-5" style={{ color: "#6B6B6B" }} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-5 px-8 py-6">
          {/* Nome */}
          <div className="flex flex-col gap-1">
            <label style={labelStyle}>Nome da Prova *</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Prova de Cálculo — 1ª Unidade" style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = "#05245F"; e.target.style.backgroundColor = "#fff"; }}
              onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = "#F2F3F5"; }} />
          </div>

          {/* Modalidade + Disciplina */}
          <div className="flex gap-4">
            <div className="flex flex-col gap-1 w-full">
              <label style={labelStyle}>Modalidade</label>
              <div className="relative w-full">
                <select value={modalidade} onChange={(e) => setModalidade(e.target.value)} style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
                  onFocus={(e) => { e.target.style.borderColor = "#05245F"; e.target.style.backgroundColor = "#fff"; }}
                  onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = "#F2F3F5"; }}>
                  <option value="">Selecionar</option>
                  {modalidades.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                {chevron}
              </div>
            </div>
            <div className="flex flex-col gap-1 w-full">
              <label style={labelStyle}>Disciplina</label>
              <div className="relative w-full">
                <select
                  value={materiaId}
                  onChange={(e) => setMateriaId(e.target.value)}
                  disabled={materias.length === 0}
                  style={{ ...inputStyle, appearance: "none", cursor: materias.length > 0 ? "pointer" : "not-allowed" }}
                  onFocus={(e) => { e.target.style.borderColor = "#05245F"; e.target.style.backgroundColor = "#fff"; }}
                  onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = "#F2F3F5"; }}
                >
                  {!materiaId && <option value="">Selecionar disciplina</option>}
                  {materias.length === 0 && <option value={exam.materiaId ?? ""}>{exam.discipline || "Materia atual"}</option>}
                  {materias.map((materia) => <option key={materia.id} value={materia.id}>{materia.nome}</option>)}
                </select>
                {chevron}
              </div>
            </div>
          </div>

          {/* Turma + Semestre */}
          <div className="flex gap-4">
            <div className="flex flex-col gap-1 w-full">
              <label style={labelStyle}>Turma</label>
              <div className="relative w-full">
                <select value={turma} onChange={(e) => setTurma(e.target.value)} style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
                  onFocus={(e) => { e.target.style.borderColor = "#05245F"; e.target.style.backgroundColor = "#fff"; }}
                  onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = "#F2F3F5"; }}>
                  <option value="">Selecionar turma</option>
                  {turmaOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
                {chevron}
              </div>
            </div>
            <div className="flex flex-col gap-1 w-full">
              <label style={labelStyle}>Semestre</label>
              <div className="relative w-full">
                <select value={semestre} onChange={(e) => setSemestre(e.target.value)} style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
                  onFocus={(e) => { e.target.style.borderColor = "#05245F"; e.target.style.backgroundColor = "#fff"; }}
                  onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = "#F2F3F5"; }}>
                  <option value="">Selecionar</option>
                  {semestres.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {chevron}
              </div>
            </div>
          </div>

          {/* Tempo + Data limite */}
          <div className="flex gap-4">
            <div className="flex flex-col gap-1 w-full">
              <label style={labelStyle} className="flex items-center gap-1.5">
                <ClockIcon style={{ width: 14, height: 14, color: "#05245F" }} />
                Tempo de Prova
              </label>
              <div className="relative w-full">
                <select value={tempoProva} onChange={(e) => setTempoProva(e.target.value)} style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
                  onFocus={(e) => { e.target.style.borderColor = "#05245F"; e.target.style.backgroundColor = "#fff"; }}
                  onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = "#F2F3F5"; }}>
                  <option value="">Selecionar duração</option>
                  {duracoes.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
                {chevron}
              </div>
            </div>
            <div className="flex flex-col gap-3 w-full justify-end">
              <label className="flex items-center gap-2" style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#111" }}>
                <input type="checkbox" checked={embaralharQuestoes} onChange={(e) => setEmbaralharQuestoes(e.target.checked)} />
                Embaralhar questões
              </label>
              <label className="flex items-center gap-2" style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#111" }}>
                <input type="checkbox" checked={embaralharAlternativas} onChange={(e) => setEmbaralharAlternativas(e.target.checked)} />
                Embaralhar alternativas
              </label>
            </div>
          </div>

          {/* Orientações */}
          <div className="flex flex-col gap-1">
            <label style={labelStyle}>Orientações (opcional)</label>
            <textarea rows={4} value={orientacoes} onChange={(e) => setOrientacoes(e.target.value)} placeholder="Instruções gerais para os alunos..."
              style={{ width: "100%", backgroundColor: "#F2F3F5", border: "1px solid transparent", borderRadius: 8, padding: "10px 13px", fontFamily: "Inter, sans-serif", fontSize: 14, color: "#111", outline: "none", resize: "none" }}
              onFocus={(e) => { e.target.style.borderColor = "#05245F"; e.target.style.backgroundColor = "#fff"; }}
              onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = "#F2F3F5"; }} />
          </div>

          {errorMessage && (
            <div className="rounded-lg px-4 py-3" style={{ backgroundColor: "#FCE8E6", color: "#9A3412", fontFamily: "Inter, sans-serif", fontSize: 13 }}>
              {errorMessage}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-8 py-5" style={{ borderTop: "1px solid #E6E6E6" }}>
          <button onClick={handleClose} className="px-5 py-2.5 rounded-lg hover:opacity-80 transition-opacity"
            style={{ border: "1px solid #E6E6E6", backgroundColor: "#fff", fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 14, color: "#111" }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={!canSave} className="flex items-center gap-2 px-5 py-2.5 rounded-lg transition-opacity"
            style={{ backgroundColor: canSave ? "#6B6FA3" : "#B1B4BD", fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 14, color: "#fff", cursor: canSave ? "pointer" : "not-allowed" }}>
            <BookmarkIcon className="w-[15px] h-[15px]" style={{ color: "#fff" }} />
            {isSaving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PublicarProvaModal({
  onClose,
  onConfirm,
  isPublishing,
  errorMessage,
}: {
  onClose: () => void;
  onConfirm: (dataFim: string) => void;
  isPublishing?: boolean;
  errorMessage?: string;
}) {
  const [dataFim, setDataFim] = useState("");
  const [localError, setLocalError] = useState("");
  const minDatetime = toDatetimeLocalInputValue(new Date(Date.now() + 60000));

  function handleConfirm() {
    const date = new Date(dataFim);
    if (!dataFim || Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
      setLocalError("Informe uma data limite futura para publicar a prova.");
      return;
    }

    setLocalError("");
    onConfirm(date.toISOString());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-2xl flex flex-col w-full max-w-md mx-4" style={{ border: "1px solid #E6E6E6", boxShadow: "0 8px 32px rgba(0,0,0,0.14)" }}>
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid #E6E6E6" }}>
          <h2 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: 18, color: "#111" }}>Publicar prova</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:opacity-70 transition-opacity" style={{ backgroundColor: "#F2F3F5" }}>
            <XMarkIcon className="w-5 h-5" style={{ color: "#6B6B6B" }} />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-6 py-5">
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#6A7181", lineHeight: 1.5 }}>
            A prova ficará disponível imediatamente. Defina uma data limite futura para encerrar o acesso dos alunos.
          </p>
          <div className="flex flex-col gap-1.5">
            <label style={labelStyle} className="flex items-center gap-1.5">
              <CalendarDaysIcon style={{ width: 14, height: 14, color: "#05245F" }} />
              Data e hora limite
            </label>
            <input
              type="datetime-local"
              value={dataFim}
              min={minDatetime}
              onChange={(e) => setDataFim(e.target.value)}
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = "#05245F"; e.target.style.backgroundColor = "#fff"; }}
              onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = "#F2F3F5"; }}
            />
          </div>
          {(localError || errorMessage) && (
            <div className="rounded-lg px-4 py-3" style={{ backgroundColor: "#FCE8E6", color: "#9A3412", fontFamily: "Inter, sans-serif", fontSize: 13 }}>
              {localError || errorMessage}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-5" style={{ borderTop: "1px solid #E6E6E6" }}>
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg hover:opacity-80 transition-opacity"
            style={{ border: "1px solid #E6E6E6", backgroundColor: "#fff", fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 14, color: "#111" }}>
            Cancelar
          </button>
          <button onClick={handleConfirm} disabled={isPublishing} className="flex items-center gap-2 px-5 py-2.5 rounded-lg transition-opacity"
            style={{ backgroundColor: isPublishing ? "#B1B4BD" : "#6B6FA3", fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14, color: "#fff", cursor: isPublishing ? "not-allowed" : "pointer" }}>
            <ShareIcon className="w-[15px] h-[15px]" style={{ color: "#fff" }} />
            {isPublishing ? "Publicando..." : "Publicar agora"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProvaDetailPage({
  onBack, onNavigate, questions, onDeleteQuestion, onUpdateQuestion, onReorderQuestion, onAddQuestions,
  bancoQuestoes = [], examTitle = "Título da Prova", examSubject = "", examSemester = "",
  examTurma, turmas = [], examModalidade, examTempoProva, examDataInicio, examDataLimite, examOrientacoes,
  selectedExam, materias = [], onUpdateExam, onPublish, onUnpublish, showPublishModal = false, onClosePublishModal,
  isLoading = false, errorMessage, isUpdatingExam = false, updateExamErrorMessage, isPublishing = false, isUnpublishing = false,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("questoes");
  const [showOrigemModal, setShowOrigemModal] = useState(false);
  const [showBancoModal, setShowBancoModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showEditExam, setShowEditExam] = useState(false);
  const [showPublishSchedule, setShowPublishSchedule] = useState(false);
  const [editTempo, setEditTempo] = useState("");
  const [editEmbaralharQuestoes, setEditEmbaralharQuestoes] = useState(false);
  const [editEmbaralharAlternativas, setEditEmbaralharAlternativas] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  // Estado local do exam — fonte da verdade para exibição nesta página
  const buildExamFromProps = (): Exam => selectedExam ?? {
    id: "",
    title: examTitle,
    modalidade: examModalidade || "",
    discipline: examSubject,
    subject: examSubject,
    turma: examTurma || "",
    semester: examSemester,
    badge: "Rascunho",
    submissions: "0",
    tempoProva: examTempoProva,
    dataInicio: examDataInicio,
    dataLimite: examDataLimite,
    orientacoes: examOrientacoes,
  };

  const [localExam, setLocalExam] = useState<Exam>(buildExamFromProps);
  const provaId = isPersistedId(localExam.id) ? localExam.id : null;

  const analyticsQuery = useQuery({
    queryKey: ["analytics", provaId],
    queryFn: () => getProvaAnalytics(provaId ?? ""),
    enabled: Boolean(provaId),
  });

  const correcaoQuestoesQuery = useQuery({
    queryKey: ["correcao", "questoes", provaId],
    queryFn: () => listarQuestoesCorrecao(provaId ?? ""),
    enabled: Boolean(provaId),
  });

  const analytics = analyticsQuery.data;
  const questoesCorrecao = correcaoQuestoesQuery.data ?? [];
  const totalCorrigidas = questoesCorrecao.reduce((acc, questao) => acc + questao.respostas.corrigidas, 0);
  const totalRespostasCorrecao = questoesCorrecao.reduce((acc, questao) => acc + questao.respostas.total, 0);
  const percentualEnvios = analytics?.totalAlunos
    ? Math.round((analytics.envios / analytics.totalAlunos) * 100)
    : 0;

  // Sincroniza quando selectedExam muda (ex: ao entrar na página de uma prova diferente)
  useEffect(() => {
    setLocalExam(buildExamFromProps());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExam]);

  useEffect(() => {
    if (showPublishModal) setShowPublishSchedule(false);
  }, [showPublishModal]);

  // Sincroniza o estado do formulário de configurações com o localExam
  useEffect(() => {
    setEditTempo(localExam.tempoProva != null ? String(localExam.tempoProva) : "");
    setEditEmbaralharQuestoes(localExam.embaralharQuestoes ?? false);
    setEditEmbaralharAlternativas(localExam.embaralharAlternativas ?? false);
  }, [localExam]);

  const handleUpdateQuestion = async (updatedQuestion: Question) => {
    await onUpdateQuestion?.(updatedQuestion);
    setEditingQuestion(null);
  };

  const handleSaveConfig = async () => {
    setConfigError(null);
    setSavingConfig(true);
    try {
      const updated: Exam = {
        ...localExam,
        tempoProva: editTempo !== "" ? Number(editTempo) : undefined,
        dataInicio: localExam.dataInicio,
        dataLimite: localExam.dataLimite,
        embaralharQuestoes: editEmbaralharQuestoes,
        embaralharAlternativas: editEmbaralharAlternativas,
      };
      await onUpdateExam?.(updated);
      setLocalExam(updated);
    } catch (err) {
      setConfigError(err instanceof Error ? err.message : "Erro ao salvar configurações.");
    } finally {
      setSavingConfig(false);
    }
  };

  const infoCards = [
    { icon: <BookOpenIcon className="w-4 h-4" style={{ color: "#05245F" }} />, label: "Modalidade", value: localExam.modalidade || "—" },
    { icon: <AcademicCapIcon className="w-4 h-4" style={{ color: "#05245F" }} />, label: "Disciplina", value: localExam.subject || "—" },
    { icon: <UsersIcon className="w-4 h-4" style={{ color: "#05245F" }} />, label: "Turma", value: localExam.turma || "—" },
    { icon: <SemesterIcon className="w-4 h-4" style={{ color: "#05245F" }} />, label: "Semestre", value: localExam.semester || "—" },
    { icon: <ClockIcon className="w-4 h-4" style={{ color: "#05245F" }} />, label: "Tempo de prova", value: formatTempo(localExam.tempoProva) },
    { icon: <CalendarDaysIcon className="w-4 h-4" style={{ color: "#05245F" }} />, label: "Início", value: formatDataLimite(localExam.dataInicio) },
    { icon: <CalendarDaysIcon className="w-4 h-4" style={{ color: "#05245F" }} />, label: "Data limite", value: formatDataLimite(localExam.dataLimite) },
  ];

  return (
    <>
      {showPublishModal && localExam.urlAcesso && (
        <CompartilharModal
          onClose={onClosePublishModal ?? (() => undefined)}
          urlAcesso={localExam.urlAcesso}
          qrCode={localExam.qrCode}
        />
      )}
      {showPublishSchedule && !localExam.urlAcesso && (
        <PublicarProvaModal
          onClose={() => setShowPublishSchedule(false)}
          onConfirm={(dataFim) => onPublish?.(dataFim)}
          isPublishing={isPublishing}
          errorMessage={errorMessage}
        />
      )}
      <SelecionarOrigemQuestaoModal
        isOpen={showOrigemModal}
        onClose={() => setShowOrigemModal(false)}
        onNovaQuestao={() => onNavigate?.("nova-questao")}
        onBancoQuestoes={() => setShowBancoModal(true)}
      />
      <SelecionarDoBancoModal
        isOpen={showBancoModal}
        onClose={() => setShowBancoModal(false)}
        onAddQuestions={(qs) => onAddQuestions?.(qs)}
        bancoQuestoes={bancoQuestoes}
      />
      <EditarQuestaoProvaModal
        isOpen={editingQuestion !== null}
        onClose={() => setEditingQuestion(null)}
        questao={editingQuestion}
        onSave={handleUpdateQuestion}
      />
      {showEditExam && (
        <EditarDadosProvaModal
          exam={localExam}
          turmas={turmas}
          materias={materias}
          onClose={() => setShowEditExam(false)}
          isSaving={isUpdatingExam}
          errorMessage={updateExamErrorMessage}
          onSave={async (updated) => {
            await onUpdateExam?.(updated);
            setLocalExam(updated);
            setShowEditExam(false);
          }}
        />
      )}

      <div className="p-8 flex flex-col gap-6">
        {/* Back link */}
        <button onClick={onBack} className="flex items-center gap-1.5 hover:opacity-70 transition-opacity self-start"
          style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 14, color: "#6B6B6B" }}>
          <ChevronLeftIcon className="w-4 h-4" style={{ color: "#6B6B6B" }} />
          Voltar para provas
        </button>

        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: 20, color: "#000" }}>{localExam.title}</h1>
            {(localExam.subject || localExam.semester) && (
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#575454" }}>
                {[localExam.subject, localExam.semester].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowEditExam(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-85 transition-opacity"
              style={{ border: "1.5px solid #E6E6E6", color: "#6B6FA3", backgroundColor: "#fff", fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: 14 }}
            >
              <PencilIcon className="w-[15px] h-[15px]" />
              Editar dados
            </button>
            <button
              onClick={() => {
                if (localExam.urlAcesso) onPublish?.();
                else setShowPublishSchedule(true);
              }}
              disabled={isPublishing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-85 transition-opacity"
              style={{ border: "1.5px solid #6B6FA3", color: "#6B6FA3", backgroundColor: "#fff", fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: 14, opacity: isPublishing ? 0.65 : 1, cursor: isPublishing ? "not-allowed" : "pointer" }}
            >
              <ShareIcon className="w-[15px] h-[15px]" />
              {isPublishing ? "Publicando..." : localExam.urlAcesso ? "Compartilhar" : "Publicar"}
            </button>
            {localExam.urlAcesso && (
              <button
                onClick={onUnpublish}
                disabled={isUnpublishing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-85 transition-opacity"
                style={{ border: "1.5px solid #EF4444", color: "#EF4444", backgroundColor: "#fff", fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: 14, opacity: isUnpublishing ? 0.65 : 1, cursor: isUnpublishing ? "not-allowed" : "pointer" }}
              >
                <XMarkIcon className="w-[15px] h-[15px]" />
                {isUnpublishing ? "Cancelando..." : "Cancelar publicacao"}
              </button>
            )}
            {!localExam.urlAcesso && (
              <button
                onClick={() => setShowOrigemModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-85 transition-opacity"
                style={{ backgroundColor: "#F9B233", color: "#6B6FA3", fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
              >
                <PlusIcon className="w-4 h-4" />
                Adicionar questao
              </button>
            )}
          </div>
        </div>

        {isLoading && (
          <div className="bg-white rounded-xl p-4" style={{ border: "1px solid #E6E6E6" }}>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#6A7181" }}>
              Carregando dados da prova...
            </p>
          </div>
        )}

        {errorMessage && (
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: "#FCE8E6", color: "#9A3412", fontFamily: "Inter, sans-serif", fontSize: 14 }}
          >
            {errorMessage}
          </div>
        )}

        {/* Info cards */}
        <div className="flex flex-wrap gap-3">
          {infoCards.map((item) => (
            <div key={item.label} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white" style={{ border: "1px solid #E6E6E6", minWidth: 150 }}>
              <div className="flex items-center justify-center rounded-lg shrink-0" style={{ width: 32, height: 32, backgroundColor: "#E6FAF8" }}>
                {item.icon}
              </div>
              <div className="flex flex-col">
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#9B9B9B" }}>{item.label}</span>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "#111" }}>{item.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Orientações — sempre visível */}
        <div className="bg-white rounded-xl px-5 py-4 flex gap-3" style={{ border: "1px solid #E6E6E6" }}>
          <div className="flex items-start justify-center rounded-lg shrink-0 mt-0.5" style={{ width: 32, height: 32, backgroundColor: "#FFF8E0" }}>
            <DocumentTextIcon className="w-4 h-4 mt-[7px]" style={{ color: "#B07D00" }} />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: "#B07D00" }}>Orientações aos alunos</span>
            {localExam.orientacoes ? (
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#444", lineHeight: 1.6 }}>{localExam.orientacoes}</p>
            ) : (
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#B1B4BD", fontStyle: "italic" }}>
                Nenhuma orientação cadastrada. Clique em "Editar dados" para adicionar.
              </p>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 rounded-xl self-start" style={{ backgroundColor: "#fff", border: "1px solid #D7D7D9" }}>
          {tabs.map((tab) => {
            const label = tab.id === "questoes" ? `Questões (${questions.length})` : tab.label;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="px-4 py-2 rounded-lg transition-all"
                style={{ backgroundColor: activeTab === tab.id ? "#F9B233" : "transparent", color: activeTab === tab.id ? "#6B6FA3" : "#6A7181", fontFamily: "Poppins, sans-serif", fontWeight: activeTab === tab.id ? 600 : 400, fontSize: 13 }}>
                {label}
              </button>
            );
          })}
        </div>

        {/* Questions list */}
        {activeTab === "questoes" && (
          <div className="flex flex-col gap-4">
            {questions.map((q, i) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={i + 1}
                canMoveUp={i > 0}
                canMoveDown={i < questions.length - 1}
                onMoveUp={() => onReorderQuestion?.(q.id, i)}
                onMoveDown={() => onReorderQuestion?.(q.id, i + 2)}
                onEdit={() => setEditingQuestion(q)}
                onDelete={() => onDeleteQuestion?.(q.id)}
              />
            ))}
          </div>
        )}

        {activeTab === "submissoes" && (
          <div className="bg-white rounded-xl p-5 flex flex-col gap-4" style={{ border: "1px solid #E6E6E6" }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: 16, color: "#6B6FA3" }}>
                  Submissões da prova
                </h3>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#6A7181", marginTop: 4 }}>
                  Acompanhe acessos, inícios e envios registrados pelo backend.
                </p>
              </div>
              <ChartBarIcon className="w-6 h-6" style={{ color: "#05245F" }} />
            </div>

            {!provaId ? (
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#B1B4BD" }}>
                Salve a prova para acompanhar submissões reais.
              </p>
            ) : analyticsQuery.isLoading ? (
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#6A7181" }}>Carregando métricas...</p>
            ) : analyticsQuery.isError ? (
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#9A3412" }}>
                Não foi possível carregar as submissões.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Alunos", value: analytics?.totalAlunos ?? 0 },
                    { label: "Acessos", value: analytics?.acessos ?? 0 },
                    { label: "Inícios", value: analytics?.inicios ?? 0 },
                    { label: "Envios", value: analytics?.envios ?? 0 },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl p-4" style={{ border: "1px solid #E5E7EB" }}>
                      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#6A7181" }}>{item.label}</p>
                      <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: 22, color: "#05245F" }}>{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl p-4" style={{ backgroundColor: "#F8FAFC" }}>
                  <div className="flex justify-between mb-2" style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#6A7181" }}>
                    <span>Progresso de envio</span>
                    <span>{percentualEnvios}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#E5E7EB" }}>
                    <div className="h-full rounded-full" style={{ width: `${percentualEnvios}%`, backgroundColor: "#05245F" }} />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "respostas" && (
          <div className="bg-white rounded-xl p-5 flex flex-col gap-4" style={{ border: "1px solid #E6E6E6" }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: 16, color: "#6B6FA3" }}>
                  Respostas por questão
                </h3>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#6A7181", marginTop: 4 }}>
                  Status real de correção por questão, incluindo objetivas corrigidas automaticamente.
                </p>
              </div>
              {provaId && (
                <button
                  type="button"
                  onClick={() => onNavigate?.("correcao")}
                  className="px-4 py-2 rounded-lg hover:opacity-85 transition-opacity"
                  style={{ backgroundColor: "#05245F", color: "#fff", fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600 }}
                >
                  Abrir correção
                </button>
              )}
            </div>

            {!provaId ? (
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#B1B4BD" }}>
                Salve a prova para consultar respostas reais.
              </p>
            ) : correcaoQuestoesQuery.isLoading ? (
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#6A7181" }}>Carregando respostas...</p>
            ) : correcaoQuestoesQuery.isError ? (
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#9A3412" }}>
                Não foi possível carregar as respostas por questão.
              </p>
            ) : questoesCorrecao.length === 0 ? (
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#B1B4BD" }}>
                Ainda não há respostas enviadas para esta prova.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { label: "Respostas", value: totalRespostasCorrecao },
                    { label: "Corrigidas", value: totalCorrigidas },
                    { label: "Pendentes", value: Math.max(0, totalRespostasCorrecao - totalCorrigidas) },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl p-4" style={{ border: "1px solid #E5E7EB" }}>
                      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#6A7181" }}>{item.label}</p>
                      <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: 22, color: "#05245F" }}>{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-3">
                  {questoesCorrecao.map((questao) => {
                    const question = questions.find((item) => item.id === questao.questaoId);
                    const pendentes = Math.max(0, questao.respostas.total - questao.respostas.corrigidas);
                    const progresso = questao.respostas.total
                      ? Math.round((questao.respostas.corrigidas / questao.respostas.total) * 100)
                      : 0;

                    return (
                      <div key={questao.questaoId} className="rounded-xl p-4 flex flex-col gap-3" style={{ border: "1px solid #E5E7EB" }}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="line-clamp-2" style={{ fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 600, color: "#111" }}>
                              {questao.ordemOriginal}. {question?.text ?? "Questão cadastrada"}
                            </p>
                            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#6A7181", marginTop: 4 }}>
                              {questao.tipo.replace("_", " ")} · {questao.pontuacaoMax} ponto(s)
                            </p>
                          </div>
                          <span className="shrink-0 px-3 py-1 rounded-full" style={{ backgroundColor: pendentes > 0 ? "#FFF8E0" : "#E6FAF8", color: pendentes > 0 ? "#B07D00" : "#05245F", fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600 }}>
                            {pendentes > 0 ? `${pendentes} pendente(s)` : "Corrigida"}
                          </span>
                        </div>
                        <div>
                          <div className="flex justify-between mb-2" style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#6A7181" }}>
                            <span>{questao.respostas.corrigidas}/{questao.respostas.total} corrigidas</span>
                            <span>{progresso}%</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#E5E7EB" }}>
                            <div className="h-full rounded-full" style={{ width: `${progresso}%`, backgroundColor: pendentes > 0 ? "#F9B233" : "#05245F" }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Configurações */}
        {activeTab === "configuracoes" && (
          <div className="bg-white rounded-xl p-6 flex flex-col gap-6" style={{ border: "1px solid #E6E6E6" }}>
            <h3 style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 16, color: "#111" }}>
              Configurações da Prova
            </h3>

            <div className="flex gap-5">
              {/* Tempo de Prova */}
              <div className="flex flex-col gap-1.5 w-full">
                <label style={labelStyle} className="flex items-center gap-1.5">
                  <ClockIcon style={{ width: 15, height: 15, color: "#05245F" }} />
                  Tempo de Prova
                </label>
                <div className="relative w-full">
                  <select value={editTempo} onChange={(e) => setEditTempo(e.target.value)}
                    style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
                    onFocus={(e) => { e.target.style.borderColor = "#05245F"; e.target.style.backgroundColor = "#fff"; }}
                    onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = "#F2F3F5"; }}>
                    <option value="">Selecionar duração</option>
                    {duracoes.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                  {chevron}
                </div>
              </div>

            </div>

            {/* Shuffle options */}
            <div className="flex gap-6">
              <label className="flex items-center gap-2" style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#111" }}>
                <input type="checkbox" checked={editEmbaralharQuestoes} onChange={(e) => setEditEmbaralharQuestoes(e.target.checked)} />
                Embaralhar questões
              </label>
              <label className="flex items-center gap-2" style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#111" }}>
                <input type="checkbox" checked={editEmbaralharAlternativas} onChange={(e) => setEditEmbaralharAlternativas(e.target.checked)} />
                Embaralhar alternativas
              </label>
            </div>

            {(updateExamErrorMessage || configError) && (
              <div className="rounded-lg px-4 py-3" style={{ backgroundColor: "#FCE8E6", color: "#9A3412", fontFamily: "Inter, sans-serif", fontSize: 13 }}>
                {configError || updateExamErrorMessage}
              </div>
            )}

            <div className="flex justify-end">
              <button onClick={handleSaveConfig} disabled={savingConfig}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg transition-opacity"
                style={{ backgroundColor: savingConfig ? "#B1B4BD" : "#6B6FA3", fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 14, color: "#fff", cursor: savingConfig ? "not-allowed" : "pointer" }}>
                <BookmarkIcon className="w-[15px] h-[15px]" style={{ color: "#fff" }} />
                {savingConfig ? "Salvando..." : "Salvar configurações"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
