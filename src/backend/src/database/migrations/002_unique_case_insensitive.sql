-- Migration 002: Unique case-insensitive indexes for materia and tema
-- Prevents duplicate names that differ only by case

CREATE UNIQUE INDEX IF NOT EXISTS "materia_nome_lower_unique"
    ON "materia" (LOWER("nome"));

CREATE UNIQUE INDEX IF NOT EXISTS "tema_materia_nome_lower_unique"
    ON "tema" ("materia_id", LOWER("nome"));
