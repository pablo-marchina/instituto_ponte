import { useMemo, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon,
  CheckCircleIcon, UserIcon, BookmarkIcon, MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { MathText } from "../../../../../src/components/math/MathText";
import { listarQuestoesCorrecao, listarRespostasPorQuestao, salvarCorrecao } from "../../../../../src/features/correcao/correcao.api";
import type { CorrecaoQuestaoDto, CorrecaoRespostaDto } from "../../../../../src/features/correcao/correcao.types";
import { useCorrecaoAutomaticaObjetivas } from "../../../../../src/features/correcao/useCorrecaoAutomaticaObjetivas";
import { AnexosGallery } from "./AnexosGallery";
import { AlternativaCorrecaoCard, CorrecaoQuestionAssets } from "./CorrecaoQuestionAssets";

interface Props {
  onBack: () => void;
  provaId: string | null;
  examTitle: string;
}

type RespostaComQuestao = CorrecaoRespostaDto & { questaoId: string };

type StudentCorrection = {
  alunoId: string;
  nome: string;
  respostas: RespostaComQuestao[];
  corrigido: boolean;
};

export function CorrecaoAlunoPage({ onBack, provaId, examTitle }: Props) {
  const queryClient = useQueryClient();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"todos" | "pendente" | "corrigido">("todos");
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const correcaoAutomaticaQuery = useCorrecaoAutomaticaObjetivas(provaId);
  const shouldWaitAutoCorrection = correcaoAutomaticaQuery.isLoading;

  const questoesQuery = useQuery({
    queryKey: ["correcao", "questoes", provaId],
    queryFn: () => listarQuestoesCorrecao(provaId!),
    enabled: !!provaId && !shouldWaitAutoCorrection,
  });

  const questoes: CorrecaoQuestaoDto[] = useMemo(
    () => questoesQuery.data ?? [],
    [questoesQuery.data],
  );

  const allRespostasQueries = useQueries({
    queries: questoes.map((q) => ({
      queryKey: ["correcao", "respostas", provaId, q.questaoId],
      queryFn: async () => {
        const data = await listarRespostasPorQuestao(provaId!, q.questaoId);
        return data.map((r) => ({ ...r, questaoId: q.questaoId }));
      },
      enabled: !!provaId && questoes.length > 0,
    })),
  } as const);

  const salvarMutation = useMutation({
    mutationFn: ({ respostaId, nota, observacao }: { respostaId: string; nota: number; observacao?: string }) =>
      salvarCorrecao(respostaId, { nota, observacao }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["correcao", "respostas", provaId] });
      void queryClient.invalidateQueries({ queryKey: ["correcao", "questoes", provaId] });
      void queryClient.invalidateQueries({ queryKey: ["questoes"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar correcao.");
    },
  });

  const allRespostas: RespostaComQuestao[] = useMemo(
    () => allRespostasQueries.flatMap((q) => (q.data ?? []) as RespostaComQuestao[]),
    [allRespostasQueries],
  );

  const students: StudentCorrection[] = useMemo(() => {
    const map = new Map<string, RespostaComQuestao[]>();
    allRespostas.forEach((r) => {
      const existing = map.get(r.aluno.id) ?? [];
      existing.push(r);
      map.set(r.aluno.id, existing);
    });

    return Array.from(map.entries()).map(([alunoId, respostas]) => ({
      alunoId,
      nome: respostas[0].aluno.nome,
      respostas,
      corrigido: respostas.every((r) => r.correcao || saved.has(r.respostaId)),
    }));
  }, [allRespostas, saved]);

  const selectedStudent = students.find((s) => s.alunoId === selectedStudentId) ?? null;

  function getStudentMedia(alunoId: string): string {
    const student = students.find((s) => s.alunoId === alunoId);
    if (!student || student.respostas.length === 0) return "—";
    const vals = student.respostas.map((r) => {
      const g = grades[r.respostaId] ?? r.correcao?.nota;
      return g ?? null;
    }).filter((v): v is number => v !== null);
    if (vals.length === 0) return "—";
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  }

  function handleGrade(respostaId: string, val: number) {
    setGrades((prev) => ({ ...prev, [respostaId]: val }));
  }

  function handleComment(respostaId: string, val: string) {
    setComments((prev) => ({ ...prev, [respostaId]: val }));
  }

  function getRespostaGrade(resposta: RespostaComQuestao) {
    if (grades[resposta.respostaId] !== undefined) return grades[resposta.respostaId];
    if (resposta.correcao?.nota !== undefined) return resposta.correcao.nota;
    if (resposta.questaoTipo !== "discursiva" && resposta.alternativaSelecionada) {
      return resposta.alternativaSelecionada.correta ? resposta.pontuacaoMax : 0;
    }
    return 0;
  }

  async function handleSaveStudent() {
    if (!selectedStudent) return;

    const promises = selectedStudent.respostas.map((r) =>
      salvarMutation.mutateAsync({
        respostaId: r.respostaId,
        nota: getRespostaGrade(r),
        observacao: comments[r.respostaId]?.trim() || r.correcao?.observacao || undefined,
      }),
    );

    await Promise.all(promises);
    toast.success("Correções do aluno salvas com sucesso.");

    const newSaved = new Set(saved);
    selectedStudent.respostas.forEach((r) => newSaved.add(r.respostaId));
    setSaved(newSaved);

    const idx = students.findIndex((s) => s.alunoId === selectedStudent.alunoId);
    const next = students[idx + 1];
    if (next) setSelectedStudentId(next.alunoId);
    else setSelectedStudentId(null);
  }

  const filteredStudents = students.filter((s) => {
    const matchSearch = s.nome.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === "todos" ||
      (filterStatus === "corrigido" && s.corrigido) ||
      (filterStatus === "pendente" && !s.corrigido);
    return matchSearch && matchStatus;
  });

  const questoesMap = useMemo(
    () => new Map(questoes.map((q) => [q.questaoId, q])),
    [questoes],
  );

  if (!provaId) {
    return (
      <div className="p-8">
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#B1B4BD" }}>
          Selecione uma prova para corrigir.
        </p>
      </div>
    );
  }

  if (shouldWaitAutoCorrection || questoesQuery.isLoading) {
    return (
      <div className="p-8">
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#B1B4BD" }}>
          {shouldWaitAutoCorrection ? "Corrigindo questões objetivas automaticamente..." : "Carregando..."}
        </p>
      </div>
    );
  }

  if (!selectedStudent) {
    return (
      <div className="p-8 flex flex-col gap-6">
        <button onClick={onBack} className="flex items-center gap-2 hover:opacity-70 transition-opacity self-start" style={{ color: "#6A7181" }}>
          <ArrowLeftIcon className="w-5 h-5" />
          <span style={{ fontFamily: "Poppins, sans-serif", fontWeight: 500, fontSize: 14 }}>Voltar para correções</span>
        </button>

        <div>
          <h1 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: 20, color: "#6B6FA3" }}>{examTitle}</h1>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#6A7181", marginTop: 2 }}>
            Correção por aluno · {students.length} alunos · {students.filter((s) => s.corrigido).length} corrigidos
          </p>
          {correcaoAutomaticaQuery.isLoading && (
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#6A7181", marginTop: 4 }}>
              Corrigindo questões objetivas automaticamente...
            </p>
          )}
          {correcaoAutomaticaQuery.data && correcaoAutomaticaQuery.data.respostasCorrigidas > 0 && (
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#05245F", marginTop: 4 }}>
              {correcaoAutomaticaQuery.data.respostasCorrigidas} resposta(s) objetiva(s) corrigida(s) automaticamente.
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl p-4 flex flex-col gap-2" style={{ border: "1px solid #E6E6E6" }}>
          <div className="flex justify-between">
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#111" }}>Progresso geral</span>
            <span style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: 13, color: "#6B6FA3" }}>
              {students.filter((s) => s.corrigido).length}/{students.length} alunos corrigidos
            </span>
          </div>
          <div className="w-full rounded-full h-2" style={{ backgroundColor: "#E5E7EB" }}>
            <div className="h-2 rounded-full transition-all" style={{ width: `${students.length > 0 ? (students.filter((s) => s.corrigido).length / students.length) * 100 : 0}%`, backgroundColor: "#05245F" }} />
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9F9F9F" }} />
            <input
              type="text"
              placeholder="Buscar aluno por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl outline-none"
              style={{ backgroundColor: "#fff", border: "1px solid #D9D9D9", fontFamily: "Inter, sans-serif", fontSize: 13, color: "#111" }}
            />
          </div>
          <div className="flex gap-1 p-1 rounded-xl shrink-0" style={{ backgroundColor: "#fff", border: "1px solid #D7D7D9" }}>
            {(["todos", "pendente", "corrigido"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                className="px-3 py-1.5 rounded-lg transition-all capitalize"
                style={{
                  backgroundColor: filterStatus === f ? "#F9B233" : "transparent",
                  color: filterStatus === f ? "#6B6FA3" : "#6A7181",
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: filterStatus === f ? 600 : 400,
                  fontSize: 12,
                }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, letterSpacing: "0.1em", color: "#6B6FA3", textTransform: "uppercase", fontWeight: 600 }}>
          {filteredStudents.length} aluno{filteredStudents.length !== 1 ? "s" : ""} encontrado{filteredStudents.length !== 1 ? "s" : ""}
        </p>

        <div className="flex flex-col gap-3">
          {filteredStudents.length === 0 && (
            <div className="bg-white rounded-xl p-8 flex items-center justify-center" style={{ border: "1px dashed #D7D7D9" }}>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#B1B4BD" }}>Nenhum aluno encontrado.</p>
            </div>
          )}
          {filteredStudents.map((student) => {
            const isCorrigido = student.corrigido;
            const media = isCorrigido ? getStudentMedia(student.alunoId) : "—";
            return (
              <button
                key={student.alunoId}
                onClick={() => setSelectedStudentId(student.alunoId)}
                className="bg-white rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow text-left w-full"
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: `1.5px solid ${isCorrigido ? "#05245F" : "#EBEBEB"}` }}
              >
                <div className="flex items-center justify-center rounded-full shrink-0" style={{ width: 40, height: 40, backgroundColor: isCorrigido ? "#E6FAF8" : "#EEF1F8" }}>
                  {isCorrigido
                    ? <CheckCircleIcon className="w-5 h-5" style={{ color: "#05245F" }} />
                    : <UserIcon className="w-5 h-5" style={{ color: "#6B6FA3" }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: 14, color: "#111" }}>{student.nome}</p>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                  {isCorrigido && (
                    <span className="px-2.5 py-1 rounded-full" style={{ backgroundColor: "#E6FAF8", color: "#05245F", fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600 }}>
                      Média: {media}
                    </span>
                  )}
                  <span className="px-3 py-1 rounded-full" style={{
                    backgroundColor: isCorrigido ? "#E6FAF8" : "#FFF8E0",
                    color: isCorrigido ? "#05245F" : "#B07D00",
                    fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600,
                  }}>
                    {isCorrigido ? "Corrigido" : "Pendente"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const studentIdx = students.findIndex((s) => s.alunoId === selectedStudent.alunoId);
  const isCorrigido = selectedStudent.corrigido;

  return (
    <div className="p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <button onClick={() => setSelectedStudentId(null)} className="flex items-center gap-2 hover:opacity-70 transition-opacity" style={{ color: "#6A7181" }}>
          <ArrowLeftIcon className="w-5 h-5" />
          <span style={{ fontFamily: "Poppins, sans-serif", fontWeight: 500, fontSize: 14 }}>Voltar para lista</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { const prev = students[studentIdx - 1]; if (prev) setSelectedStudentId(prev.alunoId); }}
            disabled={studentIdx === 0}
            className="p-2 rounded-lg transition-opacity"
            style={{ border: "1px solid #E6E6E6", backgroundColor: "#fff", opacity: studentIdx === 0 ? 0.4 : 1, cursor: studentIdx === 0 ? "not-allowed" : "pointer" }}
          >
            <ChevronLeftIcon className="w-4 h-4" style={{ color: "#6B6FA3" }} />
          </button>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#6A7181" }}>
            {studentIdx + 1} / {students.length}
          </span>
          <button
            onClick={() => { const next = students[studentIdx + 1]; if (next) setSelectedStudentId(next.alunoId); }}
            disabled={studentIdx === students.length - 1}
            className="p-2 rounded-lg transition-opacity"
            style={{ border: "1px solid #E6E6E6", backgroundColor: "#fff", opacity: studentIdx === students.length - 1 ? 0.4 : 1, cursor: studentIdx === students.length - 1 ? "not-allowed" : "pointer" }}
          >
            <ChevronRightIcon className="w-4 h-4" style={{ color: "#6B6FA3" }} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl px-6 py-4 flex items-center justify-between" style={{ border: "1px solid #E6E6E6" }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center rounded-full" style={{ width: 44, height: 44, backgroundColor: "#EEF1F8" }}>
            <UserIcon className="w-5 h-5" style={{ color: "#6B6FA3" }} />
          </div>
          <div>
            <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: 16, color: "#000" }}>{selectedStudent.nome}</p>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#6A7181" }}>
              {examTitle}
            </p>
          </div>
        </div>
        {isCorrigido && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: "#E6FAF8", color: "#05245F", fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600 }}>
            <CheckCircleIcon className="w-4 h-4" />
            Corrigido · Média {getStudentMedia(selectedStudent.alunoId)}
          </span>
        )}
      </div>

      {selectedStudent.respostas.length === 0 ? (
        <div className="bg-white rounded-xl p-10 flex items-center justify-center" style={{ border: "1px solid #E6E6E6" }}>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#B1B4BD" }}>Nenhuma resposta encontrada.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {selectedStudent.respostas.map((resposta) => {
            const questaoInfo = questoesMap.get(resposta.questaoId);
            const ordem = questaoInfo?.ordemOriginal ?? 0;
            const currentGrade = getRespostaGrade(resposta);
            const isObjective = resposta.questaoTipo !== "discursiva";

            return (
              <div key={resposta.respostaId} className="bg-white rounded-xl flex flex-col" style={{ border: "1px solid #EBEBEB", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <div className="px-5 py-4 flex items-start gap-3" style={{ borderBottom: "1px solid #F2F2F2" }}>
                  <div className="flex items-center justify-center rounded-full shrink-0" style={{ width: 28, height: 28, backgroundColor: "#EEF1F8" }}>
                    <span style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: 13, color: "#6B6FA3" }}>{ordem}</span>
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <span className="px-2 py-0.5 rounded-md" style={{ backgroundColor: "#EEF1F8", color: "#6B6FA3", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600, alignSelf: "flex-start" }}>
                      {questaoInfo?.ordemOriginal ?? ""}ª Questão
                    </span>
                    <CorrecaoQuestionAssets enunciado={resposta.questaoEnunciado} imagemUrl={resposta.questaoImagemUrl} />
                  </div>
                </div>

                <div className="px-5 py-4 flex gap-4">
                  <div className="flex-1 flex flex-col gap-2">
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: "#6A7181" }}>Resposta do aluno</p>
                    <div className="rounded-xl p-3" style={{ backgroundColor: "#F7F8FA", border: "1px solid #E6E6E6" }}>
                      {resposta.alternativaSelecionada ? (
                        <div className="grid grid-cols-1 gap-3">
                          <AlternativaCorrecaoCard
                            title={resposta.alternativaSelecionada.correta ? "Alternativa marcada correta" : "Alternativa marcada"}
                            alternativa={resposta.alternativaSelecionada}
                            tone={resposta.alternativaSelecionada.correta ? "success" : "warning"}
                          />
                          {!resposta.alternativaSelecionada.correta && (
                            <AlternativaCorrecaoCard title="Alternativa correta" alternativa={resposta.alternativaCorreta} tone="success" />
                          )}
                        </div>
                      ) : (
                        <MathText style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#111", lineHeight: 1.6 }}>
                          {resposta.respostaTexto ?? "Em branco"}
                        </MathText>
                      )}
                    </div>
                    {resposta.anexos.length > 0 && (
                      <AnexosGallery anexos={resposta.anexos} />
                    )}
                  </div>

                  <div className="flex flex-col gap-2 shrink-0" style={{ width: 120 }}>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: "#6A7181" }}>Nota</p>
                    <input
                      type="number"
                      min={0}
                      max={resposta.pontuacaoMax}
                      step={0.5}
                      value={currentGrade ?? 0}
                      disabled={isObjective}
                      onChange={(e) => handleGrade(resposta.respostaId, Number(e.target.value))}
                      style={{
                        height: 40,
                        backgroundColor: isObjective ? "#E6FAF8" : "#F2F3F5",
                        border: "1px solid transparent",
                        borderRadius: 8,
                        padding: "0 12px",
                        fontFamily: "Poppins, sans-serif",
                        fontWeight: 700,
                        fontSize: 14,
                        color: "#6B6FA3",
                        outline: "none",
                        textAlign: "center",
                        width: "100%",
                        cursor: isObjective ? "not-allowed" : "text",
                      }}
                      onFocus={(e) => { e.target.style.borderColor = "#05245F"; e.target.style.backgroundColor = "#fff"; }}
                      onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = "#F2F3F5"; }}
                    />
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "#9B9B9B", textAlign: "center" }}>
                      {questaoInfo?.pontuacaoMax ? `máx: ${questaoInfo.pontuacaoMax}` : "0 a 10"}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-4">
                  <textarea
                    rows={2}
                    value={comments[resposta.respostaId] ?? resposta.correcao?.observacao ?? ""}
                    onChange={(e) => handleComment(resposta.respostaId, e.target.value)}
                    placeholder="Comentário para o aluno (opcional)..."
                    style={{
                      width: "100%",
                      backgroundColor: "#F2F3F5",
                      border: "1px solid transparent",
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontFamily: "Inter, sans-serif",
                      fontSize: 12,
                      color: "#111",
                      outline: "none",
                      resize: "none",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = "#05245F"; e.target.style.backgroundColor = "#fff"; }}
                    onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = "#F2F3F5"; }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-between items-center bg-white rounded-xl px-6 py-4 sticky bottom-4" style={{ border: "1px solid #E6E6E6", boxShadow: "0 4px 16px rgba(0,0,0,0.10)" }}>
        <div>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#6A7181" }}>Média calculada</p>
          <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: 20, color: "#6B6FA3" }}>
            {getStudentMedia(selectedStudent.alunoId)}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setSelectedStudentId(null)}
            className="px-5 py-2.5 rounded-lg hover:opacity-80 transition-opacity"
            style={{ border: "1px solid #E6E6E6", backgroundColor: "#fff", fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 14, color: "#111" }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveStudent}
            disabled={salvarMutation.isPending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "#6B6FA3", fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14, color: "#fff" }}
          >
            <BookmarkIcon className="w-4 h-4" />
            {salvarMutation.isPending ? "Salvando..." : "Salvar correção do aluno"}
          </button>
        </div>
      </div>
    </div>
  );
}
