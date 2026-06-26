CREATE TABLE IF NOT EXISTS "turma" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "nome" TEXT NOT NULL,
  "descricao" TEXT NULL,
  "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "turma_nome_check" CHECK (char_length(btrim("nome")) > 0),
  CONSTRAINT "turma_nome_unique" UNIQUE ("nome")
);

INSERT INTO "turma" ("nome")
SELECT DISTINCT btrim("turma")
FROM "prova"
WHERE "turma" IS NOT NULL
  AND char_length(btrim("turma")) > 0
ON CONFLICT ("nome") DO NOTHING;

INSERT INTO "turma" ("nome")
SELECT DISTINCT btrim("turma")
FROM "aluno"
WHERE "turma" IS NOT NULL
  AND char_length(btrim("turma")) > 0
ON CONFLICT ("nome") DO NOTHING;
