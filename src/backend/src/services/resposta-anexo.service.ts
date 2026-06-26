import { randomUUID } from "node:crypto";
import { businessRule, conflict, notFound } from "../errors/api-error.js";
import type { MultipartFile } from "../helpers/multipart.js";
import { AvaliacaoLogRepository } from "../repositories/avaliacao-log.repository.js";
import { RespostaAnexoRepository } from "../repositories/resposta-anexo.repository.js";

/** Tipos MIME permitidos para upload. */
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "application/pdf"]);
/** Tamanho máximo do arquivo: 5 MB. */
const maxFileSizeBytes = 5 * 1024 * 1024;

const safeFilename = (filename: string) => filename.replace(/[^a-zA-Z0-9._-]/g, "_");

/**
 * Upload de arquivos anexados às respostas do aluno.
 *
 * ## Validações (aplicadas em sequência)
 * 1. A resposta deve existir.
 * 2. A prova do aluno deve estar "em_andamento".
 * 3. A prova deve estar "publicada" e dentro da janela de tempo.
 * 4. A questão deve permitir anexo (`permiteAnexo = true`).
 * 5. O tipo MIME deve ser JPEG, PNG ou PDF.
 * 6. O tamanho máximo é 5 MB.
 *
 * ## Tratamento de erros
 * Em caso de falha, um log de auditoria é registrado com o motivo
 * (`upload_falhou`). A exceção original é propagada para o controller.
 *
 * ## Sanitização
 * O nome do arquivo original é sanitizado (remove caracteres
 * especiais) antes de compor a URL de destino.
 */
export class RespostaAnexoService {
  constructor(
    private readonly respostaAnexoRepository = new RespostaAnexoRepository(),
    private readonly logRepository = new AvaliacaoLogRepository(),
  ) {}

  /**
   * Salva um anexo enviado pelo aluno com validações e log de erros.
   *
   * @param respostaId - ID da resposta à qual o anexo será vinculado.
   * @param file - Arquivo multipart parseado (filename, mimeType, content).
   * @returns Dados do anexo salvo (id, nomeArquivo, mimeType, tamanhoBytes, urlArquivo).
   * @throws notFound - Se a resposta não for encontrada.
   * @throws conflict - Se a prova não estiver em andamento, indisponível, fora do período ou não permitir anexo.
   * @throws businessRule - Se o tipo de arquivo for inválido ou o tamanho exceder 5MB.
   */
  async salvarAnexo(respostaId: string, file: MultipartFile) {
    try {
      return await this.executarUpload(respostaId, file);
    } catch (error) {
      await this.registrarLogErro(respostaId, error);
      throw error;
    }
  }

  /**
   * Executa as validações e o upload do anexo.
   *
   * @param respostaId - ID da resposta.
   * @param file - Arquivo multipart.
   * @returns Dados do anexo criado.
   * @throws notFound - Se a resposta não for encontrada.
   * @throws conflict - Se a prova não estiver em andamento, indisponível, fora do período ou não permitir anexo.
   * @throws businessRule - Se o tipo MIME for inválido ou o tamanho exceder 5MB.
   */
  private async executarUpload(respostaId: string, file: MultipartFile) {
    const context = await this.respostaAnexoRepository.findRespostaContext(respostaId);
    if (!context) {
      throw notFound("Resposta não encontrada.");
    }

    if (context.provaAlunoStatus !== "em_andamento") {
      throw conflict("A prova do aluno não está em andamento.");
    }

    if (context.provaStatus !== "publicada" || !context.dataInicio || !context.dataFim) {
      throw conflict("Prova indisponível para upload de anexo.");
    }

    const now = Date.now();
    const windowEnd = new Date(context.dataFim).getTime();
    const attemptEnd = context.inicioEm && context.tempoLimiteMin !== null
      ? new Date(context.inicioEm).getTime() + context.tempoLimiteMin * 60_000
      : windowEnd;
    const effectiveEnd = Math.min(windowEnd, attemptEnd);
    if (now < new Date(context.dataInicio).getTime() || now > effectiveEnd) {
      throw conflict("Prova fora do período de resposta.");
    }

    if (!context.permiteAnexo) {
      throw conflict("A questão respondida não permite anexo.");
    }

    if (!allowedMimeTypes.has(file.mimeType)) {
      throw businessRule("Tipo de arquivo inválido.");
    }

    if (file.content.length === 0 || file.content.length > maxFileSizeBytes) {
      throw businessRule("Arquivo deve ter até 5MB.");
    }

    const nomeArquivo = safeFilename(file.filename);
    return this.respostaAnexoRepository.create({
      respostaId,
      nomeArquivo,
      mimeType: file.mimeType as "image/jpeg" | "image/png" | "application/pdf",
      tamanhoBytes: file.content.length,
      urlArquivo: `/uploads/respostas/${respostaId}/${randomUUID()}-${nomeArquivo}`,
    });
  }

  /**
   * Registra um log de auditoria para falha de upload.
   *
   * @param respostaId - ID da resposta que gerou o erro.
   * @param error - Erro capturado (extrai a mensagem para o log).
   */
  private async registrarLogErro(respostaId: string, error: unknown) {
    try {
      let provaId: string | undefined;
      let provaAlunoId: string | undefined;

      try {
        const ctx = await this.respostaAnexoRepository.findRespostaContext(respostaId);
        if (ctx) {
          provaId = ctx.provaId;
          provaAlunoId = ctx.provaAlunoId;
        }
      } catch {
        /* contexto indisponível — log sem referências */
      }

      const motivo = error instanceof Error ? error.message : "Erro desconhecido no upload.";

      await this.logRepository.create({
        provaId,
        provaAlunoId,
        atorTipo: "aluno",
        acao: "upload_falhou",
        detalhes: { motivo, respostaId },
      });
    } catch (logError) {
      console.error("[resposta-anexo] Falha ao registrar log de erro:", logError);
    }
  }
}
