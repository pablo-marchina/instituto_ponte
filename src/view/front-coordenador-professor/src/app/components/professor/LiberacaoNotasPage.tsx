import { useState, useEffect } from "react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { PaperAirplaneIcon, ExclamationTriangleIcon, CheckCircleIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import type { Exam } from "../../../../../src/features/dashboard/dashboard.types";
import { isPersistedExam } from "../../../../../src/features/dashboard/dashboard.ui-adapter";
import { getProvaAnalytics } from "../../../../../src/features/analytics/analytics.api";
import type { ProvaAnalyticsDto } from "../../../../../src/features/analytics/analytics.types";
import { exportarAnexosProva } from "../../../../../src/features/anexos/anexos.api";
import type { AnexoExportarItemDto } from "../../../../../src/features/anexos/anexos.types";
import { buildAnexosZip } from "../../../../../src/features/anexos/anexos.zip";
import { liberarEmailsResultado, listarEmailsProva, reenviarEmailResultado } from "../../../../../src/features/emails/emails.api";
import type { EmailEnvioDto } from "../../../../../src/features/emails/emails.types";
import { exportarResultados } from "../../../../../src/features/resultados/resultados.api";

interface ProvaDisponivel {
  id: Exam["id"];
  nome: string;
  disciplina: string;
  turma: string;
  totalAlunos: number;
  corrigidas: number;
  status: "Completa" | "Pendente";
}

interface Props {
  exams?: Exam[];
}

type EnvioTab = "finalizadas" | "sem-submissoes" | "a-corrigir";

function convertExamsToProvasDisponiveis(
  exams: Exam[],
  analyticsByProvaId: Map<string, ProvaAnalyticsDto>,
): ProvaDisponivel[] {
  return exams.map(exam => {
    const analytics = analyticsByProvaId.get(String(exam.id));
    const totalSubmissions = analytics?.envios ?? parseInt(exam.submissions);
    const pendencias = analytics?.pendenciasCorrecao ?? 0;
    const corrigidas = Math.max(0, totalSubmissions - pendencias);

    if (totalSubmissions === 0) {
      return {
        id: exam.id,
        nome: exam.title,
        disciplina: exam.subject,
        turma: exam.turma,
        totalAlunos: 0,
        corrigidas: 0,
        status: "Pendente" as const,
      };
    }

    const isCompleta = corrigidas === totalSubmissions;

    return {
      id: exam.id,
      nome: exam.title,
      disciplina: exam.subject,
      turma: exam.turma,
      totalAlunos: totalSubmissions,
      corrigidas,
      status: isCompleta ? "Completa" : "Pendente",
    };
  });
}

