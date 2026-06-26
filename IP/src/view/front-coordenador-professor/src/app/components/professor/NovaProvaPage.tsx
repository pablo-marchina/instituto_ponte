import { useEffect, useMemo, useState } from "react";
import { ChevronLeftIcon, BookmarkIcon, ClockIcon } from "@heroicons/react/24/outline";
import type { MateriaDto } from "../../../../../src/features/materias/materias.types";
import type { ProfessorDto } from "../../../../../src/features/professores/professores.types";
import type { CreateProvaPayload } from "../../../../../src/features/provas/provas.types";
import { confirmDiscardChanges, useUnsavedChangesWarning } from "./useUnsavedChangesWarning";

export type NovaProvaInput = CreateProvaPayload;

interface Props {
  onBack: () => void;
  onSave: (input: NovaProvaInput) => Promise<void> | void;
  materias: MateriaDto[];
  professores?: ProfessorDto[];
  professorMaterias?: Record<string, string[]>;
  turmas?: string[];
  isSaving?: boolean;
  errorMessage?: string;
}

const modalidades = ["Prova", "Trabalho", "Atividade", "Simulado"];
const semestres = ["1º Semestre 2026", "2º Semestre 2025", "1º Semestre 2025", "2º Semestre 2024"];
const turmasPadrao = ["3A", "3B", "Extensivo", "Turma 2026"];
const draftStorageKey = "corrije-ai:nova-prova-draft";

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
  fontSize: 14,
  color: "#111",
  marginBottom: 6,
};

