import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BancoQuestion, Exam } from "../../../../../src/features/dashboard/dashboard.types";
import { AnexosGallery } from "./AnexosGallery";
import { CompartilharModal } from "./CompartilharModal";
import { CorrecaoCompletaModal } from "./CorrecaoCompletaModal";
import { PainelPage } from "./PainelPage";
import { ProvasPage } from "./ProvasPage";
import { SelecionarOrigemQuestaoModal } from "./SelecionarOrigemQuestaoModal";
import { SelecionarProvaModal } from "./SelecionarProvaModal";
import { SuccessNotification } from "./SuccessNotification";

vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,qr-code"),
  },
}));

const exams: Exam[] = [
  {
    id: "prova-1",
    title: "Prova de Matematica",
    modalidade: "Online",
    discipline: "Calculo",
    subject: "Matematica",
    turma: "A",
    semester: "2026.1",
    badge: "Publicada",
    submissions: "12",
    professorName: "Ada",
  },
  {
    id: "prova-2",
    title: "Prova de Historia",
    modalidade: "Presencial",
    discipline: "Historia",
    subject: "Humanas",
    turma: "B",
    semester: "2026.2",
    badge: "Encerrada",
    submissions: "4",
    professorName: "Turing",
  },
  {
    id: "prova-3",
    title: "Rascunho de Fisica",
    modalidade: "Online",
    discipline: "Fisica",
    subject: "Exatas",
    turma: "A",
    semester: "2026.1",
    badge: "Rascunho",
    submissions: "0",
    professorName: "Ada",
  },
];

const bancoQuestion: BancoQuestion = {
  id: "questao-1",
  type: "Discursiva",
  materia: "Matematica",
  materiaId: "materia-1",
  semestre: "2026.1",
  dificuldade: "Media",
  text: "Explique o teorema",
  pontuacaoPadrao: 2,
  timesUsed: 3,
  successRate: 75,
};

describe("professor smoke components", () => {
  beforeEach(() => {
    vi.useRealTimers();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renderiza painel com estatisticas e navega para prova recente", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(<PainelPage exams={exams} onNavigate={onNavigate} />);

    expect(screen.getByText(/bem-vindo/i)).toBeInTheDocument();
    expect(screen.getByText("Prova de Matematica")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /nova prova/i }));
    expect(onNavigate).toHaveBeenCalledWith("nova-prova");

    await user.click(screen.getByRole("button", { name: /prova de matematica/i }));
    expect(onNavigate).toHaveBeenCalledWith("prova-detail", exams[0]);
  });

  it("filtra, navega, exclui e arquiva provas", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const onDeleteExam = vi.fn();
    const onArchiveExam = vi.fn();

    render(
      <ProvasPage
        exams={exams}
        onNavigate={onNavigate}
        onDeleteExam={onDeleteExam}
        onArchiveExam={onArchiveExam}
      />,
    );

    await user.type(screen.getByPlaceholderText(/buscar provas/i), "Historia");
    expect(screen.getByText("Prova de Historia")).toBeInTheDocument();
    expect(screen.queryByText("Prova de Matematica")).not.toBeInTheDocument();

    await user.click(screen.getByText("Prova de Historia"));
    expect(onNavigate).toHaveBeenCalledWith("prova-detail", exams[1]);

    await user.click(screen.getByTitle("Deletar prova"));
    expect(onDeleteExam).toHaveBeenCalledWith("prova-2");

    await user.click(screen.getByTitle("Arquivar prova"));
    expect(onArchiveExam).toHaveBeenCalledWith("prova-2");
  });

  it("renderiza modal de origem e dispara opcoes", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onNovaQuestao = vi.fn();
    const onBancoQuestoes = vi.fn();

    render(
      <SelecionarOrigemQuestaoModal
        isOpen
        onClose={onClose}
        onNovaQuestao={onNovaQuestao}
        onBancoQuestoes={onBancoQuestoes}
      />,
    );

    await user.click(screen.getByRole("button", { name: /nova quest/i }));
    expect(onNovaQuestao).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);

    cleanup();
    render(
      <SelecionarOrigemQuestaoModal
        isOpen
        onClose={onClose}
        onNovaQuestao={onNovaQuestao}
        onBancoQuestoes={onBancoQuestoes}
      />,
    );

    await user.click(screen.getByRole("button", { name: /banco de quest/i }));
    expect(onBancoQuestoes).toHaveBeenCalledTimes(1);
  });

  it("adiciona questao do banco em prova selecionada", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onAddToProva = vi.fn();

    render(
      <SelecionarProvaModal
        isOpen
        onClose={onClose}
        questao={bancoQuestion}
        provas={exams}
        onAddToProva={onAddToProva}
      />,
    );

    await user.click(screen.getByRole("button", { name: /prova de matematica/i }));
    expect(onAddToProva).toHaveBeenCalledWith("prova-1", bancoQuestion);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("mostra galeria de anexos e fecha preview", async () => {
    const user = userEvent.setup();

    render(
      <AnexosGallery
        anexos={[
          { id: "a1", urlArquivo: "https://example.com/a.png", mimeType: "image/png", nomeArquivo: "grafico.png" },
          { id: "a2", urlArquivo: "https://example.com/a.pdf", mimeType: "application/pdf", nomeArquivo: "relatorio.pdf" },
        ]}
      />,
    );

    await user.click(screen.getByTitle("grafico.png"));
    expect(screen.getAllByAltText("grafico.png")).toHaveLength(2);

    await user.click(screen.getByLabelText(/fechar galeria/i));
    expect(screen.queryByLabelText(/fechar galeria/i)).not.toBeInTheDocument();

    await user.click(screen.getByTitle("relatorio.pdf"));
    expect(screen.getAllByTitle("relatorio.pdf")).toHaveLength(2);
  });

  it("gera QR code, copia link e fecha modal de compartilhamento", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<CompartilharModal onClose={onClose} urlAcesso="https://prova.example/acesso" />);

    expect(screen.getByText("https://prova.example/acesso")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByAltText(/qr code da prova/i)).toBeInTheDocument());

    await user.click(screen.getByTitle(/copiar link/i));
    expect(screen.getByTitle(/copiar link/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("executa acoes do modal de correcao completa", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSave = vi.fn();
    const onContinue = vi.fn();

    render(<CorrecaoCompletaModal isOpen onClose={onClose} onSave={onSave} onContinue={onContinue} />);

    await user.click(screen.getByRole("button", { name: /salvar corre/i }));
    await user.click(screen.getByRole("button", { name: /continuar corrigindo/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("fecha notificacao automaticamente quando visivel", () => {
    vi.useFakeTimers();
    const onClose = vi.fn();

    render(<SuccessNotification isVisible onClose={onClose} message="Tudo certo" />);

    expect(screen.getByText("Tudo certo")).toBeInTheDocument();
    vi.advanceTimersByTime(3000);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
