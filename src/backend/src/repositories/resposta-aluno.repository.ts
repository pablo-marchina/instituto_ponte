import type { PoolClient } from "pg";
import { pool } from "../database/pool.js";
import { withTransaction } from "../database/transaction.js";
import { toIsoString } from "../helpers/date.js";
import type { RespostaSalva, RespostaAluno, ProvaAlunoContext, QuestaoResposta, EnvioFinal } from "../models/resposta.model.js";
import type { SalvarRespostaInput } from "../schemas/resposta-aluno.schema.js";

/** Linha bruta da tabela `prova_aluno` com JOIN em `prova`. Campos em snake_case. */
type ProvaAlunoContextRow = {
  id: string;
  prova_id: string;
  status: string;
  prova_status: string;
  data_inicio: Date | string | null;
  data_fim: Date | string | null;
  inicio_em: Date | string | null;
  tempo_limite_min: number | null;
};

/** Linha resumo da tabela `questao` para validação de tipo e limites. */
type QuestaoRespostaRow = {
  id: string;
  tipo: "multipla_escolha" | "verdadeiro_falso" | "discursiva";
  limite_caracteres: number | null;
};

/** Linha bruta da tabela `resposta_aluno`. Campos em snake_case. */
type RespostaRow = {
  id: string;
  prova_aluno_id: string;
  questao_id: string;
  alternativa_id: string | null;
  resposta_texto: string | null;
  rascunho: boolean;
  sincronizada_em: Date | string;
};

/** Linha da tabela `prova_aluno` após atualização de envio. */
type EnvioRow = {
  id: string;
  status: "enviada";
  enviada_em: Date | string | null;
};

/** Converte uma RespostaRow para o modelo RespostaSalva (camelCase).
 *  Retorna apenas id, sincronizadaEm e rascunho — usado como retorno do upsert. */
const mapRespostaSalva = (row: RespostaRow): RespostaSalva => ({
  id: row.id,
  sincronizadaEm: toIsoString(row.sincronizada_em) ?? "",
  rascunho: row.rascunho,
});

/** Converte uma RespostaRow para o modelo RespostaAluno (camelCase).
 *  Estende mapRespostaSalva adicionando provaAlunoId, questaoId, alternativaId e respostaTexto. */
const mapResposta = (row: RespostaRow): RespostaAluno => ({
  ...mapRespostaSalva(row),
  provaAlunoId: row.prova_aluno_id,
  questaoId: row.questao_id,
  alternativaId: row.alternativa_id,
  respostaTexto: row.resposta_texto,
});

/**
 * Repositório de respostas dos alunos durante a prova.
 *
 * Suporta salvamento incremental (upsert com ON CONFLICT) e rascunhos
 * parciais. O envio final é uma transação que identifica questões em
 * branco e marca a prova como enviada.
 */
export class RespostaAlunoRepository {
  /**
   * Busca contexto da prova-aluno com JOIN em prova para validação de janela.
   *
   * @param provaAlunoId - ID do vínculo prova-aluno.
   * @param client - Conexão opcional (para uso dentro de transação).
   * @returns Contexto da prova-aluno ou null.
   */
  async findProvaAlunoContext(provaAlunoId: string, client: PoolClient | typeof pool = pool): Promise<ProvaAlunoContext | null> {
    const result = await client.query<ProvaAlunoContextRow>(
      `
        SELECT
          pa."id",
          pa."prova_id",
          pa."status",
          p."status" AS "prova_status",
          p."data_inicio",
          p."data_fim",
          pa."inicio_em",
          p."tempo_limite_min"
        FROM "prova_aluno" pa
        JOIN "prova" p ON p."id" = pa."prova_id"
        WHERE pa."id" = $1
      `,
      [provaAlunoId],
    );

    return result.rows[0]
      ? {
          id: result.rows[0].id,
          provaId: result.rows[0].prova_id,
          status: result.rows[0].status,
          provaStatus: result.rows[0].prova_status,
          dataInicio: toIsoString(result.rows[0].data_inicio),
          dataFim: toIsoString(result.rows[0].data_fim),
          inicioEm: toIsoString(result.rows[0].inicio_em),
          tempoLimiteMin: result.rows[0].tempo_limite_min,
        }
      : null;
  }

  /**
   * Busca dados da questão vinculada à prova para validação.
   *
   * @param provaAlunoId - ID do vínculo prova-aluno.
   * @param questaoId - ID da questão.
   * @returns Dados da questão ou null.
   */
  async findQuestaoDaProva(provaAlunoId: string, questaoId: string): Promise<QuestaoResposta | null> {
    const result = await pool.query<QuestaoRespostaRow>(
      `
        SELECT q."id", q."tipo", q."limite_caracteres"
        FROM "prova_aluno" pa
        JOIN "prova_questao" pq ON pq."prova_id" = pa."prova_id"
        JOIN "questao" q ON q."id" = pq."questao_id"
        WHERE pa."id" = $1 AND q."id" = $2
      `,
      [provaAlunoId, questaoId],
    );

    return result.rows[0]
      ? {
          id: result.rows[0].id,
          tipo: result.rows[0].tipo,
          limiteCaracteres: result.rows[0].limite_caracteres,
        }
      : null;
  }

