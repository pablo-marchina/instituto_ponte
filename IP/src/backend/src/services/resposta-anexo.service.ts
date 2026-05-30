import { randomUUID } from "node:crypto";
import { businessRule, conflict, notFound } from "../errors/api-error.js";
import type { MultipartFile } from "../helpers/multipart.js";
import { AvaliacaoLogRepository } from "../repositories/avaliacao-log.repository.js";
import { RespostaAnexoRepository } from "../repositories/resposta-anexo.repository.js";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "application/pdf"]);
const maxFileSizeBytes = 5 * 1024 * 1024;

const safeFilename = (filename: string) => filename.replace(/[^a-zA-Z0-9._-]/g, "_");

export class RespostaAnexoService {
  constructor(
    private readonly respostaAnexoRepository = new RespostaAnexoRepository(),
    private readonly logRepository = new AvaliacaoLogRepository(),
  ) {}

  async salvarAnexo(respostaId: string, file: MultipartFile) {
    try {
      return await this.executarUpload(respostaId, file);
    } catch (error) {
      await this.registrarLogErro(respostaId, error);
      throw error;
    }
  }

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
    if (now < new Date(context.dataInicio).getTime() || now > new Date(context.dataFim).getTime()) {
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
    } catch {
      /* falha no log não deve quebrar o fluxo original */
    }
  }
}
