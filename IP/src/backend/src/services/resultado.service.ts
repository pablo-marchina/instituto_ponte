import { forbidden, notFound } from "../errors/api-error.js";
import type { AuthUser } from "../middlewares/auth.js";
import { ResultadoRepository } from "../repositories/resultado.repository.js";
import type { ExportarResultadoInput } from "../schemas/resultado.schema.js";
import { StorageService } from "./storage.service.js";
import ExcelJS from "exceljs";

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

  if (resultados.length > 0) {
    const mediaNotaTotal = resultados.reduce((total, resultado) => total + resultado.notaTotal, 0) / resultados.length;
    const mediaPercentual = resultados.reduce((total, resultado) => total + resultado.percentual, 0) / resultados.length;
    const mediasQuestoes = Array.from({ length: maxQuestoes }, (_, index) => {
      const notas = resultados
        .map((resultado) => resultado.questoes[index]?.nota)
        .filter((nota): nota is number => typeof nota === "number");
      if (notas.length === 0) return "";
      return Number((notas.reduce((total, nota) => total + nota, 0) / notas.length).toFixed(2));
    });

    rows.push([
      "Media geral",
      "",
      Number(mediaNotaTotal.toFixed(2)),
      Number(mediaPercentual.toFixed(2)),
      "",
      "",
      ...mediasQuestoes,
    ]);
  }

  return [headers, ...rows];
};

const gerarCsvResultados = (resultados: ResultadoConsolidado[]) => {
  return montarLinhasResultados(resultados).map((row) => row.map(csvValue).join(",")).join("\n");
};

const gerarXlsxResultados = async (resultados: ResultadoConsolidado[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Resultados");
  worksheet.addRows(montarLinhasResultados(resultados));
  worksheet.getRow(1).font = { bold: true };
  const content = await workbook.xlsx.writeBuffer();
  return Buffer.from(content);
};

/**
 * Resultados consolidados por prova e exportação para CSV/XLSX.
 *
 * ## Consolidação
 * A query principal usa CTEs para agregar notas por aluno, calcular
 * percentuais e fazer upsert em `resultado_aluno`. O resultado inclui:
 * - Dados do aluno (nome, email)
 * - Nota total, percentual
 * - Status de liberação
 * - Pendências de correção
 * - Nota individual por questão
 *
 * ## Exportação
 * - CSV: cada linha é um aluno, colunas dinâmicas por questão.
 * - XLSX: mesma estrutura, gerado com a biblioteca `xlsx`.
 * - O arquivo é enviado ao Supabase Storage e o registro salvo
 *   em `exportacao_resultado`.
 * - **Apenas coordenadores** podem exportar.
 */
export class ResultadoService {
  constructor(
    private readonly resultadoRepository = new ResultadoRepository(),
    private readonly storageService = new StorageService(),
  ) {}

  /**
   * Retorna os resultados consolidados de todos os alunos de uma prova.
   *
   * @param provaId - ID da prova.
   * @param user - Usuário autenticado (deve ter permissão de acesso).
   * @returns Lista de resultados consolidados com dados do aluno, nota total, percentual, status e notas por questão.
   * @throws forbidden - Se o usuário não tiver permissão para acessar os resultados.
   */
  async consolidarPorProva(provaId: string, user: AuthUser) {
    const provaExiste = await this.resultadoRepository.findProvaExists(provaId);
    if (!provaExiste) {
      throw notFound("Prova não encontrada.");
    }

    const hasAccess = await this.resultadoRepository.hasAccessToProva(provaId, user);
    if (!hasAccess) {
      throw forbidden("Usuário sem permissão para acessar os resultados desta prova.");
    }

    return this.resultadoRepository.findByProva(provaId);
  }

  /**
   * Gera arquivo CSV ou XLSX com os resultados e faz upload ao storage.
   *
   * @param provaId - ID da prova.
   * @param input.formato - Formato do arquivo: "csv" ou "xlsx".
   * @param user - Usuário autenticado (apenas coordenadores podem exportar).
   * @returns Registro da exportação com URL do arquivo gerado e data de criação.
   * @throws forbidden - Se o usuário não for coordenador.
   */
  async exportarPorProva(provaId: string, input: ExportarResultadoInput, user: AuthUser) {
    if (user.perfil !== "coordenador") {
      throw forbidden("Somente coordenadores podem exportar resultados.");
    }

    const provaExiste = await this.resultadoRepository.findProvaExists(provaId);
    if (!provaExiste) {
      throw notFound("Prova não encontrada.");
    }

    const hasAccess = await this.resultadoRepository.hasAccessToProva(provaId, user);
    if (!hasAccess) {
      throw forbidden("Usuario sem permissao para exportar resultados desta prova.");
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
            content: await gerarXlsxResultados(resultados),
            contentType: XLSX_CONTENT_TYPE,
          };
    const urlArquivo = await this.storageService.upload({
      path,
      content: arquivo.content,
      contentType: arquivo.contentType,
    });

    return this.resultadoRepository.createExportacao(
      provaId,
      user.perfil === "coordenador" ? user.id : null,
      input.formato,
      urlArquivo,
      pendenciasCorrecao,
    );
  }
}
