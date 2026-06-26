ALTER TABLE "aluno"
  ADD COLUMN IF NOT EXISTS "turma" TEXT NULL;

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
