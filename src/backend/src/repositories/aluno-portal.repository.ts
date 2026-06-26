import type { PoolClient } from "pg";
import { pool } from "../database/pool.js";
import { withTransaction } from "../database/transaction.js";
import { toIsoString } from "../helpers/date.js";
import type { IniciarProvaInput } from "../schemas/aluno-portal.schema.js";
import { encryptCpf, hashCpf } from "../security/cpf-crypto.js";

/** Linha pública da tabela `prova` para exibição ao aluno. */
type ProvaPublicaRow = {
  id: string;
  titulo: string;
  instrucoes: string | null;
  tempo_limite_min: number | null;
  data_inicio: Date | string | null;
  data_fim: Date | string | null;
  embaralhar_questoes: boolean;
  embaralhar_alternativas: boolean;
  status: string;
};

/** Linha da tabela `prova_aluno` para controle de status. */
type ProvaAlunoRow = {
  id: string;
  status: "nao_iniciada" | "em_andamento" | "enviada" | "corrigida";
  inicio_em: Date | string | null;
};

/** Alternativa pública (sem campo correta) exibida ao aluno. */
type AlternativaPublica = {
  id: string;
  ordem: number;
  conteudoLatex: string;
  urlImagem: string | null;
};

/** Linha de questão pública com enunciado e alternativas (sem campo correta). */
type QuestaoPublicaRow = {
  id: string;
  ordem: number;
  tipo: "multipla_escolha" | "verdadeiro_falso" | "discursiva";
  permite_anexo: boolean | null;
  enunciado_conteudo_latex: string;
  enunciado_url_imagem: string | null;
  alternativas: AlternativaPublica[] | null;
};

/** Normaliza a URL de acesso extraindo URL original e slug (último segmento).
 *  Permite acesso via URL completa ou código curto. */
const normalizeUrlAcesso = (urlAcesso: string) => {
  const decoded = decodeURIComponent(urlAcesso.trim());
  const slug = decoded.split("/").filter(Boolean).at(-1) ?? decoded;
  return { original: decoded, slug };
};

/** Converte uma ProvaPublicaRow para o formato público da prova (camelCase).
 *  Datas são convertidas com toIsoString(). */
const mapProvaPublica = (row: ProvaPublicaRow) => ({
  id: row.id,
  titulo: row.titulo,
  instrucoes: row.instrucoes,
  tempoLimiteMin: row.tempo_limite_min,
  dataInicio: toIsoString(row.data_inicio),
  dataFim: toIsoString(row.data_fim),
  embaralharQuestoes: row.embaralhar_questoes,
  embaralharAlternativas: row.embaralhar_alternativas,
  status: row.status,
});

/** Converte uma QuestaoPublicaRow para o formato público da questão (camelCase).
 *  Alternativas são exibidas sem o campo correta. */
const mapQuestaoPublica = (row: QuestaoPublicaRow) => ({
  id: row.id,
  ordem: row.ordem,
  tipo: row.tipo,
  permiteAnexo: row.permite_anexo === true,
  enunciado: {
    conteudoLatex: row.enunciado_conteudo_latex,
    urlImagem: row.enunciado_url_imagem,
  },
  alternativas: row.alternativas ?? [],
});

const hashString = (value: string) => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const shuffleDeterministic = <T>(items: T[], seed: string, getKey: (item: T) => string) =>
  [...items].sort((a, b) => {
    const hashA = hashString(`${seed}:${getKey(a)}`);
    const hashB = hashString(`${seed}:${getKey(b)}`);
    return hashA - hashB;
  });

function applyShuffle(
  questoes: ReturnType<typeof mapQuestaoPublica>[],
  seed: string,
  options: { embaralharQuestoes: boolean; embaralharAlternativas: boolean },
) {
  const orderedQuestions = options.embaralharQuestoes
    ? shuffleDeterministic(questoes, `${seed}:questoes`, (questao) => questao.id)
    : questoes;

  return orderedQuestions.map((questao, questionIndex) => {
    const alternativas = options.embaralharAlternativas
      ? shuffleDeterministic(questao.alternativas, `${seed}:${questao.id}:alternativas`, (alternativa) => alternativa.id)
      : questao.alternativas;

    return {
      ...questao,
      ordem: questionIndex + 1,
      alternativas: alternativas.map((alternativa, alternativaIndex) => ({
        ...alternativa,
        ordem: alternativaIndex + 1,
      })),
    };
  });
}

