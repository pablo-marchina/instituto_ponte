CREATE UNIQUE INDEX IF NOT EXISTS "aluno_email_unique"
  ON "aluno" ("email");

CREATE UNIQUE INDEX IF NOT EXISTS "aluno_auth_user_id_unique"
  ON "aluno" ("auth_user_id")
  WHERE "auth_user_id" IS NOT NULL;
