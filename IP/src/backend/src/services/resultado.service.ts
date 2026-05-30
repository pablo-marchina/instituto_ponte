import { forbidden } from "../errors/api-error.js";
import type { AuthUser } from "../middlewares/auth.js";
import { ResultadoRepository } from "../repositories/resultado.repository.js";
import type { ExportarResultadoInput } from "../schemas/resultado.schema.js";
import { StorageService } from "./storage.service.js";
import * as XLSX from "xlsx";

type ResultadoConsolidado = Awaited<ReturnType<ResultadoRepository["findByProva"]>>[number];

const XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const csvValue = (value: unknown) => {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
};

const montarLinhasResultados = (resultados: ResultadoConsolidado[]) => {
  const maxQuestoes = Math.max(0, ...resultados.map((resultado) => resultado.questoes.length));
  const headers = ["Aluno", "Email", "Nota total", "Percentual", "Status", "Pendencias"];

  for (let index = 0; index < maxQuestoes; index += 1) {
    headers.push(`Questao ${index + 1}`);
  }

  const rows = resultados.map((resultado) => [
    resultado.aluno.nome,
    resultado.aluno.email,
    resultado.notaTotal,
    resultado.percentual,
    resultado.pendenciasCorrecao > 0 ? "pendente" : "corrigida",
    resultado.pendenciasCorrecao,
    ...resultado.questoes.map((questao) => questao.nota ?? "pendente"),
  ]);

  return [headers, ...rows];
};

const gerarCsvResultados = (resultados: ResultadoConsolidado[]) => {
  return montarLinhasResultados(resultados).map((row) => row.map(csvValue).join(",")).join("\n");
};

const gerarXlsxResultados = (resultados: ResultadoConsolidado[]) => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(montarLinhasResultados(resultados));

  XLSX.utils.book_append_sheet(workbook, worksheet, "Resultados");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
};

export class ResultadoService {
  constructor(
    private readonly resultadoRepository = new ResultadoRepository(),
    private readonly storageService = new StorageService(),
  ) {}

  async consolidarPorProva(provaId: string, user: AuthUser) {
    const hasAccess = await this.resultadoRepository.hasAccessToProva(provaId, user);
    if (!hasAccess) {
      throw forbidden("Usuário sem permissão para acessar os resultados desta prova.");
    }

    return this.resultadoRepository.findByProva(provaId);
  }

  async exportarPorProva(provaId: string, input: ExportarResultadoInput, user: AuthUser) {
    if (user.perfil !== "coordenador") {
      throw forbidden("Somente coordenadores podem exportar resultados.");
    }

    const resultados = await this.resultadoRepository.findByProva(provaId);
    const pendenciasCorrecao = resultados.reduce((total, resultado) => total + resultado.pendenciasCorrecao, 0);
    const path = `provas/${provaId}/resultados-${Date.now()}.${input.formato}`;
    const arquivo =
      input.formato === "csv"
        ? {
            content: gerarCsvResultados(resultados),
            contentType: "text/csv; charset=utf-8",
          }
        : {
            content: gerarXlsxResultados(resultados),
            contentType: XLSX_CONTENT_TYPE,
          };
    const urlArquivo = await this.storageService.upload({
      path,
      content: arquivo.content,
      contentType: arquivo.contentType,
    });

    return this.resultadoRepository.createExportacao(provaId, user.id, input.formato, urlArquivo, pendenciasCorrecao);
  }
}
