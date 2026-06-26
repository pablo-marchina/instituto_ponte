import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserGroupIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { ConfirmDialog } from "../../../../../src/components/feedback/ConfirmDialog";
import { getStoredAuthSession } from "../../../../../src/features/auth/auth.storage";
import { listProfessores, createProfessor, deleteProfessor } from "../../../../../src/features/professores/professores.api";
import { listProvas } from "../../../../../src/features/provas/provas.api";
import { useAnalyticsSummary } from "../../../../../src/features/analytics/useAnalyticsSummary";
import { NovoProfessorModal } from "./NovoProfessorModal";

interface Props {
  onNavigateToProfile?: (professorId: string) => void;
}

export function GestaoProfessoresPage({ onNavigateToProfile }: Props): JSX.Element {
  const queryClient = useQueryClient();
  const [showNovoProfessorModal, setShowNovoProfessorModal] = useState(false);
  const [professorToDelete, setProfessorToDelete] = useState<string | null>(null);
  const [showAllProfessores, setShowAllProfessores] = useState(false);

  const { data: professores, isLoading, isError } = useQuery({
    queryKey: ["professores"],
    queryFn: listProfessores,
    select: (result) => result.data,
  });

  const { data: provas = [], isLoading: isLoadingProvas } = useQuery({
    queryKey: ["provas"],
    queryFn: listProvas,
    select: (result) => result.data,
  });

  const analytics = useAnalyticsSummary(provas);
  const provasPublicadas = provas.filter((prova) => prova.status === "publicada").length;
  const visibleProfessores = showAllProfessores ? professores ?? [] : (professores ?? []).slice(0, 10);
  const hasHiddenProfessores = (professores?.length ?? 0) > visibleProfessores.length;
  const selectedProfessorToDelete = professores?.find((professor) => professor.id === professorToDelete);

  const createMutation = useMutation({
    mutationFn: createProfessor,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["professores"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProfessor,
    onSuccess: () => {
      setProfessorToDelete(null);
      toast.success("Professor removido com sucesso.");
      void queryClient.invalidateQueries({ queryKey: ["professores"] });
    },
    onError: (error) => {
      setProfessorToDelete(null);
      const message = error instanceof Error ? error.message : "Erro ao remover professor.";
      toast.error(message);
    },
  });

  const handleNovoProfessor = (data: { nome: string; email: string }) => {
    const session = getStoredAuthSession();
    if (!session) return;

    createMutation.mutate({
      nome: data.nome,
      email: data.email,
      coordenadorId: session.usuario.id,
    });
    setShowNovoProfessorModal(false);
  };

  const handleDeleteProfessor = (e: React.MouseEvent, professorId: string) => {
    e.stopPropagation();
    setProfessorToDelete(professorId);
  };

  const handleProfessorClick = (professorId: string) => {
    if (onNavigateToProfile) {
      onNavigateToProfile(professorId);
    }
  };

  return (
    <>
      <NovoProfessorModal
        isOpen={showNovoProfessorModal}
        onClose={() => setShowNovoProfessorModal(false)}
        onSave={handleNovoProfessor}
        isSaving={createMutation.isPending}
      />
      <ConfirmDialog
        open={!!professorToDelete}
        title="Remover professor?"
        description={
          <div className="flex flex-col gap-3">
            <p>Esta ação remove o professor da gestão e ele deixa de aparecer nas seleções da plataforma.</p>
            {selectedProfessorToDelete && (
              <div className="rounded-lg border border-red-100 bg-red-50 p-3">
                <p className="font-semibold text-red-900">{selectedProfessorToDelete.nome}</p>
                <p className="break-all text-red-800">{selectedProfessorToDelete.email}</p>
              </div>
            )}
            <p className="text-red-700">
              Se houver provas vinculadas, a remoção será bloqueada para preservar o histórico.
            </p>
          </div>
        }
        confirmLabel="Remover professor"
        isLoading={deleteMutation.isPending}
        tone="danger"
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            setProfessorToDelete(null);
          }
        }}
        onConfirm={() => {
          if (professorToDelete) {
            deleteMutation.mutate(professorToDelete);
          }
        }}
      />
    <div className="p-8" style={{ backgroundColor: "#F2F2F2", minHeight: "100vh" }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "28px", color: "#6B6FA3" }}>
              Gestão de Professores
            </h1>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#6A7181", marginTop: "4px" }}>
              Gerencie informações e dados dos professores
            </p>
          </div>
          <button
            onClick={() => setShowNovoProfessorModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:opacity-90"
            style={{ backgroundColor: "#05245F", color: "#FFFFFF" }}
          >
            <PlusIcon className="w-5 h-5" />
            <span style={{ fontFamily: "Poppins, sans-serif", fontWeight: 500, fontSize: "14px" }}>
              Novo Professor
            </span>
          </button>
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
              <UserGroupIcon className="w-6 h-6" style={{ color: "#6B6FA3" }} />
            </div>
          </div>
          <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "32px", color: "#6B6FA3" }}>
            {isLoading ? "..." : professores?.length ?? 0}
          </p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#6A7181", marginTop: "4px" }}>
            Professores Ativos
          </p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{ width: 48, height: 48, backgroundColor: "#05245F" }}
            >
              <UserGroupIcon className="w-6 h-6" style={{ color: "#FFFFFF" }} />
            </div>
          </div>
          <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "32px", color: "#6B6FA3" }}>
            {isLoadingProvas ? "..." : provasPublicadas}
          </p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#6A7181", marginTop: "4px" }}>
            Provas Publicadas
          </p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#9CA3AF", marginTop: "2px" }}>
            Disponíveis para alunos
          </p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{ width: 48, height: 48, backgroundColor: "#FF6B6B" }}
            >
              <UserGroupIcon className="w-6 h-6" style={{ color: "#FFFFFF" }} />
            </div>
          </div>
          <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "32px", color: "#6B6FA3" }}>
            {analytics.isLoading ? "..." : analytics.summary.pendenciasCorrecao}
          </p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#6A7181", marginTop: "4px" }}>
            Correções Pendentes
          </p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#9CA3AF", marginTop: "2px" }}>
            Somadas nas provas
          </p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{ width: 48, height: 48, backgroundColor: "#10B981" }}
            >
              <UserGroupIcon className="w-6 h-6" style={{ color: "#FFFFFF" }} />
            </div>
          </div>
          <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "32px", color: "#6B6FA3" }}>
            {analytics.isLoading ? "..." : analytics.summary.envios}
          </p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#6A7181", marginTop: "4px" }}>
            Provas Enviadas
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
        {/* Professores */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: "18px", color: "#6B6FA3" }}>
              Professores
            </h2>
          </div>

          {isLoading && (
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#6A7181" }}>
              Carregando professores...
            </p>
          )}

          {isError && (
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#FF6B6B" }}>
              Erro ao carregar professores.
            </p>
          )}

          <div className="space-y-3">
            {visibleProfessores.map((professor) => (
              <div
                key={professor.id}
                role="button"
                tabIndex={0}
                onClick={() => handleProfessorClick(professor.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleProfessorClick(professor.id);
                  }
                }}
                className="bg-white rounded-lg p-4 shadow-sm flex items-center gap-4 w-full text-left hover:bg-gray-50 transition-colors group"
                style={{ cursor: "pointer" }}
              >
                <div
                  className="flex items-center justify-center rounded-full shrink-0"
                  style={{ width: 48, height: 48, backgroundColor: "#E5E7EB" }}
                >
                  <UserGroupIcon className="w-6 h-6" style={{ color: "#6B7280" }} />
                </div>
                <div className="flex-1">
                  <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "14px", color: "#6B6FA3", fontWeight: 600 }}>
                    {professor.nome}
                  </p>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#6A7181" }}>
                    {professor.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleDeleteProfessor(e, professor.id)}
                  className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"
                  style={{ color: "#FF6B6B", cursor: "pointer" }}
                  title="Remover professor"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
          {hasHiddenProfessores && (
            <button
              type="button"
              onClick={() => setShowAllProfessores(true)}
              className="mt-4 px-4 py-2 rounded-lg transition-opacity hover:opacity-85"
              style={{ backgroundColor: "#05245F", color: "#FFFFFF", fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}
            >
              Ver todos os professores
            </button>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
