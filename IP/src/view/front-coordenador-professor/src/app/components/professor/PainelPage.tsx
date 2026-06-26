import {
  ClipboardDocumentListIcon, GlobeAltIcon, PencilIcon, ArchiveBoxIcon,
  DocumentTextIcon, PlusIcon,
} from "@heroicons/react/24/outline";
import type { Exam } from "../../../../../src/features/dashboard/dashboard.types";

interface Props {
  onNavigate: (tab: string, exam?: Exam) => void;
  exams: Exam[];
}

const badgeStyle: Record<string, { bg: string; color: string }> = {
  Rascunho: { bg: "#FFF8E0", color: "#B07D00" },
  Publicada: { bg: "#E6FAF8", color: "#05245F" },
  Encerrada: { bg: "#F2F2F2", color: "#6A7181" },
  Antiga: { bg: "#F2F2F2", color: "#B1B4BD" },
};

export function PainelPage({ onNavigate, exams }: Props) {
  const total = exams.length;
  const publicadas = exams.filter((e) => e.badge === "Publicada").length;
  const rascunhos = exams.filter((e) => e.badge === "Rascunho").length;
  const encerradas = exams.filter((e) => e.badge === "Encerrada" || e.badge === "Antiga").length;
  const recentes = exams.slice(0, 5);

  const statCards = [
    { value: String(total), label: "Provas criadas", icon: ClipboardDocumentListIcon },
    { value: String(publicadas), label: "Publicadas", icon: GlobeAltIcon },
    { value: String(rascunhos), label: "Rascunhos", icon: PencilIcon },
    { value: String(encerradas), label: "Encerradas", icon: ArchiveBoxIcon },
  ];

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "20px", color: "#000" }}>
            Bem-vindo de volta!
          </h1>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#575454" }}>
            {total > 0
              ? `Você tem ${total} prova${total !== 1 ? "s" : ""} no total`
              : "Nenhuma prova criada ainda"}
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

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white rounded-xl p-4 flex flex-col gap-2" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <div
                className="flex items-center justify-center rounded-lg"
                style={{ width: 36, height: 36, backgroundColor: "#EEF1F8" }}
              >
                <Icon className="w-[18px] h-[18px]" style={{ color: "#6B6FA3" }} />
              </div>
              <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "24px", color: "#6B6FA3" }}>
                {card.value}
              </p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#555" }}>{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Recent exams */}
      <h2 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "18px", color: "#000" }}>
        Provas recentes
      </h2>

      {recentes.length === 0 ? (
        <div
          className="bg-white rounded-xl p-8 flex items-center justify-center"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)", minHeight: 160 }}
        >
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#B1B4BD" }}>
            Nenhuma prova encontrada. Crie sua primeira prova!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {recentes.map((exam) => {
            const badge = badgeStyle[exam.badge] ?? { bg: "#F2F2F2", color: "#6A7181" };
            return (
              <button
                key={exam.id}
                onClick={() => onNavigate("prova-detail", exam)}
                className="bg-white rounded-xl p-4 flex items-center gap-4 text-left w-full hover:opacity-80 transition-opacity"
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)", cursor: "pointer" }}
              >
                <div
                  className="flex items-center justify-center rounded-lg shrink-0"
                  style={{ width: 36, height: 36, backgroundColor: "#EEF1F8" }}
                >
                  <DocumentTextIcon className="w-[18px] h-[18px]" style={{ color: "#6B6FA3" }} />
                </div>
                <div className="flex-1">
                  <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "14px", color: "#000" }}>
                    {exam.title}
                  </p>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#504F4F" }}>
                    {[exam.modalidade, exam.subject, exam.semester].filter(Boolean).join(" • ")}
                  </p>
                </div>
                <span
                  className="px-3 py-1 rounded-lg"
                  style={{ backgroundColor: badge.bg, fontFamily: "Inter, sans-serif", fontSize: "12px", color: badge.color }}
                >
                  {exam.badge}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
