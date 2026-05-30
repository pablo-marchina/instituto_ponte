import { pool } from "../database/pool.js";

type RespostaContextRow = {
  id: string;
  questao_id: string;
  permite_anexo: boolean;
  prova_aluno_id: string;
  prova_id: string;
  prova_aluno_status: string;
  prova_status: string;
  data_inicio: Date | string | null;
  data_fim: Date | string | null;
};

type RespostaAnexoRow = {
  id: string;
  url_arquivo: string;
  mime_type: "image/jpeg" | "image/png" | "application/pdf";
  tamanho_bytes: number;
};

const mapRespostaAnexo = (row: RespostaAnexoRow) => ({
  id: row.id,
  urlArquivo: row.url_arquivo,
  mimeType: row.mime_type,
  tamanhoBytes: row.tamanho_bytes,
});

export class RespostaAnexoRepository {
  async findRespostaContext(respostaId: string) {
    const result = await pool.query<RespostaContextRow>(
      `
        SELECT
          ra."id",
          ra."questao_id",
          q."permite_anexo",
          pa."id" AS "prova_aluno_id",
          p."id" AS "prova_id",
          pa."status" AS "prova_aluno_status",
          p."status" AS "prova_status",
          p."data_inicio",
          p."data_fim"
        FROM "resposta_aluno" ra
        JOIN "prova_aluno" pa ON pa."id" = ra."prova_aluno_id"
        JOIN "prova" p ON p."id" = pa."prova_id"
        JOIN "questao" q ON q."id" = ra."questao_id"
        WHERE ra."id" = $1
      `,
      [respostaId],
    );

    return result.rows[0]
      ? {
          id: result.rows[0].id,
          questaoId: result.rows[0].questao_id,
          permiteAnexo: result.rows[0].permite_anexo,
          provaAlunoId: result.rows[0].prova_aluno_id,
          provaId: result.rows[0].prova_id,
          provaAlunoStatus: result.rows[0].prova_aluno_status,
          provaStatus: result.rows[0].prova_status,
          dataInicio: result.rows[0].data_inicio,
          dataFim: result.rows[0].data_fim,
        }
      : null;
  }

  async create(input: {
    respostaId: string;
    urlArquivo: string;
    nomeArquivo: string;
    mimeType: "image/jpeg" | "image/png" | "application/pdf";
    tamanhoBytes: number;
  }) {
    const result = await pool.query<RespostaAnexoRow>(
      `
        INSERT INTO "resposta_anexo" (
          "resposta_id", "url_arquivo", "nome_arquivo", "mime_type", "tamanho_bytes"
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
      [input.respostaId, input.urlArquivo, input.nomeArquivo, input.mimeType, input.tamanhoBytes],
    );

    return mapRespostaAnexo(result.rows[0]);
  }
}