const chevron = (
  <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width={16} height={16} viewBox="0 0 16 16" fill="none">
    <path d="M4 6L8 10L12 6" stroke="#6B6B6B" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function NovaProvaPage({ onBack, onSave, materias, professores = [], professorMaterias, turmas = [], isSaving = false, errorMessage }: Props) {
  const [nome, setNome] = useState("");
  const [modalidade, setModalidade] = useState("");
  const [materiaId, setMateriaId] = useState("");
  const [professorId, setProfessorId] = useState("");
  const [turma, setTurma] = useState("");
  const [semestre, setSemestre] = useState("");
  const [orientacoes, setOrientacoes] = useState("");
  const [tempoProva, setTempoProva] = useState<string>("");
  const [embaralharQuestoes, setEmbaralharQuestoes] = useState(false);
  const [embaralharAlternativas, setEmbaralharAlternativas] = useState(false);
  const turmaOptions = useMemo(
    () => [...new Set([...turmas, ...turmasPadrao].map((item) => item.trim()).filter(Boolean))].sort(),
    [turmas],
  );
  const filteredProfessores = useMemo(() => {
    if (!materiaId || !professorMaterias || Object.keys(professorMaterias).length === 0) return professores;
    return professores.filter((professor) => professorMaterias[professor.id]?.includes(materiaId));
  }, [materiaId, professorMaterias, professores]);

  const canSave =
    nome.trim() !== "" &&
    materiaId !== "" &&
    (professores.length === 0 || professorId !== "") &&
    turma.trim() !== "" &&
    semestre !== "" &&
    !isSaving;
  const hasUnsavedChanges =
    !!nome.trim() ||
    !!modalidade ||
    !!materiaId ||
    !!professorId ||
    !!turma.trim() ||
    !!semestre ||
    !!orientacoes.trim() ||
    !!tempoProva ||
    embaralharQuestoes ||
    embaralharAlternativas;

  useUnsavedChangesWarning(hasUnsavedChanges && !isSaving);

  useEffect(() => {
    if (professorId && materiaId && professorMaterias && !filteredProfessores.some((professor) => professor.id === professorId)) {
      setProfessorId("");
    }
  }, [filteredProfessores, materiaId, professorId, professorMaterias]);

  useEffect(() => {
    const rawDraft = window.localStorage.getItem(draftStorageKey);
    if (!rawDraft) return;
    try {
      const draft = JSON.parse(rawDraft) as Partial<{
        nome: string;
        modalidade: string;
        materiaId: string;
        professorId: string;
        turma: string;
        semestre: string;
        orientacoes: string;
        tempoProva: string;
        embaralharQuestoes: boolean;
        embaralharAlternativas: boolean;
      }>;
      setNome(draft.nome ?? "");
      setModalidade(draft.modalidade ?? "");
      setMateriaId(draft.materiaId ?? "");
      setProfessorId(draft.professorId ?? "");
      setTurma(draft.turma ?? "");
      setSemestre(draft.semestre ?? "");
      setOrientacoes(draft.orientacoes ?? "");
      setTempoProva(draft.tempoProva ?? "");
      setEmbaralharQuestoes(draft.embaralharQuestoes ?? false);
      setEmbaralharAlternativas(draft.embaralharAlternativas ?? false);
    } catch {
      window.localStorage.removeItem(draftStorageKey);
    }
  }, []);

  useEffect(() => {
    if (!hasUnsavedChanges) {
      window.localStorage.removeItem(draftStorageKey);
      return;
    }
    window.localStorage.setItem(
      draftStorageKey,
      JSON.stringify({
        nome,
        modalidade,
        materiaId,
        professorId,
        turma,
        semestre,
        orientacoes,
        tempoProva,
        embaralharQuestoes,
        embaralharAlternativas,
      }),
    );
  }, [nome, modalidade, materiaId, professorId, turma, semestre, orientacoes, tempoProva, embaralharQuestoes, embaralharAlternativas, hasUnsavedChanges]);

  function handleBack() {
    if (confirmDiscardChanges(hasUnsavedChanges)) onBack();
  }

  async function handleSave() {
    if (!canSave) return;
    try {
      await onSave({
        materiaId,
        ...(professorId ? { professorId } : {}),
        titulo: nome.trim(),
        modalidade: modalidade || "Prova",
        turma: turma.trim(),
        semestre,
        instrucoes: orientacoes.trim() || null,
        tempoLimiteMin: tempoProva !== "" && Number(tempoProva) > 0 ? Number(tempoProva) : null,
        embaralharQuestoes,
        embaralharAlternativas,
      });
      window.localStorage.removeItem(draftStorageKey);
      onBack();
    } catch {
      // A mutation do TanStack Query já expõe a mensagem para renderização.
    }
  }

  return (
    <div className="p-8 flex flex-col gap-5">
      {/* Back link */}
      <button
        onClick={handleBack}
        className="flex items-center gap-1.5 hover:opacity-70 transition-opacity self-start"
        style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 14, color: "#6B6B6B" }}
      >
        <ChevronLeftIcon className="w-4 h-4" style={{ color: "#6B6B6B" }} />
        Voltar para provas
      </button>

      {/* Page title */}
      <div>
        <h1 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: 20, color: "#000" }}>
          Nova Prova
        </h1>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#6B6B6B" }}>
          Preencha os dados iniciais. A prova será salva como rascunho.
        </p>
      </div>

      {/* Form card */}
      <div
        className="bg-white rounded-2xl flex flex-col"
        style={{ border: "1px solid #E6E6E6", boxShadow: "0px 2px 5px rgba(0,0,0,0.02)" }}
      >
        {/* Form body */}
        <div className="flex flex-col gap-5 p-8 pb-6" style={{ borderBottom: "1px solid #E6E6E6" }}>
          <h2 style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 20, color: "#111" }}>
            Dados da Prova
          </h2>

          {errorMessage && (
            <div
              role="alert"
              className="rounded-lg px-4 py-3"
              style={{ backgroundColor: "#FCE8E6", color: "#9A3412", fontFamily: "Inter, sans-serif", fontSize: 14 }}
            >
              {errorMessage}
            </div>
          )}

          {/* Nome da Prova */}
          <div className="flex flex-col gap-1.5 w-full">
            <label style={labelStyle}>Nome da Prova *</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Prova de Cálculo — 1ª Unidade"
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = "#05245F"; e.target.style.backgroundColor = "#fff"; }}
              onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = "#F2F3F5"; }}
            />
          </div>

          {/* Modalidade + Disciplina */}
          <div className="flex gap-5">
            <div className="flex flex-col gap-1.5 w-full">
              <label style={labelStyle}>Modalidade *</label>
              <div className="relative w-full">
                <select
                  value={modalidade}
                  onChange={(e) => setModalidade(e.target.value)}
                  style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
                  onFocus={(e) => { e.target.style.borderColor = "#05245F"; e.target.style.backgroundColor = "#fff"; }}
                  onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = "#F2F3F5"; }}
                >
                  <option value="">Selecionar</option>
                  {modalidades.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                {chevron}
              </div>
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              <label style={labelStyle}>Disciplina *</label>
              <div className="relative w-full">
                <select
                  value={materiaId}
                  onChange={(e) => setMateriaId(e.target.value)}
                  style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
                  onFocus={(e) => { e.target.style.borderColor = "#05245F"; e.target.style.backgroundColor = "#fff"; }}
                  onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = "#F2F3F5"; }}
                >
                  <option value="">Selecionar</option>
                  {materias.map((materia) => (
                    <option key={materia.id} value={materia.id}>{materia.nome}</option>
                  ))}
                </select>
                {chevron}
              </div>
              {materias.length === 0 && (
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#9B9B9B" }}>
                  Nenhuma matéria disponível para seleção.
                </span>
              )}
            </div>
          </div>

          {professores.length > 0 && (
            <div className="flex flex-col gap-1.5 w-full">
              <label style={labelStyle}>Professor responsavel *</label>
              <div className="relative w-full">
                <select
                  value={professorId}
                  onChange={(e) => setProfessorId(e.target.value)}
                  style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
                  onFocus={(e) => { e.target.style.borderColor = "#05245F"; e.target.style.backgroundColor = "#fff"; }}
                  onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = "#F2F3F5"; }}
                >
                  <option value="">Selecionar professor</option>
                  {filteredProfessores.map((professor) => (
                    <option key={professor.id} value={professor.id}>{professor.nome}</option>
                  ))}
                </select>
                {chevron}
              </div>
              {materiaId && filteredProfessores.length === 0 && (
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#9B9B9B" }}>
                  Nenhum professor vinculado a esta disciplina.
                </span>
              )}
            </div>
          )}

          {/* Turma + Semestre */}
          <div className="flex gap-5">
            <div className="flex flex-col gap-1.5 w-full">
              <label style={labelStyle}>Turma *</label>
              <div className="relative w-full">
                <select
                  value={turma}
                  onChange={(e) => setTurma(e.target.value)}
                  style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
                  onFocus={(e) => { e.target.style.borderColor = "#05245F"; e.target.style.backgroundColor = "#fff"; }}
                  onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = "#F2F3F5"; }}
                >
                  <option value="">Selecionar</option>
                  {turmaOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {chevron}
              </div>
              <input
                hidden
                type="text"
                value={turma}
                onChange={(e) => setTurma(e.target.value)}
                placeholder="Ex: 3ºA"
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = "#05245F"; e.target.style.backgroundColor = "#fff"; }}
                onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = "#F2F3F5"; }}
              />
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              <label style={labelStyle}>Semestre *</label>
              <div className="relative w-full">
                <select
                  value={semestre}
                  onChange={(e) => setSemestre(e.target.value)}
                  style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
                  onFocus={(e) => { e.target.style.borderColor = "#05245F"; e.target.style.backgroundColor = "#fff"; }}
                  onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = "#F2F3F5"; }}
                >
                  <option value="">Selecionar</option>
                  {semestres.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {chevron}
              </div>
            </div>
          </div>

          {/* Tempo de Prova + Datas */}
          <div className="flex gap-5">
            {/* Tempo de Prova */}
            <div className="flex flex-col gap-1.5 w-full">
              <label style={labelStyle} className="flex items-center gap-1.5">
                <ClockIcon style={{ width: 15, height: 15, color: "#05245F" }} />
                Tempo de Prova
              </label>
              <div className="relative w-full">
                <select
                  value={tempoProva}
                  onChange={(e) => setTempoProva(e.target.value)}
                  style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
                  onFocus={(e) => { e.target.style.borderColor = "#05245F"; e.target.style.backgroundColor = "#fff"; }}
                  onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = "#F2F3F5"; }}
                >
                  <option value="">Selecionar duração</option>
                  {duracoes.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
                {chevron}
              </div>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#9B9B9B" }}>
                Tempo disponível para o aluno após iniciar a prova
              </span>
            </div>

          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2" style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#111" }}>
              <input type="checkbox" checked={embaralharQuestoes} onChange={(e) => setEmbaralharQuestoes(e.target.checked)} />
              Embaralhar questoes
            </label>
            <label className="flex items-center gap-2" style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#111" }}>
              <input type="checkbox" checked={embaralharAlternativas} onChange={(e) => setEmbaralharAlternativas(e.target.checked)} />
              Embaralhar alternativas
            </label>
          </div>

          {/* Orientações */}
          <div className="flex flex-col gap-1.5 w-full">
            <label style={labelStyle}>Orientações (opcional)</label>
            <textarea
              rows={4}
              value={orientacoes}
              onChange={(e) => setOrientacoes(e.target.value)}
              placeholder="Instruções gerais para os alunos..."
              style={{
                width: "100%",
                backgroundColor: "#F2F3F5",
                border: "1px solid transparent",
                borderRadius: 8,
                padding: "10px 13px",
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                color: "#111",
                outline: "none",
                resize: "none",
              }}
              onFocus={(e) => { e.target.style.borderColor = "#05245F"; e.target.style.backgroundColor = "#fff"; }}
              onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = "#F2F3F5"; }}
            />
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex justify-end gap-3 p-6">
          <button
            onClick={handleBack}
            className="px-5 py-2.5 rounded-lg hover:opacity-80 transition-opacity"
            style={{
              border: "1px solid #E6E6E6",
              backgroundColor: "#fff",
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              fontSize: 14,
              color: "#111",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg transition-opacity"
            style={{
              backgroundColor: canSave ? "#6B6FA3" : "#B1B4BD",
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              fontSize: 14,
              color: "#fff",
              cursor: canSave ? "pointer" : "not-allowed",
            }}
          >
            <BookmarkIcon className="w-[15px] h-[15px]" style={{ color: "#fff" }} />
            {isSaving ? "Salvando..." : "Salvar como Rascunho"}
          </button>
        </div>
      </div>
    </div>
  );
}
