ALTER TABLE "aluno"
  ADD COLUMN IF NOT EXISTS "cpf_hash" VARCHAR(64);

DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  FOR constraint_name IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'aluno'::regclass
      AND (
        contype = 'u'
        OR (contype = 'c' AND pg_get_constraintdef(oid) ILIKE '%cpf%')
      )
  LOOP
    EXECUTE format('ALTER TABLE "aluno" DROP CONSTRAINT %I', constraint_name);
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "aluno_cpf_hash_unique"
  ON "aluno" ("cpf_hash")
  WHERE "cpf_hash" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "idempotency_request" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" VARCHAR(255) NOT NULL,
  "method" VARCHAR(10) NOT NULL,
  "route" TEXT NOT NULL,
  "request_hash" VARCHAR(64) NOT NULL,
  "state" VARCHAR(20) NOT NULL DEFAULT 'processing'
    CHECK ("state" IN ('processing', 'completed')),
  "response_status" INTEGER,
  "response_body" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMPTZ NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
  UNIQUE ("key", "method", "route")
);

CREATE INDEX IF NOT EXISTS "idempotency_request_expires_at_index"
  ON "idempotency_request" ("expires_at");

ALTER TABLE "idempotency_request" ENABLE ROW LEVEL SECURITY;
