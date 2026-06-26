import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserIcon, TrashIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { ConfirmDialog } from "../../../../../src/components/feedback/ConfirmDialog";
import { listAlunos, deleteAluno } from "../../../../../src/features/alunos/alunos.api";
import { listProvas } from "../../../../../src/features/provas/provas.api";
import { createTurma, deleteTurma, listTurmas, updateTurma } from "../../../../../src/features/turmas/turmas.api";
import type { TurmaDto } from "../../../../../src/features/turmas/turmas.types";
import { useAnalyticsSummary } from "../../../../../src/features/analytics/useAnalyticsSummary";

interface Props {
  onNavigateToProfile?: (alunoId: string) => void;
}

export function GestaoAlunosPage({ onNavigateToProfile }: Props): JSX.Element {
  const queryClient = useQueryClient();
  const [alunoToDelete, setAlunoToDelete] = useState<string | null>(null);
  const [showAllAlunos, setShowAllAlunos] = useState(false);
  const [turmaNome, setTurmaNome] = useState("");
  const [editingTurma, setEditingTurma] = useState<TurmaDto | null>(null);
  const [selectedTurma, setSelectedTurma] = useState<string | null>(null);

  const { data: alunos, isLoading, isError } = useQuery({
    queryKey: ["alunos"],
    queryFn: listAlunos,
    select: (result) => result.data,
  });

  const { data: provas = [] } = useQuery({
    queryKey: ["provas"],
    queryFn: listProvas,
    select: (result) => result.data,
  });

  const { data: turmas = [] } = useQuery({
    queryKey: ["turmas"],
    queryFn: listTurmas,
  });

  const analytics = useAnalyticsSummary(provas);
  const alunosComCadastroPendente = (alunos ?? []).filter((aluno) => !aluno.cpf).length;
  const visibleAlunos = showAllAlunos ? alunos ?? [] : (alunos ?? []).slice(0, 10);
  const hasHiddenAlunos = (alunos?.length ?? 0) > visibleAlunos.length;
  const turmasResumo = Array.from(
    new Set([
      ...turmas.map((turma) => turma.nome),
      ...(alunos ?? []).map((aluno) => aluno.turma).filter(Boolean),
      ...provas.map((prova) => prova.turma).filter(Boolean),
    ] as string[]),
  )
    .sort()
    .map((turma) => ({
      turma,
      alunos: (alunos ?? []).filter((aluno) => aluno.turma === turma).length,
      provas: provas.filter((prova) => prova.turma === turma).length,
    }));
  const selectedTurmaAlunos = (alunos ?? []).filter((aluno) => aluno.turma === selectedTurma);
  const selectedTurmaProvas = provas.filter((prova) => prova.turma === selectedTurma);
  const selectedAlunoToDelete = alunos?.find((aluno) => aluno.id === alunoToDelete);

  const deleteMutation = useMutation({
    mutationFn: deleteAluno,
    onSuccess: (_data, alunoId) => {
      setAlunoToDelete(null);
      queryClient.setQueryData<Awaited<ReturnType<typeof listAlunos>>>(["alunos"], (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.filter((aluno) => aluno.id !== alunoId),
          meta: old.meta
            ? { ...old.meta, total: old.meta.total === undefined ? undefined : Math.max(0, old.meta.total - 1) }
            : old.meta,
        };
      });
      toast.success("Aluno removido com sucesso.");
      void queryClient.invalidateQueries({ queryKey: ["alunos"] });
      void queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: (error) => {
      setAlunoToDelete(null);
      const message = error instanceof Error ? error.message : "Erro ao remover aluno.";
      toast.error(message);
    },
  });

  const saveTurmaMutation = useMutation({
    mutationFn: () => {
      const payload = { nome: turmaNome.trim(), descricao: null };
      return editingTurma ? updateTurma(editingTurma.id, payload) : createTurma(payload);
    },
    onSuccess: () => {
      toast.success(editingTurma ? "Turma atualizada com sucesso." : "Turma criada com sucesso.");
      setTurmaNome("");
      setEditingTurma(null);
      void queryClient.invalidateQueries({ queryKey: ["turmas"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar turma.");
    },
  });

  const deleteTurmaMutation = useMutation({
    mutationFn: deleteTurma,
    onSuccess: () => {
      toast.success("Turma removida com sucesso.");
      void queryClient.invalidateQueries({ queryKey: ["turmas"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao remover turma.");
    },
  });

  const startEditTurma = (turma: TurmaDto) => {
    setEditingTurma(turma);
    setTurmaNome(turma.nome);
  };

  const handleDeleteAluno = (e: React.MouseEvent, alunoId: string) => {
    e.stopPropagation();
    setAlunoToDelete(alunoId);
  };

  const handleAlunoClick = (alunoId: string) => {
    if (onNavigateToProfile) {
      onNavigateToProfile(alunoId);
    }
  };

  return (
    <>
      <ConfirmDialog
        open={!!alunoToDelete}
        title="Remover aluno?"
        description={
          <div className="flex flex-col gap-3">
            <p>Alunos são cadastrados automaticamente quando iniciam uma prova pelo portal público.</p>
            {selectedAlunoToDelete && (
              <div className="rounded-lg border border-red-100 bg-red-50 p-3">
                <p className="font-semibold text-red-900">{selectedAlunoToDelete.nome}</p>
                <p className="break-all text-red-800">{selectedAlunoToDelete.email}</p>
                <p className="text-red-800">
                  Turma: {selectedAlunoToDelete.turma ?? "sem turma vinculada"}
                </p>
              </div>
            )}
            <p className="text-red-700">
              Remova apenas registros indevidos ou duplicados. O histórico acadêmico associado pode impedir a exclusão.
            </p>
          </div>
        }
        confirmLabel="Remover aluno"
        isLoading={deleteMutation.isPending}
        tone="danger"
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            setAlunoToDelete(null);
          }
        }}
        onConfirm={() => {
          if (alunoToDelete) {
            deleteMutation.mutate(alunoToDelete);
          }
        }}
      />
    <div className="p-8" style={{ backgroundColor: "#F2F2F2", minHeight: "100vh" }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "28px", color: "#6B6FA3" }}>
              Gestão de Alunos
            </h1>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#6A7181", marginTop: "4px" }}>
              Alunos são cadastrados automaticamente quando iniciam uma prova pelo portal público
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{ width: 48, height: 48, backgroundColor: "#F9B233" }}
            >
              <UserIcon className="w-6 h-6" style={{ color: "#6B6FA3" }} />
            </div>
          </div>
          <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "32px", color: "#6B6FA3" }}>
            {isLoading ? "..." : alunos?.length ?? 0}
          </p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#6A7181", marginTop: "4px" }}>
            Alunos cadastrados
          </p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{ width: 48, height: 48, backgroundColor: "#05245F" }}
            >
              <UserIcon className="w-6 h-6" style={{ color: "#FFFFFF" }} />
            </div>
          </div>
          <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "32px", color: "#6B6FA3" }}>
            {analytics.isLoading ? "..." : analytics.summary.inicios}
          </p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#6A7181", marginTop: "4px" }}>
            Inícios de prova
          </p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#9CA3AF", marginTop: "2px" }}>
            Registrados pelo portal do aluno
          </p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{ width: 48, height: 48, backgroundColor: "#FF6B6B" }}
            >
              <UserIcon className="w-6 h-6" style={{ color: "#FFFFFF" }} />
            </div>
          </div>
          <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "32px", color: "#6B6FA3" }}>
            {isLoading ? "..." : alunosComCadastroPendente}
          </p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#6A7181", marginTop: "4px" }}>
            Pendências de cadastro
          </p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#9CA3AF", marginTop: "2px" }}>
            CPFs ou dados incompletos
          </p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{ width: 48, height: 48, backgroundColor: "#10B981" }}
            >
              <UserIcon className="w-6 h-6" style={{ color: "#FFFFFF" }} />
            </div>
          </div>
          <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "32px", color: "#6B6FA3" }}>
            {analytics.isLoading ? "..." : analytics.summary.envios}
          </p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#6A7181", marginTop: "4px" }}>
            Provas enviadas
          </p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#9CA3AF", marginTop: "2px" }}>
            Submissões finalizadas
          </p>
        </div>
      </div>

      {analytics.isError && (
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#FF6B6B", marginBottom: "16px" }}>
          Não foi possível carregar métricas de provas.
        </p>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alunos */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: "18px", color: "#6B6FA3" }}>
              Alunos
            </h2>
          </div>

          {isLoading && (
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#6A7181" }}>
              Carregando alunos...
            </p>
          )}

          {isError && (
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#FF6B6B" }}>
              Erro ao carregar alunos.
            </p>
          )}

          <div className="space-y-3">
            {visibleAlunos.map((aluno) => (
              <div
                key={aluno.id}
                role="button"
                tabIndex={0}
                onClick={() => handleAlunoClick(aluno.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleAlunoClick(aluno.id);
                  }
                }}
                className="group flex w-full items-center gap-4 rounded-lg bg-white p-4 text-left shadow-sm transition-colors hover:bg-gray-50"
                style={{ cursor: "pointer" }}
              >
                <div
                  className="flex items-center justify-center rounded-full shrink-0"
                  style={{ width: 48, height: 48, backgroundColor: "#E5E7EB" }}
                >
                  <UserIcon className="w-6 h-6" style={{ color: "#6B7280" }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "14px", color: "#6B6FA3", fontWeight: 600 }}>
                    {aluno.nome}
                  </p>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#6A7181", marginTop: 2 }}>
                    {aluno.turma ? `Turma: ${aluno.turma}` : "Sem turma vinculada"}
                  </p>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#6A7181" }}>
                    {aluno.email}{aluno.cpf ? ` • CPF: ${aluno.cpf}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleDeleteAluno(e, aluno.id)}
                  className="rounded-lg p-2 opacity-100 transition-all hover:bg-red-50 md:opacity-0 md:group-hover:opacity-100"
                  style={{ color: "#FF6B6B", cursor: "pointer" }}
                  title="Remover aluno"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
          {hasHiddenAlunos && (
            <button
              type="button"
              onClick={() => setShowAllAlunos(true)}
              className="mt-4 px-4 py-2 rounded-lg transition-opacity hover:opacity-85"
              style={{ backgroundColor: "#05245F", color: "#FFFFFF", fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}
            >
              Ver todos os alunos
            </button>
          )}
        </div>
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: "18px", color: "#6B6FA3" }}>
              Turmas
            </h2>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
            <div className="space-y-3">
              <input
                type="text"
                value={turmaNome}
                onChange={(event) => setTurmaNome(event.target.value)}
                placeholder="Nome da turma"
                className="w-full px-4 py-3 rounded-lg"
                style={{ border: "1px solid #D7D7D9", fontFamily: "Inter, sans-serif", fontSize: 14 }}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!turmaNome.trim() || saveTurmaMutation.isPending}
                  onClick={() => saveTurmaMutation.mutate()}
                  className="px-4 py-2 rounded-lg disabled:opacity-50"
                  style={{ backgroundColor: "#F9B233", color: "#6B6FA3", fontFamily: "Poppins, sans-serif", fontWeight: 600, cursor: !turmaNome.trim() || saveTurmaMutation.isPending ? "not-allowed" : "pointer" }}
                >
                  {editingTurma ? "Atualizar turma" : "Criar turma"}
                </button>
                {editingTurma && (
                  <button
                    type="button"
                  onClick={() => {
                    setEditingTurma(null);
                    setTurmaNome("");
                  }}
                    className="px-4 py-2 rounded-lg"
                    style={{ backgroundColor: "#F2F2F2", color: "#6A7181", fontFamily: "Poppins, sans-serif", fontWeight: 600, cursor: "pointer" }}
                  >
                    Cancelar edicao
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {turmasResumo.map((item) => (
              <div key={item.turma} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "14px", color: "#6B6FA3", fontWeight: 600 }}>
                      {item.turma}
                    </p>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#6A7181", marginTop: 4 }}>
                      {item.alunos} alunos vinculados - {item.provas} provas cadastradas
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setSelectedTurma(selectedTurma === item.turma ? null : item.turma)} className="px-3 py-1.5 rounded-lg" style={{ border: "1px solid #D7D7D9", color: "#6B6FA3", fontFamily: "Inter, sans-serif", fontSize: 12, cursor: "pointer" }}>
                      {selectedTurma === item.turma ? "Ocultar" : "Ver detalhes"}
                    </button>
                    {turmas.find((turma) => turma.nome === item.turma) && (
                      <>
                      <button type="button" onClick={() => startEditTurma(turmas.find((turma) => turma.nome === item.turma)!)} className="px-3 py-1.5 rounded-lg" style={{ border: "1px solid #D7D7D9", color: "#05245F", fontFamily: "Inter, sans-serif", fontSize: 12, cursor: "pointer" }}>
                        Editar
                      </button>
                      <button type="button" onClick={() => deleteTurmaMutation.mutate(turmas.find((turma) => turma.nome === item.turma)!.id)} className="px-3 py-1.5 rounded-lg" style={{ border: "1px solid #F4B4A8", color: "#9A3412", fontFamily: "Inter, sans-serif", fontSize: 12, cursor: "pointer" }}>
                        Remover
                      </button>
                      </>
                    )}
                  </div>
                </div>
                {selectedTurma === item.turma && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-lg p-3" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, color: "#05245F", marginBottom: 8 }}>
                        Alunos da turma
                      </p>
                      {selectedTurmaAlunos.length > 0 ? (
                        <div className="space-y-1">
                          {selectedTurmaAlunos.map((aluno) => (
                            <p key={aluno.id} style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#374151" }}>
                              {aluno.nome} - {aluno.email}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#6A7181" }}>Nenhum aluno vinculado.</p>
                      )}
                    </div>
                    <div className="rounded-lg p-3" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E5E7EB" }}>
                      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, color: "#05245F", marginBottom: 8 }}>
                        Provas da turma
                      </p>
                      {selectedTurmaProvas.length > 0 ? (
                        <div className="space-y-1">
                          {selectedTurmaProvas.map((prova) => (
                            <p key={prova.id} style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#374151" }}>
                              {prova.titulo} - {prova.status}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#6A7181" }}>Nenhuma prova vinculada.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {turmasResumo.length === 0 && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#6A7181" }}>
                  Nenhuma turma vinculada ainda.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
