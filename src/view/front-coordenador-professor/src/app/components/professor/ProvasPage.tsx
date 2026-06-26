import { useState } from "react";
import { PlusIcon, MagnifyingGlassIcon, DocumentTextIcon, CalendarIcon, UsersIcon, ChevronDownIcon, TrashIcon, ArchiveBoxIcon } from "@heroicons/react/24/outline";
import type { Exam, ExamDisplayStatus } from "../../../../../src/features/dashboard/dashboard.types";

type StatusFilter = "Todas" | ExamDisplayStatus | "Aberta";

const filterTabs: StatusFilter[] = ["Todas", "Correção pendente", "Rascunho", "Aberta", "Encerrada", "Antiga"];

const statusStyles: Record<Exclude<StatusFilter, "Todas">, { bg: string; color: string; weight: number }> = {
  "Correção pendente": { bg: "#FFF8E0", color: "#B07D00", weight: 700 },
  Rascunho: { bg: "#EEF1F8", color: "#6B6FA3", weight: 700 },
  Aberta: { bg: "#E6FAF8", color: "#05245F", weight: 700 },
  Publicada: { bg: "#E6FAF8", color: "#05245F", weight: 700 },
  Encerrada: { bg: "#F2F2F2", color: "#504F4F", weight: 600 },
  Antiga: { bg: "#F2F2F2", color: "#6A7181", weight: 500 },
};

