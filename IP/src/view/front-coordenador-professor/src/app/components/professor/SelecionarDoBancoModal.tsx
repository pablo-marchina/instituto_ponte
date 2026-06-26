import { useState } from "react";
import { MagnifyingGlassIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { MathText } from "../../../../../src/components/math/MathText";
import type { Question, QuestionType } from "./ProvaDetailPage";
import { convertBancoToQuestion } from "../../../../../src/features/dashboard/dashboard.mappers";
import type { BancoQuestion } from "../../../../../src/features/dashboard/dashboard.types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddQuestions: (questions: Question[]) => void | Promise<void>;
  bancoQuestoes: BancoQuestion[];
}

const typeColors: Record<QuestionType, { bg: string; color: string }> = {
  Alternativa: { bg: "#EEF1F8", color: "#6B6FA3" },
  "V/F": { bg: "#E6FAF8", color: "#05245F" },
  Discursiva: { bg: "#FFF8E0", color: "#B07D00" },
};

export function SelecionarDoBancoModal({ isOpen, onClose, onAddQuestions, bancoQuestoes }: Props): JSX.Element | null {
  const [selectedIds, setSelectedIds] = useState<Array<BancoQuestion["id"]>>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMateria, setFilterMateria] = useState<string>("");
  const [filterTipo, setFilterTipo] = useState<string>("");
  const [filterDificuldade, setFilterDificuldade] = useState<string>("");
  const [filterSemestre, setFilterSemestre] = useState<string>("");
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  // Extrair valores únicos para os filtros
  const materias = Array.from(new Set(bancoQuestoes.map(q => q.materia))).sort();
  const tipos: QuestionType[] = ["Alternativa", "V/F", "Discursiva"];
  const dificuldades = Array.from(new Set(bancoQuestoes.map(q => q.dificuldade))).sort();
  const semestres = Array.from(new Set(bancoQuestoes.map(q => q.semestre))).sort();

  const filteredQuestions = bancoQuestoes.filter((q) => {
    const matchSearch = q.text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchMateria = !filterMateria || q.materia === filterMateria;
    const matchTipo = !filterTipo || q.type === filterTipo;
    const matchDificuldade = !filterDificuldade || q.dificuldade === filterDificuldade;
    const matchSemestre = !filterSemestre || q.semestre === filterSemestre;

    return matchSearch && matchMateria && matchTipo && matchDificuldade && matchSemestre;
  });

  const toggleSelection = (id: BancoQuestion["id"]) => {
    setAddError(null);
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((qid) => qid !== id) : [...prev, id]
    );
  };

  const handleAdd = async () => {
    setAddError(null);
    setIsAdding(true);
    const selected = bancoQuestoes
      .filter((q) => selectedIds.includes(q.id))
      .map(convertBancoToQuestion);
    try {
      await onAddQuestions(selected);
      setSelectedIds([]);
      setSearchTerm("");
      setFilterMateria("");
      setFilterTipo("");
      setFilterDificuldade("");
      setFilterSemestre("");
      onClose();
    } catch (error) {
      setAddError(error instanceof Error ? error.message : "Nao foi possivel adicionar a questao a esta prova.");
    } finally {
      setIsAdding(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterMateria("");
    setFilterTipo("");
    setFilterDificuldade("");
    setFilterSemestre("");
  };

  const hasActiveFilters = searchTerm || filterMateria || filterTipo || filterDificuldade || filterSemestre;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-3xl relative flex flex-col"
        style={{ boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.2)", maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Título */}
        <h2
          className="mb-2"
          style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: "20px", color: "#6B6FA3" }}
        >
          Banco de Questões
        </h2>
        <p
          className="mb-4"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#6A7181" }}
        >
          Selecione as questões que deseja adicionar à prova
        </p>

        {/* Campo de busca */}
        <div className="relative mb-4">
          <MagnifyingGlassIcon
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
            style={{ color: "#6A7181" }}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar questões..."
            className="w-full pl-10 pr-4 py-3 rounded-lg"
            style={{
              border: "2px solid #D9D9D9",
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              color: "#6B6FA3",
            }}
          />
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {/* Filtro Matéria */}
          <div className="relative">
            <select
              value={filterMateria}
              onChange={(e) => setFilterMateria(e.target.value)}
              className="w-full appearance-none px-3 py-2.5 rounded-lg pr-8"
              style={{
                border: "1.5px solid #D9D9D9",
                fontFamily: "Inter, sans-serif",
                fontSize: "13px",
                color: "#6B6FA3",
                backgroundColor: "#FFFFFF",
                cursor: "pointer",
              }}
            >
              <option value="">Todas as matérias</option>
              {materias.map((materia) => (
                <option key={materia} value={materia}>{materia}</option>
              ))}
            </select>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" width={14} height={14} viewBox="0 0 16 16" fill="none">
              <path d="M4 6L8 10L12 6" stroke="#6B6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Filtro Tipo */}
          <div className="relative">
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="w-full appearance-none px-3 py-2.5 rounded-lg pr-8"
              style={{
                border: "1.5px solid #D9D9D9",
                fontFamily: "Inter, sans-serif",
                fontSize: "13px",
                color: "#6B6FA3",
                backgroundColor: "#FFFFFF",
                cursor: "pointer",
              }}
            >
              <option value="">Todos os tipos</option>
              {tipos.map((tipo) => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" width={14} height={14} viewBox="0 0 16 16" fill="none">
              <path d="M4 6L8 10L12 6" stroke="#6B6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Filtro Dificuldade */}
          <div className="relative">
            <select
              value={filterDificuldade}
              onChange={(e) => setFilterDificuldade(e.target.value)}
              className="w-full appearance-none px-3 py-2.5 rounded-lg pr-8"
              style={{
                border: "1.5px solid #D9D9D9",
                fontFamily: "Inter, sans-serif",
                fontSize: "13px",
                color: "#6B6FA3",
                backgroundColor: "#FFFFFF",
                cursor: "pointer",
              }}
            >
              <option value="">Todas as dificuldades</option>
              {dificuldades.map((dificuldade) => (
                <option key={dificuldade} value={dificuldade}>{dificuldade}</option>
              ))}
            </select>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" width={14} height={14} viewBox="0 0 16 16" fill="none">
              <path d="M4 6L8 10L12 6" stroke="#6B6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Filtro Semestre */}
          <div className="relative">
            <select
              value={filterSemestre}
              onChange={(e) => setFilterSemestre(e.target.value)}
              className="w-full appearance-none px-3 py-2.5 rounded-lg pr-8"
              style={{
                border: "1.5px solid #D9D9D9",
                fontFamily: "Inter, sans-serif",
                fontSize: "13px",
                color: "#6B6FA3",
                backgroundColor: "#FFFFFF",
                cursor: "pointer",
              }}
            >
              <option value="">Todos os semestres</option>
              {semestres.map((semestre) => (
                <option key={semestre} value={semestre}>{semestre}</option>
              ))}
            </select>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" width={14} height={14} viewBox="0 0 16 16" fill="none">
              <path d="M4 6L8 10L12 6" stroke="#6B6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Botão limpar filtros */}
        {hasActiveFilters && (
          <div className="mb-3 flex justify-end">
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 rounded-md transition-opacity hover:opacity-70"
              style={{
                backgroundColor: "#F2F2F2",
                fontFamily: "Inter, sans-serif",
                fontSize: "12px",
                color: "#6A7181",
                fontWeight: 500,
              }}
            >
              Limpar filtros
            </button>
          </div>
        )}

        {/* Contador de resultados */}
        <div className="mb-3">
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#6A7181" }}>
            {filteredQuestions.length} {filteredQuestions.length === 1 ? "questão encontrada" : "questões encontradas"}
          </p>
        </div>

        {/* Lista de questões */}
        {addError && (
          <div className="mb-3 rounded-lg px-4 py-3" style={{ backgroundColor: "#FCE8E6", color: "#9A3412", fontFamily: "Inter, sans-serif", fontSize: "13px" }}>
            {addError}
          </div>
        )}

        <div className="flex-1 overflow-y-auto mb-4 space-y-3">
          {filteredQuestions.map((question) => {
            const isSelected = selectedIds.includes(question.id);
            const { bg, color } = typeColors[question.type];

            return (
              <button
                key={question.id}
                onClick={() => toggleSelection(question.id)}
                className="w-full text-left p-4 rounded-xl border-2 transition-all hover:border-opacity-70"
                style={{
                  borderColor: isSelected ? "#F9B233" : "#E5E7EB",
                  backgroundColor: isSelected ? "#FFFEF5" : "#FFFFFF",
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <div
                    className="flex items-center justify-center rounded-md shrink-0 mt-0.5"
                    style={{
                      width: 20,
                      height: 20,
                      border: `2px solid ${isSelected ? "#F9B233" : "#D9D9D9"}`,
                      backgroundColor: isSelected ? "#F9B233" : "transparent",
                    }}
                  >
                    {isSelected && <CheckCircleIcon className="w-4 h-4" style={{ color: "#6B6FA3" }} />}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    {/* Badges */}
                    <div className="flex gap-2 flex-wrap mb-2">
                      <span
                        className="inline-block px-2 py-0.5 rounded-md"
                        style={{
                          backgroundColor: bg,
                          color,
                          fontFamily: "Inter, sans-serif",
                          fontSize: "11px",
                          fontWeight: 600,
                        }}
                      >
                        {question.type}
                      </span>
                      <span
                        className="inline-block px-2 py-0.5 rounded-full"
                        style={{
                          border: "1px solid #D7D7D9",
                          backgroundColor: "#F2F2F2",
                          fontFamily: "Inter, sans-serif",
                          fontSize: "11px",
                          color: "#6A7181",
                        }}
                      >
                        {question.materia}
                      </span>
                      <span
                        className="inline-block px-2 py-0.5 rounded-full"
                        style={{
                          border: "1px solid #D7D7D9",
                          backgroundColor: "#F2F2F2",
                          fontFamily: "Inter, sans-serif",
                          fontSize: "11px",
                          color: "#6A7181",
                        }}
                      >
                        {question.dificuldade}
                      </span>
                    </div>

                    {/* Texto da questão */}
                    <MathText
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "13px",
                        color: "#111",
                        marginBottom: "8px",
                      }}
                    >
                      {question.text}
                    </MathText>

                    {/* Informação de uso */}
                    <p className="text-xs" style={{ color: "#6A7181" }}>
                      {question.timesUsed === 1
                        ? `Utilizada ${question.timesUsed} vez - Taxa de acerto: ${question.successRate}%`
                        : `Utilizada ${question.timesUsed} vezes - Taxa de acerto: ${question.successRate}%`
                      }
                      {question.options && ` • ${question.options.length} alternativas`}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}

          {filteredQuestions.length === 0 && (
            <div className="text-center py-8">
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#B1B4BD" }}>
                Nenhuma questão encontrada
              </p>
            </div>
          )}
        </div>

        {/* Rodapé com contagem e botões */}
        <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "#E5E7EB" }}>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#6A7181" }}>
            {selectedIds.length} {selectedIds.length === 1 ? "questão selecionada" : "questões selecionadas"}
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-full transition-opacity hover:opacity-85"
              style={{
                backgroundColor: "#F2F2F2",
                color: "#6A7181",
                fontFamily: "Poppins, sans-serif",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              disabled={selectedIds.length === 0 || isAdding}
              className="px-6 py-2.5 rounded-full transition-opacity hover:opacity-85 disabled:opacity-50"
              style={{
                backgroundColor: "#F9B233",
                color: "#6B6FA3",
                fontFamily: "Poppins, sans-serif",
                fontWeight: 600,
                fontSize: "14px",
                cursor: selectedIds.length === 0 || isAdding ? "not-allowed" : "pointer",
              }}
            >
              {isAdding ? "Adicionando..." : `Adicionar (${selectedIds.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