export function LiberacaoNotasPage({ exams = [] }: Props) {
  const queryClient = useQueryClient();
  const realExams = exams.filter(isPersistedExam);
  const analyticsQueries = useQueries({
    queries: realExams.map((exam) => ({
      queryKey: ["analytics", exam.id],
      queryFn: () => getProvaAnalytics(String(exam.id)),
    })),
  });
  const emailQueries = useQueries({
    queries: realExams.map((exam) => ({
      queryKey: ["emails", "prova", exam.id],
      queryFn: () => listarEmailsProva(String(exam.id)),
    })),
  });
  const analyticsByProvaId = new Map(
    analyticsQueries
      .map((query) => query.data)
      .filter((item): item is ProvaAnalyticsDto => Boolean(item))
      .map((item) => [item.provaId, item]),
  );
  const emailRows = emailQueries
    .flatMap((query, index) => {
      const provaId = realExams[index]?.id;
      return (query.data ?? []).map((row) => ({ ...row, provaId }));
    })
    .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  const provasDisponiveis = convertExamsToProvasDisponiveis(exams, analyticsByProvaId);
  const [selectedProvas, setSelectedProvas] = useState<Array<Exam["id"]>>([]);
  const [showModal, setShowModal] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [concluido, setConcluido] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [anexosExportados, setAnexosExportados] = useState<AnexoExportarItemDto[]>([]);
  const [selectedEnvioTab, setSelectedEnvioTab] = useState<EnvioTab>("finalizadas");

  const provasComCorrecoes = provasDisponiveis.filter(p => p.corrigidas > 0);
  const totalAlunos = provasComCorrecoes.reduce((sum, p) => sum + p.totalAlunos, 0);
  const totalCorrigidas = provasComCorrecoes.reduce((sum, p) => sum + p.corrigidas, 0);
  const emailsEnviados = emailRows.filter((row) => row.status === "enviado").length;
  const falhasEnvio = emailRows.filter((row) => row.status === "erro").length;
  const pendentes = Math.max(0, totalAlunos - totalCorrigidas);

  const statCards = [
    { label: "Total de alunos", value: totalAlunos.toString() },
    { label: "E-mails enviados", value: emailsEnviados.toString() },
    { label: "Falhas no envio", value: falhasEnvio.toString() },
    { label: "Pendentes", value: pendentes.toString() },
  ];

  const progressoEnvio = totalAlunos > 0 ? Math.round((emailsEnviados / totalAlunos) * 100) : 0;
  const enviadosPorProva = new Map<Exam["id"], number>();
  emailRows
    .filter((row) => row.status === "enviado" && row.provaId)
    .forEach((row) => enviadosPorProva.set(row.provaId!, (enviadosPorProva.get(row.provaId!) ?? 0) + 1));
  const isJaEnviada = (prova: ProvaDisponivel) =>
    prova.totalAlunos > 0 && (enviadosPorProva.get(prova.id) ?? 0) >= prova.totalAlunos;
  const isFinalizada = (prova: ProvaDisponivel) => prova.totalAlunos > 0 && prova.corrigidas >= prova.totalAlunos;
  const envioTabs: Array<{ id: EnvioTab; label: string; count: number }> = [
    {
      id: "finalizadas",
      label: "Correcoes finalizadas",
      count: provasDisponiveis.filter(isFinalizada).length,
    },
    {
      id: "sem-submissoes",
      label: "Sem submissoes",
      count: provasDisponiveis.filter((prova) => prova.totalAlunos === 0).length,
    },
    {
      id: "a-corrigir",
      label: "Submissoes a corrigir",
      count: provasDisponiveis.filter((prova) => prova.totalAlunos > 0 && prova.corrigidas < prova.totalAlunos).length,
    },
  ];
  const provasEnvioVisiveis = provasDisponiveis.filter((prova) => {
    if (selectedEnvioTab === "finalizadas") return isFinalizada(prova);
    if (selectedEnvioTab === "sem-submissoes") return prova.totalAlunos === 0;
    return prova.totalAlunos > 0 && prova.corrigidas < prova.totalAlunos;
  });
  const provasExportaveis = provasDisponiveis.filter(isFinalizada);

  const toggleProva = (id: Exam["id"]) => {
    setSelectedProvas((prev) =>
      prev.includes(id) ? prev.filter((provaId) => provaId !== id) : [...prev, id]
    );
  };

  const totalAlunosSelected = provasDisponiveis
    .filter((p) => selectedProvas.includes(p.id))
    .reduce((sum, p) => sum + p.totalAlunos, 0);

  const liberarMutation = useMutation({
    mutationFn: async (provaIds: Array<Exam["id"]>) => {
      const ids = provaIds.filter((id): id is string => typeof id === "string");
      return Promise.all(ids.map((id) => liberarEmailsResultado(id, true)));
    },
    onSuccess: async (resultados, provaIds) => {
      await Promise.all(
        provaIds
          .filter((id): id is string => typeof id === "string")
          .map((id) => queryClient.invalidateQueries({ queryKey: ["emails", "prova", id] })),
      );
      const enviados = resultados.reduce((total, resultado) => total + resultado.enviados, 0);
      const falhas = resultados.reduce((total, resultado) => total + resultado.falhas, 0);
      setProgresso(100);
      setEnviando(false);
      if (falhas > 0 || enviados === 0) {
        setSendError(
          falhas > 0
            ? `${falhas} envio(s) falharam. Verifique a configuracao de email e tente reenviar.`
            : "Nenhum email foi enviado. Verifique se ha alunos corrigidos e email real configurado.",
        );
        setConcluido(false);
        return;
      }
      setConcluido(true);
    },
    onError: (error) => {
      setSendError(error instanceof Error ? error.message : "Erro ao enviar notas.");
      setEnviando(false);
    },
  });

  const reenviarMutation = useMutation({
    mutationFn: reenviarEmailResultado,
    onSuccess: (row) => {
      realExams.forEach((exam) => {
        void queryClient.invalidateQueries({ queryKey: ["emails", "prova", exam.id] });
      });
      setExportMessage(
        row.status === "enviado"
          ? "Feedback reenviado com sucesso."
          : row.erro ?? "Reenvio solicitado, mas o e-mail ainda nao foi marcado como enviado.",
      );
    },
    onError: (error) => {
      setExportMessage(error instanceof Error ? error.message : "Erro ao reenviar feedback.");
    },
  });

  const exportarResultadosMutation = useMutation({
    mutationFn: (provaId: string) => exportarResultados(provaId, { formato: "xlsx" }),
    onSuccess: (data, provaId) => {
      setExportMessage(
        data.pendenciasCorrecao > 0
          ? `Exportação gerada com ${data.pendenciasCorrecao} pendência(s) de correção.`
          : "Exportação de resultados gerada.",
      );
      const exam = realExams.find((item) => String(item.id) === provaId);
      const filename = `${(exam?.title ?? `resultados-${provaId}`).replace(/[^\w.-]+/g, "-")}.xlsx`;
      downloadUrl(data.urlArquivo, filename);
    },
    onError: (error) => {
      setExportMessage(error instanceof Error ? error.message : "Erro ao exportar resultados.");
    },
  });

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const downloadUrl = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const exportarAnexosMutation = useMutation({
    mutationFn: exportarAnexosProva,
    onSuccess: async (items, provaId) => {
      setAnexosExportados(items);
      if (items.length === 0) {
        setExportMessage("Nenhum anexo encontrado para esta prova.");
        return;
      }

      const exam = realExams.find((item) => String(item.id) === provaId);
      const zip = await buildAnexosZip(items, exam?.title ?? `prova-${provaId}`);
      downloadBlob(zip.blob, zip.filename);
      setExportMessage(
        zip.failedCount > 0
          ? `Pacote ZIP gerado. ${zip.failedCount} anexo(s) não puderam ser baixados automaticamente; consulte o manifesto no ZIP.`
          : `${items.length} anexo(s) exportado(s) em pacote ZIP.`,
      );
    },
    onError: (error) => {
      setExportMessage(error instanceof Error ? error.message : "Erro ao exportar anexos.");
    },
  });

  const handleEnviarNotas = () => {
    setShowModal(true);
    setEnviando(true);
    setProgresso(0);
    setConcluido(false);
    setSendError(null);
    liberarMutation.mutate(selectedProvas);
  };

  useEffect(() => {
    if (enviando && progresso < 100) {
      const timer = setTimeout(() => {
        setProgresso((prev) => Math.min(prev + 10, 100));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [enviando, progresso]);

  const handleFecharModal = () => {
    setShowModal(false);
    setSelectedProvas([]);
    setProgresso(0);
    setConcluido(false);
    setSendError(null);
  };

  const formatDateTime = (iso: string | null) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusLabel = (status: EmailEnvioDto["status"]) => {
    if (status === "enviado") return "Enviado";
    if (status === "erro") return "Falhou";
    return "Pendente";
  };

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "20px", color: "#000" }}>
            Liberação das Notas
          </h1>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#575454" }}>
            Selecione as provas e envie os resultados por e-mail aos alunos
          </p>
        </div>
        <button
          onClick={handleEnviarNotas}
          disabled={selectedProvas.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:opacity-85 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            border: "1.5px solid #6B6FA3",
            color: "#6B6FA3",
            backgroundColor: "#fff",
            fontFamily: "Poppins, sans-serif",
            fontWeight: 600,
            fontSize: "14px",
          }}
        >
          <PaperAirplaneIcon className="w-[15px] h-[15px]" />
          {selectedProvas.length === 0
            ? "Enviar Notas"
            : `Enviar Notas (${selectedProvas.length} ${selectedProvas.length === 1 ? "prova" : "provas"})`
          }
        </button>
      </div>

      {/* Seleção de Provas */}
      <div className="bg-white rounded-xl p-5 flex flex-col gap-4" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
        <div className="flex items-center justify-between">
          <div>
            <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: "16px", color: "#6B6FA3" }}>
              Selecione as Provas para Envio
            </p>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#6A7181", marginTop: "4px" }}>
              {selectedProvas.length === 0
                ? "Nenhuma prova selecionada"
                : `${selectedProvas.length} ${selectedProvas.length === 1 ? "prova selecionada" : "provas selecionadas"} • ${totalAlunosSelected} ${totalAlunosSelected === 1 ? "aluno" : "alunos"}`
              }
            </p>
          </div>
          {selectedProvas.length > 0 && (
            <button
              onClick={() => setSelectedProvas([])}
              className="px-3 py-1.5 rounded-md transition-opacity hover:opacity-70"
              style={{
                backgroundColor: "#F2F2F2",
                fontFamily: "Inter, sans-serif",
                fontSize: "12px",
                color: "#6A7181",
                fontWeight: 500,
              }}
            >
              Limpar seleção
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {envioTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedEnvioTab(tab.id)}
              className="px-3 py-2 rounded-lg transition-opacity hover:opacity-85"
              style={{
                backgroundColor: selectedEnvioTab === tab.id ? "#F9B233" : "#F2F2F2",
                color: selectedEnvioTab === tab.id ? "#6B6FA3" : "#6A7181",
                fontFamily: "Poppins, sans-serif",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {provasEnvioVisiveis.length === 0 ? (
            <div className="col-span-2 text-center py-8">
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#B1B4BD" }}>
                Nenhuma prova criada ainda. Crie uma prova para começar.
              </p>
            </div>
          ) : (
            provasEnvioVisiveis.map((prova) => {
            const isSelected = selectedProvas.includes(prova.id);
            const semSubmissoes = prova.totalAlunos === 0;
            const semCorrecoes = prova.corrigidas === 0 && prova.totalAlunos > 0;
            const jaEnviada = isJaEnviada(prova);
            const podeSelecionar = isFinalizada(prova) && !jaEnviada;
            const isCompleta = prova.status === "Completa";

            return (
              <button
                key={prova.id}
                onClick={() => podeSelecionar && toggleProva(prova.id)}
                disabled={!podeSelecionar}
                className="text-left p-4 rounded-xl border-2 transition-all hover:border-opacity-70 disabled:cursor-not-allowed"
                style={{
                  borderColor: isSelected ? "#F9B233" : "#E5E7EB",
                  backgroundColor: isSelected ? "#FFFEF5" : "#FFFFFF",
                  opacity: podeSelecionar ? 1 : 0.5,
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
                    <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: "14px", color: "#6B6FA3" }}>
                      {prova.nome}
                    </p>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#6A7181", marginTop: "4px" }}>
                      {prova.disciplina} • {prova.turma} • {prova.totalAlunos} {prova.totalAlunos === 1 ? "aluno" : "alunos"}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {semSubmissoes && (
                        <span
                          className="inline-block px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: "rgba(156,163,175,0.2)",
                            color: "#6B7280",
                            fontFamily: "Inter, sans-serif",
                            fontSize: "11px",
                            fontWeight: 600,
                          }}
                        >
                          Sem submissões
                        </span>
                      )}
                      {semCorrecoes && (
                        <span
                          className="inline-block px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: "rgba(251,191,36,0.2)",
                            color: "#D97706",
                            fontFamily: "Inter, sans-serif",
                            fontSize: "11px",
                            fontWeight: 600,
                          }}
                        >
                          Sem correções
                        </span>
                      )}
                      {jaEnviada && (
                        <span
                          className="inline-block px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: "rgba(34,197,94,0.2)",
                            color: "#15803D",
                            fontFamily: "Inter, sans-serif",
                            fontSize: "11px",
                            fontWeight: 600,
                          }}
                        >
                          Feedback enviado
                        </span>
                      )}
                      {(podeSelecionar || jaEnviada) && (
                        <>
                          <span
                            className="inline-block px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: isCompleta ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.15)",
                              color: isCompleta ? "#22C55E" : "#EF4444",
                              fontFamily: "Inter, sans-serif",
                              fontSize: "11px",
                              fontWeight: 600,
                            }}
                          >
                            {prova.status}
                          </span>
                          <span style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "#6A7181" }}>
                            {prova.corrigidas}/{prova.totalAlunos} corrigidas
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
          )}
        </div>
      </div>

      {(
        <div className="bg-white rounded-xl p-5 flex flex-col gap-4" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <div>
            <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: "16px", color: "#6B6FA3" }}>
              Exportações
            </p>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#6A7181", marginTop: "4px" }}>
              Gere planilhas de resultados ou acesse anexos enviados pelos alunos.
            </p>
          </div>
          {exportMessage && (
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#05245F" }}>
              {exportMessage}
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {provasExportaveis.length === 0 && (
              <div className="md:col-span-2 rounded-xl p-4" style={{ border: "1px solid #E5E7EB" }}>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#6A7181" }}>
                  Nenhuma prova com submissões totalmente corrigidas para exportar.
                </p>
              </div>
            )}
            {provasExportaveis.map((prova) => (
              <div key={prova.id} className="rounded-xl p-4 flex items-center justify-between gap-3" style={{ border: "1px solid #E5E7EB" }}>
                <div className="min-w-0">
                  <p className="truncate" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: "14px", color: "#6B6FA3" }}>
                    {prova.nome}
                  </p>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#6A7181" }}>
                    {prova.disciplina} • {prova.turma}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => exportarResultadosMutation.mutate(String(prova.id))}
                    disabled={exportarResultadosMutation.isPending}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg hover:opacity-85 transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: "#05245F", color: "#fff", fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600 }}
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Resultados
                  </button>
                  <button
                    type="button"
                    onClick={() => exportarAnexosMutation.mutate(String(prova.id))}
                    disabled={exportarAnexosMutation.isPending}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg hover:opacity-85 transition-opacity disabled:opacity-50"
                    style={{ border: "1px solid #6B6FA3", color: "#6B6FA3", backgroundColor: "#fff", fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600 }}
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    ZIP anexos
                  </button>
                </div>
              </div>
            ))}
          </div>
          {anexosExportados.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #E5E7EB" }}>
                    {["Aluno", "Arquivo", "Tipo", "Ação"].map((col) => (
                      <th
                        key={col}
                        className="py-2 pr-4"
                        style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: "12px", color: "#6B6FA3" }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {anexosExportados.map((item) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid #F2F2F2" }}>
                      <td className="py-2 pr-4" style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#111" }}>
                        {item.aluno}
                      </td>
                      <td className="py-2 pr-4" style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#6A7181" }}>
                        {item.nomeArquivo ?? item.id}
                      </td>
                      <td className="py-2 pr-4" style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#6A7181" }}>
                        {item.mimeType}
                      </td>
                      <td className="py-2">
                        <a
                          href={item.urlArquivo}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg hover:opacity-85 transition-opacity"
                          style={{ border: "1px solid #6B6FA3", color: "#6B6FA3", fontFamily: "Inter, sans-serif", fontSize: "12px" }}
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" />
                          Abrir
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white rounded-xl p-4 flex flex-col gap-1" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "24px", color: "#6B6FA3" }}>
              {card.value}
            </p>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#555" }}>{card.label}</p>
          </div>
        ))}
      </div>

      {/* Progress section */}
      <div className="bg-white rounded-xl p-4 flex flex-col gap-2" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
        <div className="flex items-center justify-between">
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#000" }}>Progresso de envio</p>
          <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: "14px", color: "#6B6FA3" }}>{progressoEnvio}%</p>
        </div>
        <div className="w-full rounded-full h-2" style={{ backgroundColor: "#E5E7EB" }}>
          <div className="h-2 rounded-full" style={{ width: `${progressoEnvio}%`, backgroundColor: "#05245F" }} />
        </div>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "#6A7181" }}>{emailsEnviados} de {totalAlunos} alunos notificados</p>
      </div>

      {/* Warning card - só mostra se houver pendências */}
      {pendentes > 0 && (
        <div
          className="bg-white rounded-xl p-4 flex items-center gap-3"
          style={{ border: "2px solid #F59E0B" }}
        >
          <ExclamationTriangleIcon className="w-5 h-5 shrink-0" style={{ color: "#F59E0B" }} />
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#F59E0B" }}>
            {pendentes} {pendentes === 1 ? "aluno com correção pendente" : "alunos com correções pendentes"}
          </p>
        </div>
      )}

      {/* History card */}
      <div className="bg-white rounded-xl p-4 flex flex-col gap-4" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
        <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: "16px", color: "#6B6FA3" }}>
          Histórico de Envios
        </p>

        {emailQueries.some((query) => query.isLoading) ? (
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#6A7181" }}>
            Carregando histórico de envios...
          </p>
        ) : emailRows.length === 0 ? (
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#6A7181" }}>
            Nenhum envio de resultado registrado ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #E5E7EB" }}>
                {["Aluno", "Email", "Status", "Data/Hora", "Ação"].map((col) => (
                  <th
                    key={col}
                    className="pb-2 pr-4"
                    style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: "12px", color: "#6B6FA3" }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {emailRows.map((row) => (
                <tr key={row.id} style={{ borderBottom: "1px solid #F2F2F2" }}>
                  <td className="py-3 pr-4" style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#000" }}>
                    {row.aluno?.nome ?? "-"}
                  </td>
                  <td className="py-3 pr-4" style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#6A7181" }}>
                    {row.destinatario}
                  </td>
                  <td className="py-3 pr-4">
                    {row.status === "enviado" ? (
                      <span
                        className="px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: "rgba(34,197,94,0.2)",
                          color: "#22C55E",
                          fontFamily: "Inter, sans-serif",
                          fontSize: "11px",
                          fontWeight: 600,
                        }}
                      >
                        Enviado
                      </span>
                    ) : row.status === "erro" ? (
                      <span
                        className="px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: "rgba(239,68,68,0.15)",
                          color: "#EF4444",
                          fontFamily: "Inter, sans-serif",
                          fontSize: "11px",
                          fontWeight: 600,
                        }}
                      >
                        Falhou
                      </span>
                    ) : (
                      <span
                        className="px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: "rgba(156,163,175,0.2)",
                          color: "#6B7280",
                          fontFamily: "Inter, sans-serif",
                          fontSize: "11px",
                          fontWeight: 600,
                        }}
                      >
                        {statusLabel(row.status)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4" style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#6A7181" }}>
                    {formatDateTime(row.enviadoEm ?? row.criadoEm)}
                  </td>
                  <td className="py-3">
                    {row.status === "erro" && (
                      <button
                        onClick={() => reenviarMutation.mutate(row.id)}
                        disabled={reenviarMutation.isPending}
                        className="px-3 py-1 rounded-lg hover:opacity-85 transition-opacity"
                        style={{
                          border: "1px solid #6A7181",
                          color: "#6A7181",
                          backgroundColor: "transparent",
                          fontFamily: "Inter, sans-serif",
                          fontSize: "12px",
                        }}
                      >
                        ↺ Reenviar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Modal de Envio */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
        >
          <div
            className="bg-white rounded-2xl p-8 w-full max-w-md relative flex flex-col items-center gap-5"
            style={{ boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {enviando ? (
              <>
                {/* Ícone animado */}
                <div
                  className="flex items-center justify-center rounded-full animate-pulse"
                  style={{ width: 80, height: 80, backgroundColor: "#E6FAF8" }}
                >
                  <PaperAirplaneIcon className="w-10 h-10" style={{ color: "#05245F" }} />
                </div>

                {/* Título */}
                <div className="text-center">
                  <h2 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: "20px", color: "#6B6FA3" }}>
                    Enviando Notas...
                  </h2>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#6A7181", marginTop: "8px" }}>
                    Enviando e-mails para {totalAlunosSelected} {totalAlunosSelected === 1 ? "aluno" : "alunos"}
                  </p>
                </div>

                {/* Barra de progresso */}
                <div className="w-full">
                  <div className="flex justify-between mb-2">
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#6A7181" }}>
                      Progresso
                    </p>
                    <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: "13px", color: "#05245F" }}>
                      {progresso}%
                    </p>
                  </div>
                  <div className="w-full rounded-full h-2.5" style={{ backgroundColor: "#E5E7EB" }}>
                    <div
                      className="h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${progresso}%`, backgroundColor: "#05245F" }}
                    />
                  </div>
                </div>

                {/* Lista de provas */}
                <div className="w-full">
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#6A7181", marginBottom: "8px" }}>
                    Provas sendo enviadas:
                  </p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {provasDisponiveis
                      .filter((p) => selectedProvas.includes(p.id))
                      .map((prova) => (
                        <div
                          key={prova.id}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg"
                          style={{ backgroundColor: "#F2F2F2" }}
                        >
                          <CheckCircleIcon className="w-4 h-4 shrink-0" style={{ color: "#05245F" }} />
                          <p
                            className="truncate"
                            style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#6B6FA3" }}
                          >
                            {prova.nome}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            ) : concluido ? (
              <>
                {/* Ícone de sucesso */}
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{ width: 80, height: 80, backgroundColor: "rgba(34,197,94,0.2)" }}
                >
                  <CheckCircleIcon className="w-12 h-12" style={{ color: "#22C55E" }} />
                </div>

                {/* Título */}
                <div className="text-center">
                  <h2 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: "22px", color: "#6B6FA3" }}>
                    Notas Enviadas!
                  </h2>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#6A7181", marginTop: "8px" }}>
                    Os e-mails foram enviados com sucesso para {totalAlunosSelected} {totalAlunosSelected === 1 ? "aluno" : "alunos"}
                  </p>
                </div>

                {/* Resumo */}
                <div className="w-full p-4 rounded-xl" style={{ backgroundColor: "#F2F2F2" }}>
                  <div className="flex justify-between items-center mb-2">
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#6A7181" }}>
                      Provas enviadas:
                    </p>
                    <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: "14px", color: "#6B6FA3" }}>
                      {selectedProvas.length}
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#6A7181" }}>
                      E-mails enviados:
                    </p>
                    <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: "14px", color: "#22C55E" }}>
                      {totalAlunosSelected}
                    </p>
                  </div>
                </div>

                {/* Botão de fechar */}
                <button
                  onClick={handleFecharModal}
                  className="w-full py-3 rounded-full transition-opacity hover:opacity-85"
                  style={{
                    backgroundColor: "#F9B233",
                    color: "#6B6FA3",
                    fontFamily: "Poppins, sans-serif",
                    fontWeight: 600,
                    fontSize: "16px",
                  }}
                >
                  Concluir
                </button>
              </>
            ) : sendError ? (
              <>
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{ width: 80, height: 80, backgroundColor: "rgba(239,68,68,0.15)" }}
                >
                  <ExclamationTriangleIcon className="w-12 h-12" style={{ color: "#EF4444" }} />
                </div>
                <div className="text-center">
                  <h2 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: "22px", color: "#6B6FA3" }}>
                    Envio não concluído
                  </h2>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#6A7181", marginTop: "8px" }}>
                    {sendError}
                  </p>
                </div>
                <button
                  onClick={handleFecharModal}
                  className="w-full py-3 rounded-full transition-opacity hover:opacity-85"
                  style={{
                    backgroundColor: "#F9B233",
                    color: "#6B6FA3",
                    fontFamily: "Poppins, sans-serif",
                    fontWeight: 600,
                    fontSize: "16px",
                  }}
                >
                  Fechar
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