function formatDate(iso?: string) {
  if (!iso) return "Não definida";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Não definida";
  return date.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function parseSemester(value?: string) {
  if (!value) return null;
  const normalized = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const yearMatch = normalized.match(/(20\d{2})/);
  if (!yearMatch) return null;

  const dotMatch = normalized.match(/20\d{2}\s*[.-]\s*([12])/);
  const leadingMatch = normalized.match(/\b([12])\s*(?:o|º|°)?\s*sem/);
  const trailingMatch = normalized.match(/sem(?:estre)?\s*([12])\b/);
  const semester = Number(dotMatch?.[1] ?? leadingMatch?.[1] ?? trailingMatch?.[1] ?? 0);
  if (semester !== 1 && semester !== 2) return null;

  return { year: Number(yearMatch[1]), semester };
}

function isPastSemester(value?: string) {
  const parsed = parseSemester(value);
  if (!parsed) return false;
  const now = new Date();
  const currentSemester = now.getMonth() < 6 ? 1 : 2;
  const currentYear = now.getFullYear();
  return parsed.year < currentYear || (parsed.year === currentYear && parsed.semester < currentSemester);
}

function getDisplayStatus(exam: Exam, pendingCorrections: number): Exclude<StatusFilter, "Todas"> {
  if (pendingCorrections > 0) return "Correção pendente";
  if (isPastSemester(exam.semester)) return "Antiga";
  if (exam.badge === "Publicada") return "Aberta";
  if (exam.badge === "Antiga") return "Encerrada";
  return exam.badge;
}

interface Props {
  onNavigate: (tab: string, exam?: Exam) => void;
  exams: Exam[];
  onDeleteExam: (id: Exam["id"]) => void;
  onArchiveExam?: (id: Exam["id"]) => void;
}

export function ProvasPage({ onNavigate, exams, onDeleteExam, onArchiveExam }: Props) {
  const [activeTab, setActiveTab] = useState<StatusFilter>("Todas");
  const [search, setSearch] = useState("");
  const [materiaFilter, setMateriaFilter] = useState("");
  const [semestreFilter, setSemestreFilter] = useState("");
  const [turmaFilter, setTurmaFilter] = useState("");
  const [professorFilter, setProfessorFilter] = useState("");

  const materias = [...new Set(exams.map((e) => e.subject).filter(Boolean))].sort();
  const semestres = [...new Set(exams.map((e) => e.semester).filter(Boolean))].sort();
  const turmas = [...new Set(exams.map((e) => e.turma).filter(Boolean))].sort();
  const professores = [...new Set(exams.map((e) => e.professorName).filter(Boolean))].sort();
  const correctionSummary = new Map<string, { total: number; corrected: number; pending: number }>();
  exams.forEach((exam) => {
    const pending = exam.pendingCorrections ?? 0;
    correctionSummary.set(exam.id, {
      total: Number(exam.submissions) || 0,
      corrected: Math.max(0, (Number(exam.submissions) || 0) - pending),
      pending,
    });
  });

  const filtered = exams.filter((e) => {
    const summary = correctionSummary.get(e.id);
    const displayStatus = getDisplayStatus(e, summary?.pending ?? e.pendingCorrections ?? 0);
    const matchTab = activeTab === "Todas" || displayStatus === activeTab;
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.discipline.toLowerCase().includes(search.toLowerCase()) ||
      (e.professorName ?? "").toLowerCase().includes(search.toLowerCase());
    const matchMateria = !materiaFilter || e.subject === materiaFilter;
    const matchSemestre = !semestreFilter || e.semester === semestreFilter;
    const matchTurma = !turmaFilter || e.turma === turmaFilter;
    const matchProfessor = !professorFilter || e.professorName === professorFilter;
    return matchTab && matchSearch && matchMateria && matchSemestre && matchTurma && matchProfessor;
  }).sort((a, b) => {
    const aPending = correctionSummary.get(a.id)?.pending ?? a.pendingCorrections ?? 0;
    const bPending = correctionSummary.get(b.id)?.pending ?? b.pendingCorrections ?? 0;
    if (aPending !== bPending) return bPending - aPending;
    if (a.badge !== b.badge) {
      if (a.badge === "Publicada") return -1;
      if (b.badge === "Publicada") return 1;
    }
    return new Date(b.criadoEm ?? 0).getTime() - new Date(a.criadoEm ?? 0).getTime();
  });

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "20px", color: "#000" }}>
            Provas
          </h1>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#575454" }}>
            Gerencie e visualize todas as avaliações disponíveis
          </p>
        </div>
        <button
          onClick={() => onNavigate("nova-prova")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-85 transition-opacity"
          style={{ backgroundColor: "#F9B233", color: "#6B6FA3", fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: "14px" }}
        >
          <PlusIcon className="w-4 h-4" />
          Nova prova
        </button>
      </div>

      {/* Filter tabs */}
      <div
        className="flex max-w-full flex-wrap gap-1 p-1 rounded-xl self-start"
        style={{ backgroundColor: "#fff", border: "1px solid #D7D7D9" }}
      >
        {filterTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-lg transition-all"
            style={{
              backgroundColor: activeTab === tab ? "#F9B233" : "transparent",
              color: activeTab === tab ? "#6B6FA3" : "#6A7181",
              fontFamily: "Poppins, sans-serif",
              fontWeight: activeTab === tab ? 600 : 400,
              fontSize: "13px",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative w-full md:flex-1 md:max-w-sm">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9F9F9F" }} />
          <input
            type="text"
            placeholder="Buscar provas"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl outline-none"
            style={{
              backgroundColor: "#fff",
              border: "1px solid #D9D9D9",
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              color: "#6A7181",
            }}
          />
        </div>

        <div className="relative min-w-[140px] flex-1 md:flex-none">
          <select
            value={professorFilter}
            onChange={(e) => setProfessorFilter(e.target.value)}
            className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-lg outline-none cursor-pointer"
            style={{
              backgroundColor: "#fff",
              border: "1px solid #D9D9D9",
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              color: "#6A7181",
            }}
          >
            <option value="">Professor</option>
            {professores.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <ChevronDownIcon className="w-[14px] h-[14px] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9F9F9F" }} />
        </div>

        <div className="relative min-w-[140px] flex-1 md:flex-none">
          <select
            value={materiaFilter}
            onChange={(e) => setMateriaFilter(e.target.value)}
            className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-lg outline-none cursor-pointer"
            style={{
              backgroundColor: "#fff",
              border: "1px solid #D9D9D9",
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              color: "#6A7181",
            }}
          >
            <option value="">Matéria</option>
            {materias.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <ChevronDownIcon className="w-[14px] h-[14px] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9F9F9F" }} />
        </div>
        <div className="relative min-w-[140px] flex-1 md:flex-none">
          <select
            value={semestreFilter}
            onChange={(e) => setSemestreFilter(e.target.value)}
            className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-lg outline-none cursor-pointer"
            style={{
              backgroundColor: "#fff",
              border: "1px solid #D9D9D9",
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              color: "#6A7181",
            }}
          >
            <option value="">Semestre</option>
            {semestres.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDownIcon className="w-[14px] h-[14px] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9F9F9F" }} />
        </div>

        {/* Turma filter */}
        <div className="relative min-w-[140px] flex-1 md:flex-none">
          <select
            value={turmaFilter}
            onChange={(e) => setTurmaFilter(e.target.value)}
            className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-lg outline-none cursor-pointer"
            style={{
              backgroundColor: "#fff",
              border: "1px solid #D9D9D9",
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              color: "#6A7181",
            }}
          >
            <option value="">Turma</option>
            {turmas.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDownIcon className="w-[14px] h-[14px] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9F9F9F" }} />
        </div>
      </div>

      {/* Exam cards grid */}
      {filtered.length === 0 ? (
        <div
          className="bg-white rounded-xl p-10 flex items-center justify-center"
          style={{ border: "1px dashed #D7D7D9" }}
        >
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#B1B4BD" }}>
            Nenhuma prova encontrada.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filtered.map((exam) => {
            const summary = correctionSummary.get(exam.id);
            const pending = summary?.pending ?? exam.pendingCorrections ?? 0;
            const displayStatus = getDisplayStatus(exam, pending);
            const statusStyle = statusStyles[displayStatus];
            return (
            <div
              key={exam.id}
              onClick={() => onNavigate("prova-detail", exam)}
              className="bg-white rounded-xl p-3 flex flex-col gap-2 cursor-pointer hover:shadow-md transition-shadow"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
            >
              {/* Top row */}
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center justify-center rounded-lg"
                  style={{ width: 32, height: 32, backgroundColor: "#EEF1F8" }}
                >
                  <DocumentTextIcon className="w-4 h-4" style={{ color: "#6B6FA3" }} />
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 rounded-lg"
                    style={{
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.color,
                      fontFamily: "Inter, sans-serif",
                      fontSize: "11px",
                      fontWeight: statusStyle.weight,
                    }}
                  >
                    {displayStatus}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteExam(exam.id); }}
                    className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
                    style={{ backgroundColor: "#FEE2E2" }}
                    title="Deletar prova"
                  >
                    <TrashIcon className="w-[15px] h-[15px]" style={{ color: "#EF4444" }} />
                  </button>
                  {exam.badge === "Encerrada" && onArchiveExam && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onArchiveExam(exam.id); }}
                      className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
                      style={{ backgroundColor: "#E8F0FE" }}
                      title="Arquivar prova"
                    >
                      <ArchiveBoxIcon className="w-[15px] h-[15px]" style={{ color: "#4A6FA5" }} />
                    </button>
                  )}
                </div>
              </div>

              <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "17px", color: "#000" }}>
                {exam.title}
              </p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#504F4F" }}>
                {exam.modalidade} • {exam.semester}
              </p>
              {exam.professorName && (
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#6A7181" }}>
                  Professor: {exam.professorName}
                </p>
              )}

              {/* Bottom row */}
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-1">
                  <CalendarIcon className="w-[15px] h-[15px]" style={{ color: "#504F4F" }} />
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#504F4F" }}>{exam.semester}</span>
                </div>
                <div className="flex items-center gap-1">
                  <UsersIcon className="w-[15px] h-[15px]" style={{ color: "#504F4F" }} />
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#504F4F" }}>{exam.submissions} submissões</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {[
                  { label: "Respostas", value: summary?.total ?? (Number(exam.submissions) || 0) },
                  { label: "Pendentes", value: pending },
                  { label: "Fim", value: formatDate(exam.dataLimite) },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg p-2" style={{ backgroundColor: "#F7F8FA" }}>
                    <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: 13, color: "#05245F" }}>{item.value}</p>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "#6A7181" }}>{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
