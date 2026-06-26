import { useState } from "react";
import { MagnifyingGlassIcon, ChevronDownIcon, TrashIcon } from "@heroicons/react/24/outline";
import { MathText } from "../../../../../src/components/math/MathText";
import type { BancoQuestion, Exam } from "../../../../../src/features/dashboard/dashboard.types";
import { EditarQuestaoModal } from "./EditarQuestaoModal";
import { SelecionarProvaModal } from "./SelecionarProvaModal";

interface Props {
  onNavigate?: (tab: string) => void;
  bancoQuestoes?: BancoQuestion[];
  onUpdateQuestion?: (questao: BancoQuestion) => void | Promise<void>;
  onDeleteQuestion?: (id: BancoQuestion["id"]) => void;
  provas?: Exam[];
  onAddToProva?: (provaId: Exam["id"], questao: BancoQuestion) => void | Promise<void>;
  isLoading?: boolean;
  errorMessage?: string;
}

export function BancoQuestoesPage({ onNavigate, bancoQuestoes = [], onUpdateQuestion, onDeleteQuestion, provas = [], onAddToProva, isLoading = false, errorMessage }: Props) {
  const [editingQuestao, setEditingQuestao] = useState<BancoQuestion | null>(null);
  const [questaoParaAdicionar, setQuestaoParaAdicionar] = useState<BancoQuestion | null>(null);
  const [search, setSearch] = useState("");
  const [materiaFilter, setMateriaFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dificuldadeFilter, setDificuldadeFilter] = useState("");
  const materias = [...new Set(bancoQuestoes.map((q) => q.materia).filter(Boolean))].sort();
  const tipos = [...new Set(bancoQuestoes.map((q) => q.type).filter(Boolean))].sort();
  const dificuldades = [...new Set(bancoQuestoes.map((q) => q.dificuldade).filter(Boolean))].sort();

  const filtered = bancoQuestoes.filter((q) => {
    const matchSearch = q.text.toLowerCase().includes(search.toLowerCase()) ||
      q.materia.toLowerCase().includes(search.toLowerCase());
    const matchMateria = !materiaFilter || q.materia === materiaFilter;
    const matchType = !typeFilter || q.type === typeFilter;
    const matchDificuldade = !dificuldadeFilter || q.dificuldade === dificuldadeFilter;
    return matchSearch && matchMateria && matchType && matchDificuldade;
  });
  const handleSaveEdit = async (questao: BancoQuestion) => {
    await onUpdateQuestion?.(questao);
    setEditingQuestao(null);
  };

  const handleAddToProva = async (provaId: Exam["id"], questao: BancoQuestion) => {
    await onAddToProva?.(provaId, questao);
    setQuestaoParaAdicionar(null);
  };

  return (
    <>
      <EditarQuestaoModal
        isOpen={!!editingQuestao}
        onClose={() => setEditingQuestao(null)}
        questao={editingQuestao}
        onSave={handleSaveEdit}
      />
      <SelecionarProvaModal
        isOpen={!!questaoParaAdicionar}
        onClose={() => setQuestaoParaAdicionar(null)}
        questao={questaoParaAdicionar}
        provas={provas}
        onAddToProva={handleAddToProva}
      />
      <div className="flex flex-col gap-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "20px", color: "#000" }}>
            Banco de Questões
          </h1>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#575454" }}>
            Reutilize questões existentes em novas provas
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onNavigate?.("nova-questao-banco")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-85 transition-opacity"
            style={{ backgroundColor: "#F9B233", color: "#6B6FA3", fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: "14px" }}
          >
            + Adicionar questão
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="bg-white rounded-xl p-4" style={{ border: "1px solid #E6E6E6" }}>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#6A7181" }}>
            Carregando banco de questões...
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl p-4" style={{ backgroundColor: "#FCE8E6", color: "#9A3412", fontFamily: "Inter, sans-serif", fontSize: "14px" }}>
          {errorMessage}
        </div>
      )}

      {/* Filter row */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative w-full md:flex-1 md:max-w-sm">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9F9F9F" }} />
          <input
            type="text"
            placeholder="Buscar questões"
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
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-lg outline-none cursor-pointer"
            style={{
              backgroundColor: "#fff",
              border: "1px solid #D9D9D9",
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              color: "#6A7181",
            }}
          >
            <option value="">Tipo</option>
            {tipos.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDownIcon className="w-[14px] h-[14px] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9F9F9F" }} />
        </div>
        <div className="relative min-w-[140px] flex-1 md:flex-none">
          <select
            value={dificuldadeFilter}
            onChange={(e) => setDificuldadeFilter(e.target.value)}
            className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-lg outline-none cursor-pointer"
            style={{
              backgroundColor: "#fff",
              border: "1px solid #D9D9D9",
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              color: "#6A7181",
            }}
          >
            <option value="">Dificuldade</option>
            {dificuldades.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <ChevronDownIcon className="w-[14px] h-[14px] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9F9F9F" }} />
        </div>
      </div>

      {/* Question list */}
      <div className="flex flex-col gap-3">
        {filtered.map((q) => (
          <div
            key={q.id}
            onClick={() => setEditingQuestao(q)}
            className="bg-white rounded-xl p-4 flex flex-col gap-2 cursor-pointer hover:shadow-lg transition-shadow"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
          >
            {/* Top row: tags + buttons */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-2 flex-wrap">
                <span
                  className="px-2 py-0.5 rounded-full"
                  style={{
                    border: "1px solid #D7D7D9",
                    backgroundColor: "#F2F2F2",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "11px",
                    color: "#6A7181",
                  }}
                >
                  {q.materia}
                </span>
                <span
                  className="px-2 py-0.5 rounded-full"
                  style={{
                    border: "1px solid #D7D7D9",
                    backgroundColor: "#F2F2F2",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "11px",
                    color: "#6A7181",
                  }}
                >
                  {q.type}
                </span>
                <span
                  className="px-2 py-0.5 rounded-full"
                  style={{
                    border: "1px solid #D7D7D9",
                    backgroundColor: "#F2F2F2",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "11px",
                    color: "#6A7181",
                  }}
                >
                  {q.dificuldade}
                </span>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuestaoParaAdicionar(q);
                  }}
                  className="px-3 py-1.5 rounded-lg hover:opacity-85 transition-opacity"
                  style={{
                    border: "1px solid #05245F",
                    color: "#05245F",
                    backgroundColor: "transparent",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "12px",
                    fontWeight: 500,
                  }}
                >
                  + Incluir na prova
                </button>
                <button
                  type="button"
                  title="Remover questao"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteQuestion?.(q.id);
                  }}
                  className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
                  style={{ backgroundColor: "#FEE2E2" }}
                >
                  <TrashIcon className="w-[14px] h-[14px]" style={{ color: "#EF4444" }} />
                </button>
              </div>
            </div>

            <MathText style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: "14px", color: "#000" }}>
              {q.text}
            </MathText>
            {q.imageUrl && (
              <img
                src={q.imageUrl}
                alt="Imagem do enunciado"
                className="rounded-xl"
                style={{ width: "100%", maxHeight: 220, objectFit: "contain", border: "1px solid #E6E6E6", backgroundColor: "#F7F8FA" }}
              />
            )}
            {q.options?.some((option) => option.imageUrl) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {q.options.filter((option) => option.imageUrl).map((option) => (
                  <div key={option.letter} className="rounded-lg p-2" style={{ border: "1px solid #E6E6E6", backgroundColor: "#F7F8FA" }}>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#6A7181", marginBottom: 6 }}>
                      Alternativa {option.letter}
                    </p>
                    <img
                      src={option.imageUrl ?? undefined}
                      alt={`Imagem da alternativa ${option.letter}`}
                      style={{ width: "100%", maxHeight: 120, objectFit: "contain" }}
                    />
                  </div>
                ))}
              </div>
            )}
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#6A7181" }}>
              {q.timesUsed === 1
                ? `Utilizada ${q.timesUsed} vez - Taxa de acerto: ${q.successRate}%`
                : `Utilizada ${q.timesUsed} vezes - Taxa de acerto: ${q.successRate}%`
              }
            </p>
          </div>
        ))}
      </div>
      </div>
    </>
  );
}
