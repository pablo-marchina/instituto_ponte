import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { DocumentTextIcon, UserIcon, ListBulletIcon } from "@heroicons/react/24/outline";
import type { Exam } from "../../../../../src/features/dashboard/dashboard.types";
import { isPersistedExam } from "../../../../../src/features/dashboard/dashboard.ui-adapter";
import { listarQuestoesCorrecao } from "../../../../../src/features/correcao/correcao.api";
import type { CorrecaoQuestaoDto } from "../../../../../src/features/correcao/correcao.types";

interface Props {
  onNavigate?: (tab: string, exam?: Exam) => void;
  exams?: Exam[];
}

type Modo = "questao" | "aluno";

type ExamWithCorrection = Exam & {
  corrected: number;
  pending: number;
  progress: number;
};

function sumStats(stats: CorrecaoQuestaoDto[]) {
  return stats.reduce(
    (acc, q) => ({
      total: acc.total + q.respostas.total,
      corrigidas: acc.corrigidas + q.respostas.corrigidas,
    }),
    { total: 0, corrigidas: 0 },
  );
}

export function CorrecaoPage({ onNavigate, exams = [] }: Props) {
  const [modo, setModo] = useState<Modo>("questao");

  const realExams = exams.filter(isPersistedExam);

  const correctionQueries = useQueries({
    queries: realExams.map((exam) => ({
      queryKey: ["correcao", "questoes", exam.id],
      queryFn: () => listarQuestoesCorrecao(String(exam.id)),
    })),
  });

  const statsByExamId = new Map<string, { total: number; corrigidas: number }>();
  correctionQueries.forEach((query, index) => {
    const examId = String(realExams[index]?.id);
    if (query.data && examId) {
      statsByExamId.set(examId, sumStats(query.data));
    }
  });

  const examCards: ExamWithCorrection[] = exams.map((exam) => {
    const isReal = isPersistedExam(exam);
    const stats = isReal ? statsByExamId.get(String(exam.id)) : undefined;
    const total = stats?.total ?? 0;
    const corrigidas = stats?.corrigidas ?? 0;
    const pending = total - corrigidas;
    const progress = total > 0 ? Math.round((corrigidas / total) * 100) : 0;

    return {
      ...exam,
      corrected: corrigidas,
      pending,
      progress,
    };
  }).sort((a, b) => {
    if (a.pending !== b.pending) return b.pending - a.pending;
    if (a.progress !== b.progress) return a.progress - b.progress;
    return a.title.localeCompare(b.title);
  });

  const totalSubmissions = examCards.reduce((acc, e) => acc + e.corrected + e.pending, 0);
  const totalCorrected = examCards.reduce((acc, e) => acc + e.corrected, 0);
  const totalPending = examCards.reduce((acc, e) => acc + e.pending, 0);

  const statCards = [
    { label: "Provas ativas", value: exams.length.toString() },
    { label: "Submissões", value: totalSubmissions.toString() },
    { label: "Corrigidas", value: totalCorrected.toString() },
    { label: "Pendentes", value: totalPending.toString() },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "20px", color: "#000" }}>
            Correção
          </h1>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#575454" }}>
            {modo === "questao" ? "Corrija questão por questão em todas as submissões" : "Corrija a prova completa de cada aluno"}
          </p>
        </div>
        <div className="flex max-w-full gap-1 overflow-x-auto p-1 rounded-xl" style={{ backgroundColor: "#fff", border: "1px solid #D7D7D9" }}>
          <button
            onClick={() => setModo("questao")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
            style={{
              backgroundColor: modo === "questao" ? "#F9B233" : "transparent",
              color: modo === "questao" ? "#6B6FA3" : "#6A7181",
              fontFamily: "Poppins, sans-serif",
              fontWeight: modo === "questao" ? 600 : 400,
              fontSize: 13,
            }}
          >
            <ListBulletIcon className="w-4 h-4" />
            Por questão
          </button>
          <button
            onClick={() => setModo("aluno")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
            style={{
              backgroundColor: modo === "aluno" ? "#F9B233" : "transparent",
              color: modo === "aluno" ? "#6B6FA3" : "#6A7181",
              fontFamily: "Poppins, sans-serif",
              fontWeight: modo === "aluno" ? 600 : 400,
              fontSize: 13,
            }}
          >
            <UserIcon className="w-4 h-4" />
            Por aluno
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white rounded-xl p-4 flex flex-col gap-1" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "24px", color: "#6B6FA3" }}>
              {card.value}
            </p>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#555" }}>{card.label}</p>
          </div>
        ))}
      </div>

      <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", letterSpacing: "0.1em", color: "#6B6FA3", textTransform: "uppercase", fontWeight: 600 }}>
        {modo === "questao" ? "Escolha a prova a ser corrigida" : "Escolha a prova para corrigir por aluno"}
      </p>

      <div className="flex flex-col gap-4">
        {examCards.map((exam) => (
          <div
            key={exam.id}
            onClick={() => onNavigate?.(modo === "questao" ? "prova-questoes-correcao" : "correcao-aluno", exam)}
            className="bg-white rounded-xl p-4 flex flex-col gap-3 cursor-pointer hover:shadow-md transition-shadow"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-lg shrink-0" style={{ width: 36, height: 36, backgroundColor: "#EEF1F8" }}>
                <DocumentTextIcon className="w-[18px] h-[18px]" style={{ color: "#6B6FA3" }} />
              </div>
              <div className="flex-1">
                <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "14px", color: "#000" }}>
                  {exam.title}
                </p>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#6A7181" }}>
                  {(exam.corrected + exam.pending)} submissões
                </p>
              </div>
              <span className="px-3 py-1 rounded-full" style={{
                backgroundColor: exam.pending > 0 ? "#FFF8E0" : "#E6FAF8",
                color: exam.pending > 0 ? "#B07D00" : "#05245F",
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                fontWeight: 700,
              }}>
                {exam.pending > 0 ? "Corrigir agora" : "Sem pendências"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { val: exam.corrected.toString(), label: "Provas corrigidas" },
                { val: exam.pending.toString(), label: "Provas pendentes" },
                { val: `${exam.progress}%`, label: "Progresso" },
              ].map((stat, j) => (
                <div key={j} className="rounded-lg p-2 text-center" style={{ backgroundColor: "#F2F2F2" }}>
                  <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "16px", color: "#6B6FA3" }}>
                    {stat.val}
                  </p>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "#6A7181" }}>{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="w-full rounded-full h-1.5" style={{ backgroundColor: "#E5E7EB" }}>
              <div className="h-1.5 rounded-full transition-all" style={{ width: `${exam.progress}%`, backgroundColor: "#6B6FA3" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
