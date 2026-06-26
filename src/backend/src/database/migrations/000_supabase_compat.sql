CREATE SCHEMA IF NOT EXISTS "auth";

CREATE TABLE IF NOT EXISTS "auth"."users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT UNIQUE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF to_regprocedure('auth.uid()') IS NULL THEN
    EXECUTE $function$
      CREATE FUNCTION "auth"."uid"()
      RETURNS UUID
      LANGUAGE sql
      STABLE
      AS $body$
        SELECT NULLIF(current_setting('request.jwt.claim.sub', TRUE), '')::UUID
      $body$
    $function$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE "anon" NOLOGIN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE "authenticated" NOLOGIN;
  END IF;
END $$;

GRANT USAGE ON SCHEMA "auth" TO "anon", "authenticated";
GRANT SELECT ON "auth"."users" TO "anon", "authenticated";
