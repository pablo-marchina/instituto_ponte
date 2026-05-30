import { pool } from "../database/pool.js";
import { toIsoString } from "../helpers/date.js";
import type { AuthUser } from "../middlewares/auth.js";
import type {
  CreateProvaInput,
  ListProvasQuery,
  UpdateProvaConfiguracoesInput,
  UpdateProvaInput,
} from "../schemas/prova.schema.js";

type ProvaRow = {
  id: string;
  professor_id: string;
  materia_id: string;
  titulo: string;
  modalidade: string;
  turma: string;
  semestre: string;
  instrucoes: string | null;
  tempo_limite_min: number | null;
  data_inicio: Date | string | null;
  data_fim: Date | string | null;
  embaralhar_questoes: boolean;
  embaralhar_alternativas: boolean;
  status: string;
  url_acesso: string | null;
  qr_code: string | null;
  criado_em: Date | string;
  atualizado_em: Date | string;
  materia_nome?: string;
  professor_nome?: string;
  total?: string;
};

const mapProva = (row: ProvaRow) => ({
  id: row.id,
  professorId: row.professor_id,
  materiaId: row.materia_id,
  titulo: row.titulo,
  modalidade: row.modalidade,
  turma: row.turma,
  semestre: row.semestre,
  instrucoes: row.instrucoes,
  tempoLimiteMin: row.tempo_limite_min,
  dataInicio: toIsoString(row.data_inicio),
  dataFim: toIsoString(row.data_fim),
  embaralharQuestoes: row.embaralhar_questoes,
  embaralharAlternativas: row.embaralhar_alternativas,
  status: row.status,
  urlAcesso: row.url_acesso,
  qrCode: row.qr_code,
  criadoEm: toIsoString(row.criado_em) ?? "",
  atualizadoEm: toIsoString(row.atualizado_em) ?? "",
  materia: row.materia_nome ? { id: row.materia_id, nome: row.materia_nome } : undefined,
  professor: row.professor_nome ? { id: row.professor_id, nome: row.professor_nome } : undefined,
});

export class ProvaRepository {
  async professorExists(professorId: string) {
    const result = await pool.query('SELECT EXISTS (SELECT 1 FROM "professor" WHERE "id" = $1) AS "exists"', [
      professorId,
    ]);
    return result.rows[0]?.exists ?? false;
  }

  async materiaExists(materiaId: string) {
    const result = await pool.query('SELECT EXISTS (SELECT 1 FROM "materia" WHERE "id" = $1) AS "exists"', [
      materiaId,
    ]);
    return result.rows[0]?.exists ?? false;
  }

  async professorMateriaVinculados(professorId: string, materiaId: string) {
    const result = await pool.query(
      `
        SELECT EXISTS (
          SELECT 1 FROM "materia_professor"
          WHERE "professor_id" = $1 AND "materia_id" = $2
        ) AS "exists"
      `,
      [professorId, materiaId],
    );
    return result.rows[0]?.exists ?? false;
  }

  async create(input: CreateProvaInput & { professorId: string }) {
    const result = await pool.query<ProvaRow>(
      `
        INSERT INTO "prova" (
          "professor_id", "materia_id", "titulo", "modalidade", "turma", "semestre",
          "instrucoes", "tempo_limite_min", "data_inicio", "data_fim",
          "embaralhar_questoes", "embaralhar_alternativas", "status"
        )
        VALUES ($1, $2, $3, COALESCE($4, 'online'), $5, $6, $7, $8, $9, $10, COALESCE($11, TRUE), COALESCE($12, TRUE), 'rascunho')
        RETURNING *
      `,
      [
        input.professorId,
        input.materiaId,
        input.titulo,
        input.modalidade,
        input.turma,
        input.semestre,
        input.instrucoes ?? null,
        input.tempoLimiteMin ?? null,
        input.dataInicio ?? null,
        input.dataFim ?? null,
        input.embaralharQuestoes ?? null,
        input.embaralharAlternativas ?? null,
      ],
    );

    return mapProva(result.rows[0]);
  }