  /**
   * Verifica se uma alternativa pertence a uma questão.
   *
   * @param alternativaId - ID da alternativa.
   * @param questaoId - ID da questão.
   * @returns true se a alternativa pertencer à questão.
   */
  async alternativaBelongsToQuestao(alternativaId: string, questaoId: string) {
    const result = await pool.query(
      'SELECT EXISTS (SELECT 1 FROM "alternativa" WHERE "id" = $1 AND "questao_id" = $2) AS "exists"',
      [alternativaId, questaoId],
    );
    return result.rows[0]?.exists ?? false;
  }

  /**
   * Salva ou atualiza a resposta de um aluno (upsert).
   *
   * Usa ON CONFLICT na chave composta (prova_aluno_id, questao_id) para
   * permitir salvamentos incrementais (rascunho).
   *
   * @param provaAlunoId - ID do vínculo prova-aluno.
   * @param questaoId - ID da questão respondida.
   * @param input - Dados da resposta: alternativaId, respostaTexto e rascunho.
   * @returns Dados resumidos da resposta salva.
   */
  async upsert(provaAlunoId: string, questaoId: string, input: SalvarRespostaInput) {
    const result = await pool.query<RespostaRow>(
      `
        INSERT INTO "resposta_aluno" (
          "prova_aluno_id", "questao_id", "alternativa_id", "resposta_texto", "rascunho", "sincronizada_em"
        )
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        ON CONFLICT ("prova_aluno_id", "questao_id") DO UPDATE
        SET "alternativa_id" = EXCLUDED."alternativa_id",
            "resposta_texto" = EXCLUDED."resposta_texto",
            "rascunho" = EXCLUDED."rascunho",
            "sincronizada_em" = CURRENT_TIMESTAMP
        RETURNING *
      `,
      [provaAlunoId, questaoId, input.alternativaId ?? null, input.respostaTexto ?? null, input.rascunho],
    );

    return mapRespostaSalva(result.rows[0]);
  }

  /**
   * Lista todas as respostas de um aluno para uma prova.
   *
   * @param provaAlunoId - ID do vínculo prova-aluno.
   * @returns Lista de respostas do aluno.
   */
  async findByProvaAluno(provaAlunoId: string) {
    const result = await pool.query<RespostaRow>(
      `
        SELECT "id", "prova_aluno_id", "questao_id", "alternativa_id", "resposta_texto", "rascunho", "sincronizada_em"
        FROM "resposta_aluno"
        WHERE "prova_aluno_id" = $1
        ORDER BY "criado_em" ASC
      `,
      [provaAlunoId],
    );

    return result.rows.map(mapResposta);
  }

  /**
   * Identifica questões sem resposta (em branco) de um aluno.
   *
   * @param provaAlunoId - ID do vínculo prova-aluno.
   * @param client - Conexão opcional (para uso dentro de transação).
   * @returns Lista de IDs das questões em branco.
   */
  async findQuestoesEmBranco(provaAlunoId: string, client: PoolClient | typeof pool = pool) {
    const result = await client.query<{ questao_id: string }>(
      `
        SELECT pq."questao_id"
        FROM "prova_aluno" pa
        JOIN "prova_questao" pq ON pq."prova_id" = pa."prova_id"
        LEFT JOIN "resposta_aluno" ra
          ON ra."prova_aluno_id" = pa."id"
          AND ra."questao_id" = pq."questao_id"
        WHERE pa."id" = $1
          AND ra."id" IS NULL
        ORDER BY pq."ordem_original" ASC
      `,
      [provaAlunoId],
    );

    return result.rows.map((row) => row.questao_id);
  }

  /**
   * Finaliza o envio da prova pelo aluno em transação.
   *
   * Marca respostas como enviada_final=true, rascunho=false
   * e altera status da prova_aluno para 'enviada'.
   *
   * @param provaAlunoId - ID do vínculo prova-aluno a ser finalizado.
   * @returns Resumo do envio com status, timestamp e questões em branco.
   */
  async markAsSubmitted(provaAlunoId: string): Promise<EnvioFinal> {
    return withTransaction(async (client) => {
      const questoesEmBranco = await this.findQuestoesEmBranco(provaAlunoId, client);

      await client.query(
        'UPDATE "resposta_aluno" SET "rascunho" = FALSE, "enviada_final" = TRUE WHERE "prova_aluno_id" = $1',
        [provaAlunoId],
      );

      const result = await client.query<EnvioRow>(
        `
          UPDATE "prova_aluno"
          SET "status" = 'enviada'
          WHERE "id" = $1
          RETURNING "id", "status", "enviada_em"
        `,
        [provaAlunoId],
      );

      return {
        provaAlunoId: result.rows[0].id,
        status: result.rows[0].status,
        enviadaEm: toIsoString(result.rows[0].enviada_em) ?? "",
        questoesEmBranco,
      };
    });
  }
}