/**
 * Repositório de acesso público do aluno ao portal de provas.
 *
 * Localiza prova por URL (normalizando slug), faz upsert do aluno
 * por email, retoma sessão anterior ou bloqueia se já enviada.
 * Registra log de auditoria ao iniciar nova prova.
 */
export class AlunoPortalRepository {
  /**
   * Busca prova pública por URL de acesso normalizada.
   *
   * @param urlAcesso - URL ou slug de acesso à prova.
   * @returns Dados públicos da prova ou null.
   */
  async findPublicByUrl(urlAcesso: string) {
    const normalized = normalizeUrlAcesso(urlAcesso);
    const result = await pool.query<ProvaPublicaRow>(
      `
        SELECT "id", "titulo", "instrucoes", "tempo_limite_min", "data_inicio", "data_fim",
               "embaralhar_questoes", "embaralhar_alternativas", "status"
        FROM "prova"
        WHERE "url_acesso" = $1
          OR "url_acesso" = $2
          OR regexp_replace("url_acesso", '^.*/', '') = $2
      `,
      [normalized.original, normalized.slug],
    );

    return result.rows[0] ? mapProvaPublica(result.rows[0]) : null;
  }

  /**
   * Busca questões públicas de uma prova (sem campo correta nas alternativas).
   *
   * @param provaId - ID da prova.
   * @param client - Conexão opcional (para uso dentro de transação).
   * @returns Lista de questões públicas.
   */
  async findQuestoesPublicas(
    provaId: string,
    options: { provaAlunoId: string; embaralharQuestoes: boolean; embaralharAlternativas: boolean },
    client: PoolClient | typeof pool = pool,
  ) {
    const result = await client.query<QuestaoPublicaRow>(
      `
        SELECT
          q."id",
          pq."ordem_original" AS "ordem",
          q."tipo",
          q."permite_anexo",
          e."conteudo_latex" AS "enunciado_conteudo_latex",
          e."url_imagem" AS "enunciado_url_imagem",
          COALESCE(
            json_agg(
              json_build_object(
                'id', a."id",
                'ordem', a."ordem_original",
                'conteudoLatex', a."conteudo_latex",
                'urlImagem', a."url_imagem"
              )
              ORDER BY a."ordem_original"
            ) FILTER (WHERE a."id" IS NOT NULL),
            '[]'::json
          ) AS "alternativas"
        FROM "prova_questao" pq
        JOIN "questao" q ON q."id" = pq."questao_id"
        JOIN "enunciado" e ON e."questao_id" = q."id"
        LEFT JOIN "alternativa" a ON a."questao_id" = q."id"
        WHERE pq."prova_id" = $1
        GROUP BY q."id", pq."ordem_original", q."permite_anexo", e."conteudo_latex", e."url_imagem"
        ORDER BY pq."ordem_original" ASC
      `,
      [provaId],
    );

    return applyShuffle(result.rows.map(mapQuestaoPublica), options.provaAlunoId, options);
  }

