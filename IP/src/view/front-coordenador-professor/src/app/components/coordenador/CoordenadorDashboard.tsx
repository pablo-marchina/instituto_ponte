import { useEffect, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  Squares2X2Icon,
  DocumentTextIcon,
  CircleStackIcon,
  ClipboardDocumentCheckIcon,
  PaperAirplaneIcon,
  UserGroupIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import imgLogo from "../../../imports/logo-new.png";
import { PainelPage } from "../professor/PainelPage";
import { ProvasPage } from "../professor/ProvasPage";
import { BancoQuestoesPage } from "../professor/BancoQuestoesPage";
import { CorrecaoPage } from "../professor/CorrecaoPage";
import { LiberacaoNotasPage } from "../professor/LiberacaoNotasPage";
import { NovaProvaPage } from "../professor/NovaProvaPage";
import { ProvaDetailPage } from "../professor/ProvaDetailPage";
import { NovaQuestaoPage } from "../professor/NovaQuestaoPage";
import { QuestaoCorrecaoPage } from "../professor/QuestaoCorrecaoPage";
import { ProvaQuestoesCorrecaoPage } from "../professor/ProvaQuestoesCorrecaoPage";
import { CorrecaoAlunoPage } from "../professor/CorrecaoAlunoPage";
import { GestaoProfessoresPage } from "./GestaoProfessoresPage";
import { GestaoAlunosPage } from "./GestaoAlunosPage";
import { PerfilAlunoPage } from "./PerfilAlunoPage";
import { PerfilProfessorPage } from "./PerfilProfessorPage";
import { useDashboard } from "../../../../../src/features/dashboard/useDashboard";
import { listTurmas } from "../../../../../src/features/turmas/turmas.api";
import { listProfessorMaterias, listProfessores } from "../../../../../src/features/professores/professores.api";

export type CoordenadorTab =
  | "painel"
  | "provas"
  | "banco"
  | "correcao"
  | "liberacao"
  | "gestao-professores"
  | "gestao-alunos"
  | "perfil-aluno"
  | "perfil-professor"
  | "nova-prova"
  | "prova-detail"
  | "nova-questao"
  | "nova-questao-banco"
  | "questao-correcao"
  | "prova-questoes-correcao"
  | "correcao-aluno";

interface Props {
  onLogout: () => void;
  initialTab?: CoordenadorTab;
  onNavigateTab?: (tab: CoordenadorTab) => void;
}

const navItems: { id: CoordenadorTab; label: string; Icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
  { id: "painel", label: "Painel", Icon: Squares2X2Icon },
  { id: "provas", label: "Provas", Icon: DocumentTextIcon },
  { id: "banco", label: "Banco de Questões", Icon: CircleStackIcon },
  { id: "correcao", label: "Correção", Icon: ClipboardDocumentCheckIcon },
  { id: "liberacao", label: "Liberação das Notas", Icon: PaperAirplaneIcon },
  { id: "gestao-professores", label: "Gestão de Professores", Icon: UserGroupIcon },
  { id: "gestao-alunos", label: "Gestão de Alunos", Icon: UserIcon },
];

export function CoordenadorDashboard({ onLogout, initialTab = "painel", onNavigateTab }: Props) {
  const [activeTab, setActiveTabState] = useState<CoordenadorTab>(initialTab);
  const [selectedProfessorId, setSelectedProfessorId] = useState<string | null>(null);
  const [selectedAlunoId, setSelectedAlunoId] = useState<string | null>(null);
  const [currentQuestaoId, setCurrentQuestaoId] = useState<string | null>(null);

  const {
    materiasQuery,
    bancoQuestoes,
    exams,
    examQuestions,
    selectedExam,
    selectedExamId,
    setSelectedExam,
    showPublishModal,
    setShowPublishModal,
    provaDetailQuery,
    provaQuestoesQuery,
    createProvaMutation,
    updateProvaMutation,
    publicarProvaMutation,
    despublicarProvaMutation,
    showCompletionModal,
    setShowCompletionModal,
    addExam,
    deleteExam,
    arquivarExam,
    updateExam,
    publishSelectedExam,
    unpublishSelectedExam,
    addQuestions,
    deleteQuestion,
    updateQuestion,
    reorderQuestion,
    addBancoQuestion,
    createQuestionForSelectedExam,
    updateBancoQuestion,
    deleteBancoQuestion,
    addQuestionToExam,
  } = useDashboard();
  const turmasQuery = useQuery({ queryKey: ["turmas"], queryFn: listTurmas });
  const professoresQuery = useQuery({
    queryKey: ["professores"],
    queryFn: listProfessores,
    select: (result) => result.data,
  });
  const professorMateriasQueries = useQueries({
    queries: (professoresQuery.data ?? []).map((professor) => ({
      queryKey: ["professores", professor.id, "materias"],
      queryFn: () => listProfessorMaterias(professor.id),
      enabled: Boolean(professor.id),
      staleTime: 60_000,
    })),
  });
  const professorMaterias = Object.fromEntries(
    (professoresQuery.data ?? []).map((professor, index) => [
      professor.id,
      (professorMateriasQueries[index]?.data ?? []).map((materia) => materia.id),
    ]),
  );
  const turmaOptions = [
    ...new Set([
      ...(turmasQuery.data ?? []).map((turma) => turma.nome),
      ...exams.map((exam) => exam.turma).filter(Boolean),
    ]),
  ];
  const selectedCorrectionProvaId = selectedExam?.id ? String(selectedExam.id) : selectedExamId;

  useEffect(() => {
    setActiveTabState(initialTab);
  }, [initialTab]);

  const setActiveTab = (tab: CoordenadorTab) => {
    updateProvaMutation.reset?.();
    publicarProvaMutation.reset?.();
    despublicarProvaMutation?.reset?.();
    setActiveTabState(tab);
    onNavigateTab?.(tab);
  };

  const renderPage = () => {
    switch (activeTab) {
      case "painel":
        return (
          <PainelPage
            onNavigate={(tab, exam) => {
              if (exam) setSelectedExam(exam);
              setActiveTab(tab as CoordenadorTab);
            }}
            exams={exams}
          />
        );
      case "provas":
        return <ProvasPage onNavigate={(tab, exam) => {
          if (exam) setSelectedExam(exam);
          setActiveTab(tab as CoordenadorTab);
        }} exams={exams} onDeleteExam={deleteExam} onArchiveExam={arquivarExam} />;
      case "prova-detail":
        return (
          <ProvaDetailPage
            onBack={() => setActiveTab("provas")}
            onNavigate={(tab) => setActiveTab(tab as CoordenadorTab)}
            questions={examQuestions}
            onDeleteQuestion={deleteQuestion}
            onUpdateQuestion={updateQuestion}
            onReorderQuestion={reorderQuestion}
            onAddQuestions={addQuestions}
            bancoQuestoes={bancoQuestoes}
            examTitle={selectedExam?.title || "Título da Prova"}
            examSubject={selectedExam?.subject || "Matéria"}
            examSemester={selectedExam?.semester || "Semestre"}
            examTurma={selectedExam?.turma}
            turmas={turmaOptions}
            examModalidade={selectedExam?.modalidade}
            examTempoProva={selectedExam?.tempoProva}
            examDataInicio={selectedExam?.dataInicio}
            examDataLimite={selectedExam?.dataLimite}
            examOrientacoes={selectedExam?.orientacoes}
            selectedExam={selectedExam ?? undefined}
            materias={materiasQuery.data ?? []}
            onUpdateExam={updateExam}
            onPublish={publishSelectedExam}
            onUnpublish={unpublishSelectedExam}
            showPublishModal={showPublishModal}
            onClosePublishModal={() => setShowPublishModal(false)}
            isLoading={provaDetailQuery.isLoading || provaQuestoesQuery.isLoading}
            errorMessage={
              provaDetailQuery.isError
                ? provaDetailQuery.error.message
                : provaQuestoesQuery.isError
                  ? provaQuestoesQuery.error.message
                  : publicarProvaMutation.isError
                    ? publicarProvaMutation.error.message
                    : despublicarProvaMutation?.isError
                      ? despublicarProvaMutation.error.message
                      : undefined
            }
            isPublishing={publicarProvaMutation.isPending}
            isUnpublishing={despublicarProvaMutation?.isPending ?? false}
            isUpdatingExam={updateProvaMutation.isPending}
            updateExamErrorMessage={updateProvaMutation.isError ? updateProvaMutation.error.message : undefined}
          />
        );
      case "banco":
        return <BancoQuestoesPage onNavigate={(tab) => setActiveTab(tab as CoordenadorTab)} bancoQuestoes={bancoQuestoes} onUpdateQuestion={updateBancoQuestion} onDeleteQuestion={deleteBancoQuestion} provas={exams} onAddToProva={addQuestionToExam} />;
      case "correcao":
        return <CorrecaoPage onNavigate={(tab, exam) => {
          if (exam) setSelectedExam(exam);
          setActiveTab(tab as CoordenadorTab);
        }} exams={exams} />;
      case "liberacao":
        return <LiberacaoNotasPage exams={exams} />;
      case "gestao-professores":
        return <GestaoProfessoresPage
          onNavigateToProfile={(professorId) => {
            setSelectedProfessorId(professorId);
            setActiveTab("perfil-professor");
          }}
        />;
      case "gestao-alunos":
        return <GestaoAlunosPage
          onNavigateToProfile={(alunoId) => {
            setSelectedAlunoId(alunoId);
            setActiveTab("perfil-aluno");
          }}
        />;
      case "perfil-aluno":
        return <PerfilAlunoPage
          onBack={() => setActiveTab("gestao-alunos")}
          alunoId={selectedAlunoId ?? ""}
        />;
      case "perfil-professor":
        return <PerfilProfessorPage
          onBack={() => setActiveTab("gestao-professores")}
          professorId={selectedProfessorId ?? ""}
        />;
      case "nova-prova":
        return (
          <NovaProvaPage
            onBack={() => setActiveTab("provas")}
            onSave={addExam}
            materias={materiasQuery.data ?? []}
            professores={professoresQuery.data ?? []}
            professorMaterias={professorMaterias}
            turmas={turmaOptions}
            isSaving={createProvaMutation.isPending}
            errorMessage={
              createProvaMutation.isError
                ? createProvaMutation.error.message
                : materiasQuery.isError
                  ? materiasQuery.error.message
                  : professoresQuery.isError
                    ? professoresQuery.error.message
                    : undefined
            }
          />
        );
      case "nova-questao":
        return (
          <NovaQuestaoPage
            onBack={() => setActiveTab("prova-detail")}
            onSave={createQuestionForSelectedExam}
            materias={materiasQuery.data ?? []}
            defaultMateriaId={selectedExam?.materiaId}
          />
        );
      case "nova-questao-banco":
        return (
          <NovaQuestaoPage
            onBack={() => setActiveTab("banco")}
            onSave={addBancoQuestion}
            materias={materiasQuery.data ?? []}
          />
        );
      case "prova-questoes-correcao":
        if (!selectedExam) return null;
        return <ProvaQuestoesCorrecaoPage
          onBack={() => setActiveTab("correcao")}
          onNavigateToQuestion={(questaoId) => {
            setCurrentQuestaoId(questaoId);
            setActiveTab("questao-correcao");
          }}
          provaId={selectedCorrectionProvaId}
          examTitle={selectedExam.title || "Título da Prova — Semestre"}
          showCompletionModal={showCompletionModal}
          onResetCompletionModal={() => setShowCompletionModal(false)}
        />;
      case "questao-correcao":
        if (!selectedCorrectionProvaId) return null;
        return <QuestaoCorrecaoPage
          onBack={() => {
            setActiveTab("prova-questoes-correcao");
          }}
          onAllCorrected={() => {
            setShowCompletionModal(true);
            setActiveTab("prova-questoes-correcao");
          }}
          provaId={selectedCorrectionProvaId}
          questaoId={currentQuestaoId}
        />;
      case "correcao-aluno":
        if (!selectedCorrectionProvaId) return null;
        return (
          <CorrecaoAlunoPage
            onBack={() => setActiveTab("correcao")}
            provaId={selectedCorrectionProvaId}
            examTitle={selectedExam?.title || "Prova"}
          />
        );
      default:
        return (
          <PainelPage
            onNavigate={(tab, exam) => {
              if (exam) setSelectedExam(exam);
              setActiveTab(tab as CoordenadorTab);
            }}
            exams={exams}
          />
        );
    }
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col md:flex-row" style={{ backgroundColor: "#F2F2F2" }}>
      <aside
        className="flex shrink-0 flex-col md:w-[240px]"
        style={{
          backgroundColor: "#fff",
          borderRight: "1px solid #D7D7D9",
        }}
      >
        <div className="hidden items-center justify-center px-4 py-6 md:flex">
          <div
            className="flex items-center justify-center rounded-xl"
            style={{ width: 80, height: 80 }}
          >
            <img src={imgLogo} alt="Logo" style={{ width: 120, height: 120, objectFit: "contain" }} />
          </div>
        </div>

        <div style={{ borderTop: "1px solid #D7D7D9" }} />

        <nav className="flex flex-row gap-1 overflow-x-auto px-3 py-3 md:flex-1 md:flex-col md:overflow-y-auto">
          {navItems.map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all hover:opacity-85 md:w-full"
                style={{
                  backgroundColor: isActive ? "#F9B233" : "transparent",
                  color: isActive ? "#6B6FA3" : "#6A7181",
                }}
              >
                <Icon className="w-[18px] h-[18px]" style={{ color: isActive ? "#6B6FA3" : "#6A7181" }} />
                <span style={{ fontFamily: "Poppins, sans-serif", fontWeight: isActive ? 600 : 400, fontSize: "13px" }}>
                  {label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="hidden md:block" style={{ borderTop: "1px solid #D9D9D9" }} />

        <div className="hidden px-3 py-3 md:block">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left hover:opacity-85 transition-opacity"
            style={{ color: "#6A7181" }}
          >
            <ArrowRightOnRectangleIcon className="w-[18px] h-[18px]" style={{ color: "#6A7181" }} />
            <span style={{ fontFamily: "Poppins, sans-serif", fontWeight: 400, fontSize: "13px", color: "#6A7181" }}>
              Sair
            </span>
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  );
}