  async findMany(query: ListProvasQuery, user: AuthUser) {
    const params: unknown[] = [];
    const where: string[] = [];

    const addParam = (value: unknown) => {
      params.push(value);
      return `$${params.length}`;
    };

    if (user.perfil === "professor") {
      const userParam = addParam(user.id);
      where.push(
        `(p."professor_id" = ${userParam} OR EXISTS (
          SELECT 1 FROM "materia_professor" mp
          WHERE mp."materia_id" = p."materia_id" AND mp."professor_id" = ${userParam}
        ))`,
      );
    }

    if (query.status) where.push(`p."status" = ${addParam(query.status)}`);
    if (query.turma) where.push(`p."turma" = ${addParam(query.turma)}`);
    if (query.semestre) where.push(`p."semestre" = ${addParam(query.semestre)}`);
    if (query.materiaId) where.push(`p."materia_id" = ${addParam(query.materiaId)}`);
    if (query.professorId) where.push(`p."professor_id" = ${addParam(query.professorId)}`);

    const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
    const limitParam = addParam(query.limit);
    const offsetParam = addParam((query.page - 1) * query.limit);

    const result = await pool.query<ProvaRow>(
      `
        SELECT p.*, m."nome" AS "materia_nome", pr."nome" AS "professor_nome",
          COUNT(*) OVER() AS "total"
        FROM "prova" p
        JOIN "materia" m ON m."id" = p."materia_id"
        JOIN "professor" pr ON pr."id" = p."professor_id"
        ${whereSql}
        ORDER BY p."criado_em" DESC
        LIMIT ${limitParam}
        OFFSET ${offsetParam}
      `,
      params,
    );

    return {
      data: result.rows.map(mapProva),
      total: Number(result.rows[0]?.total ?? 0),
    };
  }

  async findById(provaId: string) {
    const result = await pool.query<ProvaRow>(
      `
        SELECT p.*, m."nome" AS "materia_nome", pr."nome" AS "professor_nome"
        FROM "prova" p
        JOIN "materia" m ON m."id" = p."materia_id"
        JOIN "professor" pr ON pr."id" = p."professor_id"
        WHERE p."id" = $1
      `,
      [provaId],
    );

    return result.rows[0] ? mapProva(result.rows[0]) : null;
  }

