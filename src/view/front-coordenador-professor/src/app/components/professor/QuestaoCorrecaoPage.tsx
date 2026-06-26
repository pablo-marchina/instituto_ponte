import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeftIcon, ChevronRightIcon, BookmarkIcon, EyeSlashIcon, EyeIcon } from "@heroicons/react/24/outline";
import { MathText } from "../../../../../src/components/math/MathText";
import { listarRespostasPorQuestao, salvarCorrecao } from "../../../../../src/features/correcao/correcao.api";
import type { CorrecaoRespostaDto } from "../../../../../src/features/correcao/correcao.types";
import { AnexosGallery } from "./AnexosGallery";
import { AlternativaCorrecaoCard, CorrecaoQuestionAssets } from "./CorrecaoQuestionAssets";

interface Props {
  onBack: () => void;
  onAllCorrected?: () => void;
  provaId: string | null;
  questaoId: string | null;
}

export function QuestaoCorrecaoPage({ onBack, onAllCorrected, provaId, questaoId }: Props) {
  const queryClient = useQueryClient();
  const [currentStudent, setCurrentStudent] = useState(0);
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [hideNames, setHideNames] = useState(false);
  const [correctedSet, setCorrectedSet] = useState<Set<string>>(new Set());

  const respostasQuery = useQuery({
    queryKey: ["correcao", "respostas", provaId, questaoId],
    queryFn: () => listarRespostasPorQuestao(provaId!, questaoId!),
    enabled: !!provaId && !!questaoId,
  });

  const salvarMutation = useMutation({
    mutationFn: ({ respostaId, nota, observacao }: { respostaId: string; nota: number; observacao?: string }) =>
      salvarCorrecao(respostaId, { nota, observacao }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["correcao", "respostas", provaId, questaoId] });
      void queryClient.invalidateQueries({ queryKey: ["correcao", "questoes", provaId] });
      void queryClient.invalidateQueries({ queryKey: ["questoes"] });
      toast.success("Correção salva com sucesso.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar correcao.");
    },
  });

  const respostas: CorrecaoRespostaDto[] = useMemo(
    () => respostasQuery.data ?? [],
    [respostasQuery.data],
  );
  const student = respostas[currentStudent];
  const totalStudents = respostas.length;
  const correctedCount = correctedSet.size;

  useEffect(() => {
    if (!respostasQuery.isFetched) return;
    const initialCorrected = new Set<string>();
    respostas.forEach((r) => {
      if (r.correcao) {
        initialCorrected.add(r.respostaId);
      }
    });
    setCorrectedSet(initialCorrected);
    setGrades({});
    setComments({});
    setCurrentStudent(0);
  }, [respostas, respostasQuery.isFetched]);

  useEffect(() => {
    if (!student || correctedSet.has(student.respostaId)) return;
    if (!student.correcao) return;
    setGrades((prev) => ({
      ...prev,
      [student.respostaId]: student.correcao!.nota,
    }));
    if (student.correcao?.observacao) {
      setComments((prev) => ({
        ...prev,
        [student.respostaId]: student.correcao!.observacao ?? "",
      }));
    }
  }, [correctedSet, currentStudent, student]);

  function getAutoGrade(resposta: CorrecaoRespostaDto): number | null {
    if (resposta.correcao) return resposta.correcao.nota;
    if (resposta.questaoTipo !== "discursiva" && resposta.alternativaSelecionada) {
      return resposta.alternativaSelecionada.correta ? resposta.pontuacaoMax : 0;
    }
    return null;
  }

  function goNext() {
    if (currentStudent < totalStudents - 1) setCurrentStudent((p) => p + 1);
  }

  function goPrev() {
    if (currentStudent > 0) setCurrentStudent((p) => p - 1);
  }

  async function saveAndAdvance() {
    if (!student) return;

    const grade = grades[student.respostaId] ?? getAutoGrade(student) ?? 0;
    const comment = comments[student.respostaId]?.trim();

    await salvarMutation.mutateAsync({
      respostaId: student.respostaId,
      nota: grade,
      observacao: comment || student.correcao?.observacao || undefined,
    });

    setCorrectedSet((prev) => new Set([...prev, student.respostaId]));

    const isLast = currentStudent === totalStudents - 1;
    if (isLast) {
      onAllCorrected?.();
    } else {
      goNext();
    }
  }

  if (!provaId || !questaoId) {
    return (
      <div className="p-8">
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#B1B4BD" }}>
          Selecione uma questão para corrigir.
        </p>
      </div>
    );
  }

  if (respostasQuery.isLoading) {
    return (
      <div className="p-8">
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#B1B4BD" }}>
          Carregando respostas...
        </p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-8">
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#B1B4BD" }}>
          Nenhuma resposta encontrada para esta questão.
        </p>
      </div>
    );
  }

  const grade = grades[student.respostaId] ?? getAutoGrade(student) ?? 0;
  const progress = totalStudents > 0 ? Math.round((correctedCount / totalStudents) * 100) : 0;
  const isObjective = student.questaoTipo !== "discursiva";

  return (
    <div className="p-8 flex flex-col gap-5">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onBack}
          style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#6A7181", fontWeight: 400 }}
          className="hover:opacity-70 transition-opacity"
        >
          Correção
        </button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: 20, color: "#000" }}>
            Corrigir respostas
          </h1>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setHideNames((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
            style={{
              border: `1.5px solid ${hideNames ? "#05245F" : "#E6E6E6"}`,
              backgroundColor: hideNames ? "#E6FAF8" : "#fff",
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              fontSize: 13,
              color: hideNames ? "#05245F" : "#6B6B6B",
            }}
          >
            {hideNames ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
            {hideNames ? "Mostrar nomes" : "Ocultar nomes"}
          </button>
          <button
            onClick={goPrev}
            disabled={currentStudent === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg transition-opacity"
            style={{
              border: "1px solid #D7D7D9",
              backgroundColor: "#fff",
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              fontSize: 13,
              color: currentStudent === 0 ? "#B1B4BD" : "#111",
              opacity: currentStudent === 0 ? 0.5 : 1,
              cursor: currentStudent === 0 ? "not-allowed" : "pointer",
            }}
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Anterior
          </button>
          <button
            onClick={goNext}
            disabled={currentStudent === totalStudents - 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg transition-opacity"
            style={{
              border: "1px solid #D7D7D9",
              backgroundColor: "#fff",
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              fontSize: 13,
              color: currentStudent === totalStudents - 1 ? "#B1B4BD" : "#111",
              opacity: currentStudent === totalStudents - 1 ? 0.5 : 1,
              cursor: currentStudent === totalStudents - 1 ? "not-allowed" : "pointer",
            }}
          >
            Próximo
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 flex flex-col gap-3" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #EBEBEB" }}>
        <div className="flex items-center justify-between">
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#111" }}>
            Progresso desta questão
          </p>
          <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: 13, color: "#6B6FA3" }}>
            {correctedCount}/{totalStudents} corrigidas
          </p>
        </div>

        <div className="w-full rounded-full h-2" style={{ backgroundColor: "#E5E7EB" }}>
          <div className="h-2 rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: "#6B6FA3" }} />
        </div>

        <div className="flex gap-2 flex-wrap">
          {respostas.map((r, i) => (
            <button
              key={r.respostaId}
              onClick={() => setCurrentStudent(i)}
              title={hideNames ? `Aluno #${String(i + 1).padStart(2, "0")}` : r.aluno.nome}
              className="flex items-center justify-center rounded-lg transition-all hover:opacity-85"
              style={{
                width: 36,
                height: 28,
                backgroundColor: i === currentStudent ? "#6B6FA3" : correctedSet.has(r.respostaId) ? "#05245F" : "#E5E7EB",
              }}
            >
              <span style={{
                fontFamily: "Poppins, sans-serif",
                fontWeight: 700,
                fontSize: 11,
                color: i === currentStudent || correctedSet.has(r.respostaId) ? "#fff" : "#6A7181",
              }}>
                #{String(i + 1).padStart(2, "0")}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl flex flex-col" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #EBEBEB" }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #EBEBEB" }}>
          <div className="flex items-center gap-3">
            {hideNames ? (
              <>
                <div className="flex items-center justify-center rounded-full" style={{ width: 32, height: 32, backgroundColor: "#EEF1F8" }}>
                  <EyeSlashIcon className="w-4 h-4" style={{ color: "#6B6FA3" }} />
                </div>
                <div>
                  <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: 16, color: "#000" }}>
                    Aluno #{String(currentStudent + 1).padStart(2, "0")}
                  </p>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#9B9B9B" }}>
                    Nome oculto para correção justa
                  </p>
                </div>
              </>
            ) : (
              <div>
                <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: 16, color: "#000" }}>
                  {student.aluno.nome}
                </p>
                {student.correcao && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: "#E6FAF8", color: "#05245F", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600 }}>
                    Nota: {student.correcao.nota} · {student.correcao.tipo}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4" style={{ borderBottom: "1px solid #EBEBEB" }}>
          <CorrecaoQuestionAssets enunciado={student.questaoEnunciado} imagemUrl={student.questaoImagemUrl} />

          <div className="rounded-xl p-4" style={{ backgroundColor: "#EAECF0" }}>
            <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14, color: "#111", marginBottom: 8 }}>
              Resposta do Aluno
            </p>
            {student.alternativaSelecionada ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <AlternativaCorrecaoCard
                  title={student.alternativaSelecionada.correta ? "Alternativa marcada correta" : "Alternativa marcada"}
                  alternativa={student.alternativaSelecionada}
                  tone={student.alternativaSelecionada.correta ? "success" : "warning"}
                />
                {!student.alternativaSelecionada.correta && (
                  <AlternativaCorrecaoCard title="Alternativa correta" alternativa={student.alternativaCorreta} tone="success" />
                )}
              </div>
            ) : (
              <MathText style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#504F4F", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {student.respostaTexto ?? "Nenhuma resposta textual."}
              </MathText>
            )}
          </div>

          {student.anexos.length > 0 && (
            <div>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#575555", marginBottom: 10 }}>
                Anexos enviados pelo aluno
              </p>
              <div className="flex gap-3">
                <AnexosGallery anexos={student.anexos} />
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex gap-5 items-start">
            <div className="flex flex-col gap-2" style={{ width: 200 }}>
              <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14, color: "#111" }}>
                Nota (máx: {student.correcao ? "?" : "10"})
              </p>
              <input
                type="number"
                min={0}
                max={student.pontuacaoMax}
                step={0.5}
                value={grade}
                disabled={isObjective}
                onChange={(e) => setGrades((prev) => ({ ...prev, [student.respostaId]: Number(e.target.value) }))}
                style={{
                  height: 44,
                  border: "1.5px solid #D7D7D9",
                  backgroundColor: isObjective ? "#E6FAF8" : "#fff",
                  borderRadius: 12,
                  padding: "0 12px",
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: 700,
                  fontSize: 18,
                  color: "#6B6FA3",
                  outline: "none",
                  width: "100%",
                  textAlign: "center",
                  cursor: isObjective ? "not-allowed" : "text",
                }}
              />
              {isObjective && (
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#05245F", textAlign: "center" }}>
                  Nota atribuida automaticamente.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 flex-1">
              <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14, color: "#111" }}>
                Comentário para o aluno
              </p>
              <textarea
                rows={3}
                placeholder="Digite aqui seu feedback..."
                value={comments[student.respostaId] ?? ""}
                onChange={(e) => setComments((prev) => ({ ...prev, [student.respostaId]: e.target.value }))}
                style={{
                  width: "100%",
                  backgroundColor: "#F2F3F5",
                  border: "1px solid transparent",
                  borderRadius: 8,
                  padding: "10px 13px",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 13,
                  color: "#111",
                  outline: "none",
                  resize: "none",
                }}
                onFocus={(e) => { e.target.style.borderColor = "#05245F"; e.target.style.backgroundColor = "#fff"; }}
                onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = "#F2F3F5"; }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <button
              onClick={goPrev}
              disabled={currentStudent === 0}
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 600,
                fontSize: 12,
                color: currentStudent === 0 ? "#B1B4BD" : "#6A7181",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: currentStudent === 0 ? "not-allowed" : "pointer",
              }}
              className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              Anterior
            </button>

            <button
              onClick={saveAndAdvance}
              disabled={salvarMutation.isPending}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full hover:opacity-85 transition-opacity"
              style={{ backgroundColor: "#6B6FA3", fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 15, color: "#fff" }}
            >
              <BookmarkIcon className="w-4 h-4" style={{ color: "#fff" }} />
              {salvarMutation.isPending ? "Salvando..." : "Salvar e Avançar"}
            </button>

            <button
              onClick={goNext}
              disabled={currentStudent === totalStudents - 1}
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 600,
                fontSize: 12,
                color: currentStudent === totalStudents - 1 ? "#B1B4BD" : "#6A7181",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: currentStudent === totalStudents - 1 ? "not-allowed" : "pointer",
              }}
              className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
            >
              Próximo
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
