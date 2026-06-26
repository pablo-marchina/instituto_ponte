import { pool } from "../database/pool.js";

/** Linha bruta de anexo com JOINs para resposta_aluno, prova_aluno e aluno. */
type AnexoExportarRow = {
  id: string;
  nome_arquivo: string | null;
  mime_type: string;
  tamanho_bytes: number;
  url_arquivo: string;
  aluno_nome: string;
  aluno_id: string;
  questao_id: string;
  resposta_id: string;
  criado_em: Date;
};

/**
 * Repositório de consulta de anexos para exportação/zip de uma prova.
 *
 * JOIN com resposta_aluno, prova_aluno e aluno para associar anexos
 * aos alunos e questões. Ordenado por nome do aluno e data de criação.
 */
export class AnexoExportarRepository {
  /**
   * Verifica se uma prova existe pelo ID.
   *
   * @param provaId - ID da prova.
   * @returns true se a prova existir.
   */
  async findProvaExists(provaId: string) {
    const result = await pool.query(
      'SELECT EXISTS (SELECT 1 FROM "prova" WHERE "id" = $1) AS "exists"',
      [provaId],
    );
    return result.rows[0].exists as boolean;
  }

  /**
   * Lista todos os anexos de uma prova com dados do aluno para exportação.
   *
   * @param provaId - ID da prova.
   * @returns Lista de anexos com dados do aluno.
   */
  async findAnexosPorProva(provaId: string) {
    const result = await pool.query<AnexoExportarRow>(
      `SELECT
        rax."id",
        rax."nome_arquivo",
        rax."mime_type",
        rax."tamanho_bytes",
        rax."url_arquivo",
        a."nome" AS "aluno_nome",
        a."id" AS "aluno_id",
        ra."questao_id",
        ra."id" AS "resposta_id",
        rax."criado_em"
      FROM "resposta_anexo" rax
      JOIN "resposta_aluno" ra ON ra."id" = rax."resposta_id"
      JOIN "prova_aluno" pa ON pa."id" = ra."prova_aluno_id"
      JOIN "aluno" a ON a."id" = pa."aluno_id"
      WHERE pa."prova_id" = $1
      ORDER BY a."nome" ASC, rax."criado_em" ASC`,
      [provaId],
    );

    return result.rows.map((row) => ({
      id: row.id,
      nomeArquivo: row.nome_arquivo,
      mimeType: row.mime_type,
      tamanhoBytes: row.tamanho_bytes,
      urlArquivo: row.url_arquivo,
      aluno: row.aluno_nome,
      alunoId: row.aluno_id,
      questaoId: row.questao_id,
      respostaId: row.resposta_id,
      criadoEm: row.criado_em.toISOString(),
    }));
  }
}
