import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserGroupIcon, DocumentTextIcon, ChartBarIcon, ExclamationTriangleIcon, PencilIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { listMaterias } from "../../../../../src/features/materias/materias.api";
import {
  getProfessor,
  listProfessorMaterias,
  removerProfessorMateria,
  updateProfessor,
  vincularProfessorMateria,
} from "../../../../../src/features/professores/professores.api";
import { listProvas } from "../../../../../src/features/provas/provas.api";
import { useAnalyticsSummary } from "../../../../../src/features/analytics/useAnalyticsSummary";
import { EditarProfessorModal } from "./EditarProfessorModal";

interface Props {
  onBack?: () => void;
  professorId: string;
}

export function PerfilProfessorPage({ onBack, professorId }: Props): JSX.Element {
  const queryClient = useQueryClient();
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMateriaId, setSelectedMateriaId] = useState("");
  const [vinculoMessage, setVinculoMessage] = useState<string | null>(null);
  const [localMateriaIds, setLocalMateriaIds] = useState<string[]>([]);

  const { data: professor, isLoading, isError } = useQuery({
    queryKey: ["professores", professorId],
    queryFn: () => getProfessor(professorId),
    enabled: !!professorId,
  });

  const { data: provas = [] } = useQuery({
    queryKey: ["provas"],
    queryFn: listProvas,
    select: (result) => result.data.filter((prova) => prova.professorId === professorId),
    enabled: !!professorId,
  });

  const { data: materias = [] } = useQuery({
    queryKey: ["materias"],
    queryFn: listMaterias,
    select: (result) => result.data,
  });

  const { data: materiasVinculadas = [] } = useQuery({
    queryKey: ["professores", professorId, "materias"],
    queryFn: () => listProfessorMaterias(professorId),
    enabled: !!professorId,
  });

  const analytics = useAnalyticsSummary(provas);

  const updateMutation = useMutation({
    mutationFn: (data: { nome: string; email: string }) =>
      updateProfessor(professorId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["professores"] });
      void queryClient.invalidateQueries({ queryKey: ["professores", professorId] });
    },
  });

  const vincularMateriaMutation = useMutation({
    mutationFn: (materiaId: string) => vincularProfessorMateria(professorId, materiaId),
    onSuccess: (_data, materiaId) => {
      setVinculoMessage("Matéria vinculada ao professor.");
      setSelectedMateriaId("");
      setLocalMateriaIds((prev) => Array.from(new Set([...prev, materiaId])));
      void queryClient.invalidateQueries({ queryKey: ["professores", professorId] });
      void queryClient.invalidateQueries({ queryKey: ["professores", professorId, "materias"] });
    },
    onError: (error) => {
      setVinculoMessage(error instanceof Error ? error.message : "Erro ao vincular matéria.");
    },
  });

  const removerMateriaMutation = useMutation({
    mutationFn: (materiaId: string) => removerProfessorMateria(professorId, materiaId),
    onSuccess: (_data, materiaId) => {
      setVinculoMessage("Vínculo removido.");
      setLocalMateriaIds((prev) => prev.filter((id) => id !== materiaId));
      void queryClient.invalidateQueries({ queryKey: ["professores", professorId] });
      void queryClient.invalidateQueries({ queryKey: ["professores", professorId, "materias"] });
    },
    onError: (error) => {
      setVinculoMessage(error instanceof Error ? error.message : "Erro ao remover vínculo.");
    },
  });

  const handleSaveEdit = (data: { nome: string; email: string }) => {
    updateMutation.mutate(data);
  };

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString("pt-BR");
  };

  if (isLoading) {
    return (
      <div className="p-8" style={{ backgroundColor: "#F2F2F2", minHeight: "100vh" }}>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#6A7181" }}>
          Carregando perfil do professor...
        </p>
      </div>
    );
  }

  if (isError || !professor) {
    return (
      <div className="p-8" style={{ backgroundColor: "#F2F2F2", minHeight: "100vh" }}>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#FF6B6B" }}>
          Erro ao carregar dados do professor.
        </p>
      </div>
    );
  }

  const stats = [
    { icon: DocumentTextIcon, value: provas.filter((prova) => prova.status === "publicada").length.toString(), label: "Provas publicadas", sublabel: "Disponíveis para alunos", color: "#05245F" },
    { icon: ChartBarIcon, value: provas.length.toString(), label: "Provas criadas", sublabel: "Total cadastrado", color: "#10B981" },
    { icon: ExclamationTriangleIcon, value: analytics.isLoading ? "..." : analytics.summary.pendenciasCorrecao.toString(), label: "Pendências", sublabel: "Correções pendentes", color: "#FF6B6B" },
    { icon: UserGroupIcon, value: analytics.isLoading ? "..." : analytics.summary.envios.toString(), label: "Submissões", sublabel: "Provas enviadas", color: "#F9B233" },
  ];
  const linkedMateriaIds = Array.from(
    new Set([...materiasVinculadas.map((materia) => materia.id), ...localMateriaIds]),
  );
  const linkedMaterias = linkedMateriaIds
    .map((materiaId) => materias.find((materia) => materia.id === materiaId))
    .filter((materia): materia is NonNullable<typeof materia> => Boolean(materia));
  const availableMaterias = materias.filter((materia) => !linkedMateriaIds.includes(materia.id));

  return (
    <>
      <EditarProfessorModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveEdit}
        isSaving={updateMutation.isPending}
        initialData={{ nome: professor.nome, email: professor.email }}
      />
      <div className="p-8" style={{ backgroundColor: "#F2F2F2", minHeight: "100vh" }}>
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 mb-6 px-4 py-2 rounded-lg hover:bg-white transition-colors"
            style={{ color: "#6A7181" }}
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span style={{ fontFamily: "Poppins, sans-serif", fontWeight: 500, fontSize: "14px" }}>Voltar</span>
          </button>
        )}

        <div className="mb-8 flex items-center gap-6">
          <div
            className="flex items-center justify-center rounded-2xl shrink-0"
            style={{ width: 120, height: 120, backgroundColor: "#E5E7EB" }}
          >
            <UserGroupIcon className="w-16 h-16" style={{ color: "#6B7280" }} />
          </div>
          <div>
            <h1 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "36px", color: "#6B6FA3" }}>
              {professor.nome}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex items-center justify-center rounded-lg"
                  style={{ width: 48, height: 48, backgroundColor: stat.color, opacity: 0.2 }}
                >
                  <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
              </div>
              <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "32px", color: "#6B6FA3" }}>
                {stat.value}
              </p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#6A7181", marginTop: "4px" }}>
                {stat.label}
              </p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#9CA3AF", marginTop: "2px" }}>
                {stat.sublabel}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: "18px", color: "#6B6FA3" }}>
                Informações cadastrais
              </h2>
              <button
                onClick={() => setShowEditModal(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ color: "#6A7181" }}
              >
                <PencilIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
              <div>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#6A7181", marginBottom: "4px" }}>
                  Nome:
                </p>
                <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "16px", color: "#6B6FA3", fontWeight: 500 }}>
                  {professor.nome}
                </p>
              </div>
              <div>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#6A7181", marginBottom: "4px" }}>
                  Email:
                </p>
                <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "16px", color: "#6B6FA3", fontWeight: 500 }}>
                  {professor.email}
                </p>
              </div>
              <div>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#6A7181", marginBottom: "4px" }}>
                  Cadastrado em:
                </p>
                <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "16px", color: "#6B6FA3", fontWeight: 500 }}>
                  {formatDate(professor.criadoEm)}
                </p>
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: "18px", color: "#6B6FA3" }}>
                Matérias vinculadas
              </h2>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
              <div className="flex gap-2">
                <select
                  value={selectedMateriaId}
                  onChange={(event) => setSelectedMateriaId(event.target.value)}
                  className="flex-1 rounded-lg px-3 py-2"
                  style={{ backgroundColor: "#F2F3F5", fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#111" }}
                >
                  <option value="">Selecionar matéria</option>
                  {availableMaterias.map((materia) => (
                    <option key={materia.id} value={materia.id}>{materia.nome}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => selectedMateriaId && vincularMateriaMutation.mutate(selectedMateriaId)}
                  disabled={!selectedMateriaId || vincularMateriaMutation.isPending}
                  className="px-4 py-2 rounded-lg disabled:opacity-50"
                  style={{ backgroundColor: "#05245F", color: "#fff", fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: 600 }}
                >
                  Vincular
                </button>
              </div>

              {vinculoMessage && (
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#05245F" }}>
                  {vinculoMessage}
                </p>
              )}

              <div className="space-y-2">
                {linkedMaterias.length === 0 ? (
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#6A7181" }}>
                    Nenhuma matéria vinculada ainda.
                  </p>
                ) : (
                  linkedMaterias.map((materia) => (
                    <div key={materia.id} className="flex items-center justify-between gap-3 rounded-lg p-3" style={{ backgroundColor: "#F2F2F2" }}>
                      <div>
                        <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "14px", color: "#6B6FA3", fontWeight: 600 }}>
                          {materia.nome}
                        </p>
                        {materia.codigo && (
                          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#6A7181" }}>
                            {materia.codigo}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removerMateriaMutation.mutate(materia.id)}
                        disabled={removerMateriaMutation.isPending}
                        className="px-3 py-1.5 rounded-lg disabled:opacity-50"
                        style={{ border: "1px solid #FF6B6B", color: "#FF6B6B", backgroundColor: "#fff", fontFamily: "Inter, sans-serif", fontSize: "12px" }}
                      >
                        Remover
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