  async hasAccess(provaId: string, user: AuthUser) {
    if (user.perfil === "coordenador") return true;

    const result = await pool.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM "prova" p
          WHERE p."id" = $1
            AND (
              p."professor_id" = $2
              OR EXISTS (
                SELECT 1 FROM "materia_professor" mp
                WHERE mp."materia_id" = p."materia_id" AND mp."professor_id" = $2
              )
            )
        ) AS "exists"
      `,
      [provaId, user.id],
    );
    return result.rows[0]?.exists ?? false;
  }

  async update(provaId: string, input: UpdateProvaInput) {
    const fields: string[] = [];
    const values: unknown[] = [];
    const columns: Record<string, string> = {
      titulo: "titulo",
      modalidade: "modalidade",
      turma: "turma",
      semestre: "semestre",
      instrucoes: "instrucoes",
      tempoLimiteMin: "tempo_limite_min",
      dataInicio: "data_inicio",
      dataFim: "data_fim",
      embaralharQuestoes: "embaralhar_questoes",
      embaralharAlternativas: "embaralhar_alternativas",
    };

    for (const [key, column] of Object.entries(columns)) {
      if (key in input) {
        values.push(input[key as keyof UpdateProvaInput] ?? null);
        fields.push(`"${column}" = $${values.length}`);
      }
    }

    values.push(provaId);
    const result = await pool.query<ProvaRow>(
      `
        UPDATE "prova"
        SET ${fields.join(", ")}
        WHERE "id" = $${values.length}
        RETURNING *
      `,
      values,
    );

    return result.rows[0] ? mapProva(result.rows[0]) : null;
  }

  async updateConfiguracoes(provaId: string, input: UpdateProvaConfiguracoesInput) {
    const fields: string[] = [];
    const values: unknown[] = [];
    const columns: Record<string, string> = {
      tempoLimiteMin: "tempo_limite_min",
      dataInicio: "data_inicio",
      dataFim: "data_fim",
      embaralharQuestoes: "embaralhar_questoes",
      embaralharAlternativas: "embaralhar_alternativas",
    };

    for (const [key, column] of Object.entries(columns)) {
      if (key in input) {
        values.push(input[key as keyof UpdateProvaConfiguracoesInput] ?? null);
        fields.push(`"${column}" = $${values.length}`);
      }
    }

    values.push(provaId);
    const result = await pool.query<ProvaRow>(
      `
        UPDATE "prova"
        SET ${fields.join(", ")}
        WHERE "id" = $${values.length}
        RETURNING *
      `,
      values,
    );

    return result.rows[0] ? mapProva(result.rows[0]) : null;
  }

  async countQuestoes(provaId: string) {
    const result = await pool.query<{ total: string }>(
      'SELECT COUNT(*) AS "total" FROM "prova_questao" WHERE "prova_id" = $1',
      [provaId],
    );
    return Number(result.rows[0]?.total ?? 0);
  }

  async hasQuestoesObjetivasInvalidas(provaId: string) {
    const result = await pool.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM "prova_questao" pq
          JOIN "questao" q ON q."id" = pq."questao_id"
          WHERE pq."prova_id" = $1
            AND (
              (
                q."tipo" = 'multipla_escolha'
                AND (
                  (SELECT COUNT(*) FROM "alternativa" a WHERE a."questao_id" = q."id") < 2
                  OR (SELECT COUNT(*) FROM "alternativa" a WHERE a."questao_id" = q."id" AND a."correta" = TRUE) <> 1
                )
              )
              OR
              (
                q."tipo" = 'verdadeiro_falso'
                AND (
                  (SELECT COUNT(*) FROM "alternativa" a WHERE a."questao_id" = q."id") <> 2
                  OR (SELECT COUNT(*) FROM "alternativa" a WHERE a."questao_id" = q."id" AND a."correta" = TRUE) <> 1
                )
              )
            )
        ) AS "exists"
      `,
      [provaId],
    );
    return result.rows[0]?.exists ?? false;
  }

  async publish(provaId: string, urlAcesso: string) {
    const result = await pool.query<ProvaRow>(
      `
        UPDATE "prova"
        SET "url_acesso" = $1,
            "status" = 'publicada'
        WHERE "id" = $2
        RETURNING *
      `,
      [urlAcesso, provaId],
    );
    return result.rows[0] ? mapProva(result.rows[0]) : null;
  }

  async updateStatus(provaId: string, status: "encerrada" | "antiga") {
    const result = await pool.query<ProvaRow>(
      `
        UPDATE "prova"
        SET "status" = $1
        WHERE "id" = $2
        RETURNING *
      `,
      [status, provaId],
    );
    return result.rows[0] ? mapProva(result.rows[0]) : null;
  }

  async delete(provaId: string) {
    await pool.query('DELETE FROM "prova" WHERE "id" = $1', [provaId]);
  }

  async hasSubmissions(provaId: string) {
    const result = await pool.query(
      'SELECT EXISTS (SELECT 1 FROM "prova_aluno" WHERE "prova_id" = $1) AS "exists"',
      [provaId],
    );
    return result.rows[0]?.exists ?? false;
  }

  async findStatusHistorico(provaId: string) {
    const result = await pool.query<{
      id: string;
      status_anterior: string | null;
      status_novo: string;
      criado_em: Date | string;
    }>(
      `
        SELECT "id", "status_anterior", "status_novo", "criado_em"
        FROM "prova_status_historico"
        WHERE "prova_id" = $1
        ORDER BY "criado_em" ASC
      `,
      [provaId],
    );

    return result.rows.map((row) => ({
      id: row.id,
      statusAnterior: row.status_anterior,
      statusNovo: row.status_novo,
      criadoEm: toIsoString(row.criado_em) ?? "",
    }));
  }
}
