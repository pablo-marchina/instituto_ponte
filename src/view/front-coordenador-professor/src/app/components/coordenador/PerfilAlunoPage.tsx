import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserIcon, DocumentTextIcon, ChartBarIcon, ExclamationTriangleIcon, PencilIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { getAluno, updateAluno } from "../../../../../src/features/alunos/alunos.api";
import { listTurmas } from "../../../../../src/features/turmas/turmas.api";
import { EditarAlunoModal } from "./EditarAlunoModal";

interface Props {
  onBack?: () => void;
  alunoId: string;
}

export function PerfilAlunoPage({ onBack, alunoId }: Props): JSX.Element {
  const queryClient = useQueryClient();
  const [showEditModal, setShowEditModal] = useState(false);

  const { data: aluno, isLoading, isError } = useQuery({
    queryKey: ["alunos", alunoId],
    queryFn: () => getAluno(alunoId),
    enabled: !!alunoId,
  });

  const { data: turmas = [] } = useQuery({
    queryKey: ["turmas"],
    queryFn: listTurmas,
  });

  const updateMutation = useMutation({
    mutationFn: (data: { nome: string; email: string; cpf: string | null; turma: string | null }) =>
      updateAluno(alunoId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["alunos"] });
      void queryClient.invalidateQueries({ queryKey: ["alunos", alunoId] });
    },
  });

  const handleSaveEdit = (data: { nome: string; email: string; cpf: string | null; turma: string | null }) => {
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
          Carregando perfil do aluno...
        </p>
      </div>
    );
  }

  if (isError || !aluno) {
    return (
      <div className="p-8" style={{ backgroundColor: "#F2F2F2", minHeight: "100vh" }}>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#FF6B6B" }}>
          Erro ao carregar dados do aluno.
        </p>
      </div>
    );
  }

  const stats = [
    { icon: DocumentTextIcon, value: aluno.cpf ? "OK" : "Pendente", label: "CPF", sublabel: aluno.cpf ? "Informado" : "Não informado", color: "#05245F" },
    { icon: ChartBarIcon, value: aluno.aceitouTermosEm ? "OK" : "Pendente", label: "Termos LGPD", sublabel: aluno.aceitouTermosEm ? formatDate(aluno.aceitouTermosEm) : "Sem aceite", color: "#10B981" },
    { icon: ExclamationTriangleIcon, value: formatDate(aluno.criadoEm), label: "Cadastro", sublabel: "Criado pelo portal", color: "#FF6B6B" },
    { icon: DocumentTextIcon, value: formatDate(aluno.atualizadoEm), label: "Atualização", sublabel: "Última alteração", color: "#F9B233" },
  ];

  return (
    <>
      <EditarAlunoModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveEdit}
        isSaving={updateMutation.isPending}
        turmas={turmas.map((turma) => turma.nome)}
        initialData={{ nome: aluno.nome, email: aluno.email, cpf: aluno.cpf, turma: aluno.turma }}
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
            <UserIcon className="w-16 h-16" style={{ color: "#6B7280" }} />
          </div>
          <div>
            <h1 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "36px", color: "#6B6FA3" }}>
              {aluno.nome}
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
                  {aluno.nome}
                </p>
              </div>
              <div>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#6A7181", marginBottom: "4px" }}>
                  Email:
                </p>
                <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "16px", color: "#6B6FA3", fontWeight: 500 }}>
                  {aluno.email}
                </p>
              </div>
              <div>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#6A7181", marginBottom: "4px" }}>
                  CPF:
                </p>
                <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "16px", color: "#6B6FA3", fontWeight: 500 }}>
                  {aluno.cpf ?? "Não informado"}
                </p>
              </div>
              <div>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#6A7181", marginBottom: "4px" }}>
                  Turma:
                </p>
                <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "16px", color: "#6B6FA3", fontWeight: 500 }}>
                  {aluno.turma ?? "Nao vinculada"}
                </p>
              </div>
              <div>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#6A7181", marginBottom: "4px" }}>
                  Cadastrado em:
                </p>
                <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "16px", color: "#6B6FA3", fontWeight: 500 }}>
                  {formatDate(aluno.criadoEm)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