  /**
   * Inicia uma prova para o aluno: faz upsert do aluno, cria prova_aluno
   * e registra log de auditoria. Retoma sessão anterior se existir.
   *
   * @param provaId - ID da prova.
   * @param input - Dados do aluno: nome, email, cpf.
   * @returns Dados da prova-aluno e flag finalizada.
   */
  async iniciarProva(provaId: string, input: IniciarProvaInput) {
    return withTransaction(async (client) => {
      const alunoId = await this.upsertAluno(client, input);
      const provaAluno = await this.findProvaAluno(client, provaId, alunoId);

      if (provaAluno?.status === "enviada" || provaAluno?.status === "corrigida") {
        return {
          provaAluno,
          finalizada: true,
        };
      }

      if (provaAluno?.status === "em_andamento") {
        return {
          provaAluno,
          finalizada: false,
        };
      }

      const created = await client.query<ProvaAlunoRow>(
        `
          INSERT INTO "prova_aluno" ("prova_id", "aluno_id", "status")
          VALUES ($1, $2, 'em_andamento')
          RETURNING "id", "status", "inicio_em"
        `,
        [provaId, alunoId],
      );

      await client.query(
        `
          INSERT INTO "avaliacao_log" ("prova_id", "prova_aluno_id", "ator_tipo", "ator_id", "acao", "detalhes")
          VALUES ($1, $2, 'aluno', $3, 'prova_iniciada', $4::jsonb)
        `,
        [provaId, created.rows[0].id, alunoId, JSON.stringify({ email: input.email })],
      );

      return {
        provaAluno: created.rows[0],
        finalizada: false,
      };
    });
  }

  private async upsertAluno(client: PoolClient, input: IniciarProvaInput) {
    const encryptedCpf = encryptCpf(input.cpf);
    const cpfHash = hashCpf(input.cpf);
    const existingByEmail = await client.query<{ id: string }>(
      'SELECT "id" FROM "aluno" WHERE lower("email") = lower($1) LIMIT 1',
      [input.email],
    );
    const existingByCpf = await client.query<{ id: string }>(
      'SELECT "id" FROM "aluno" WHERE "cpf_hash" = $1 LIMIT 1',
      [cpfHash],
    );

    if (existingByEmail.rows[0]) {
      const sameCpfOwner = !existingByCpf.rows[0] || existingByCpf.rows[0].id === existingByEmail.rows[0].id;
      const updated = await client.query<{ id: string }>(
        `
          UPDATE "aluno"
          SET "nome" = $1,
              "cpf" = CASE WHEN $2::boolean THEN $3 ELSE "cpf" END,
              "cpf_hash" = CASE WHEN $2::boolean THEN $4 ELSE "cpf_hash" END,
              "aceitou_termos_em" = CURRENT_TIMESTAMP,
              "atualizado_em" = CURRENT_TIMESTAMP
          WHERE "id" = $5
          RETURNING "id"
        `,
        [input.nome, sameCpfOwner, encryptedCpf, cpfHash, existingByEmail.rows[0].id],
      );
      return updated.rows[0].id;
    }

    if (existingByCpf.rows[0]) {
      const updated = await client.query<{ id: string }>(
        `
          UPDATE "aluno"
          SET "nome" = $1,
              "email" = $2,
              "cpf" = $3,
              "cpf_hash" = $4,
              "aceitou_termos_em" = CURRENT_TIMESTAMP,
              "atualizado_em" = CURRENT_TIMESTAMP
          WHERE "id" = $5
          RETURNING "id"
        `,
        [input.nome, input.email, encryptedCpf, cpfHash, existingByCpf.rows[0].id],
      );
      return updated.rows[0].id;
    }

    const result = await client.query<{ id: string }>(
      `
        INSERT INTO "aluno" ("nome", "email", "cpf", "cpf_hash", "aceitou_termos_em")
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        ON CONFLICT ("email") DO UPDATE
        SET "nome" = EXCLUDED."nome",
            "cpf" = COALESCE(EXCLUDED."cpf", "aluno"."cpf"),
            "cpf_hash" = COALESCE(EXCLUDED."cpf_hash", "aluno"."cpf_hash"),
            "aceitou_termos_em" = CURRENT_TIMESTAMP
        RETURNING "id"
      `,
      [input.nome, input.email, encryptedCpf, cpfHash],
    );

    return result.rows[0].id;
  }

  private async findProvaAluno(client: PoolClient, provaId: string, alunoId: string) {
    const result = await client.query<ProvaAlunoRow>(
      'SELECT "id", "status", "inicio_em" FROM "prova_aluno" WHERE "prova_id" = $1 AND "aluno_id" = $2',
      [provaId, alunoId],
    );
    return result.rows[0] ?? null;
  }
}
