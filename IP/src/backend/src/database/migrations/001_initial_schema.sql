-- Migration inicial alinhada ao WAD, regras de negocio e casos de uso (UC01 a UC16)
-- Supabase/PostgreSQL com RLS, enums, normalizacao, validacoes de publicacao,
-- fluxo do aluno sem senha por link unico, anexos, autosave, correcao, resultados,
-- envio de e-mail, exportacao e analytics.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- =========================================================
-- Tipos ENUM
-- =========================================================

DO $$
BEGIN
    CREATE TYPE "prova_status" AS ENUM ('rascunho', 'publicada', 'encerrada', 'antiga');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "prova_aluno_status" AS ENUM ('nao_iniciada', 'em_andamento', 'enviada', 'corrigida');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "questao_tipo" AS ENUM ('multipla_escolha', 'verdadeiro_falso', 'discursiva');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "correcao_tipo" AS ENUM ('manual', 'automatica');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "relatorio_tipo" AS ENUM ('desempenho_geral', 'por_aluno', 'por_questao', 'por_materia');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "email_status" AS ENUM ('pendente', 'enviado', 'erro');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =========================================================
-- Funcoes utilitarias
-- =========================================================

CREATE OR REPLACE FUNCTION "set_atualizado_em"()
RETURNS TRIGGER AS $$
BEGIN
    NEW."atualizado_em" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- Tabelas base
-- =========================================================

CREATE TABLE "coordenador" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "auth_user_id" UUID NULL UNIQUE REFERENCES auth.users ("id") ON DELETE SET NULL,
    "nome" TEXT NOT NULL,
    "email" CITEXT NOT NULL,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coordenador_nome_check"
        CHECK (char_length(btrim("nome")) > 0),
    CONSTRAINT "coordenador_email_unique"
        UNIQUE ("email")
);

CREATE TABLE "professor" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "auth_user_id" UUID NULL UNIQUE REFERENCES auth.users ("id") ON DELETE SET NULL,
    "coordenador_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "email" CITEXT NOT NULL,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "professor_nome_check"
        CHECK (char_length(btrim("nome")) > 0),
    CONSTRAINT "professor_email_unique"
        UNIQUE ("email"),
    CONSTRAINT "professor_coordenador_id_foreign"
        FOREIGN KEY ("coordenador_id")
        REFERENCES "coordenador" ("id")
        ON DELETE RESTRICT
);

CREATE INDEX "professor_coordenador_id_index"
    ON "professor" ("coordenador_id");

CREATE TABLE "materia" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "nome" TEXT NOT NULL,
    "codigo" TEXT NULL,
    "descricao" TEXT NULL,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "materia_nome_check"
        CHECK (char_length(btrim("nome")) > 0),
    CONSTRAINT "materia_codigo_check"
        CHECK ("codigo" IS NULL OR char_length(btrim("codigo")) > 0),
    CONSTRAINT "materia_nome_unique"
        UNIQUE ("nome"),
    CONSTRAINT "materia_codigo_unique"
        UNIQUE ("codigo")
);

CREATE TABLE "materia_professor" (
    "materia_id" UUID NOT NULL,
    "professor_id" UUID NOT NULL,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("materia_id", "professor_id"),

    CONSTRAINT "materia_professor_materia_id_foreign"
        FOREIGN KEY ("materia_id")
        REFERENCES "materia" ("id")
        ON DELETE CASCADE,

    CONSTRAINT "materia_professor_professor_id_foreign"
        FOREIGN KEY ("professor_id")
        REFERENCES "professor" ("id")
        ON DELETE CASCADE
);

CREATE INDEX "materia_professor_professor_id_index"
    ON "materia_professor" ("professor_id");

CREATE TABLE "aluno" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "auth_user_id" UUID NULL UNIQUE REFERENCES auth.users ("id") ON DELETE SET NULL,
    "nome" TEXT NOT NULL,
    "email" CITEXT NOT NULL,
    "cpf" TEXT NULL,
    "aceitou_termos_em" TIMESTAMPTZ NULL,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aluno_nome_check"
        CHECK (char_length(btrim("nome")) > 0),
    CONSTRAINT "aluno_email_unique"
        UNIQUE ("email"),
    CONSTRAINT "aluno_cpf_unique"
        UNIQUE ("cpf"),
    CONSTRAINT "aluno_cpf_formato_check"
        CHECK ("cpf" IS NULL OR "cpf" ~ '^[0-9]{11}$')
);

CREATE TABLE "tema" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "materia_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NULL,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tema_nome_check"
        CHECK (char_length(btrim("nome")) > 0),
    CONSTRAINT "tema_materia_nome_unique"
        UNIQUE ("materia_id", "nome"),
    CONSTRAINT "tema_materia_id_foreign"
        FOREIGN KEY ("materia_id")
        REFERENCES "materia" ("id")
        ON DELETE CASCADE
);

CREATE INDEX "tema_materia_id_index"
    ON "tema" ("materia_id");

-- =========================================================
-- Banco de questoes normalizado
-- =========================================================

CREATE TABLE "questao" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "materia_id" UUID NOT NULL,
    "tema_id" UUID NULL,
    "tipo" "questao_tipo" NOT NULL,
    "limite_caracteres" INTEGER NULL,
    "limite_palavras" INTEGER NULL,
    "permite_anexo" BOOLEAN NOT NULL DEFAULT FALSE,
    "pontuacao_padrao" NUMERIC(5, 2) NOT NULL DEFAULT 1,
    "ativa" BOOLEAN NOT NULL DEFAULT TRUE,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questao_pontuacao_padrao_check"
        CHECK ("pontuacao_padrao" > 0),
    CONSTRAINT "questao_limite_caracteres_check"
        CHECK ("limite_caracteres" IS NULL OR "limite_caracteres" > 0),
    CONSTRAINT "questao_limite_palavras_check"
        CHECK ("limite_palavras" IS NULL OR "limite_palavras" > 0),
    CONSTRAINT "questao_discursiva_limites_check"
        CHECK (
            "tipo" = 'discursiva'
            OR ("limite_caracteres" IS NULL AND "limite_palavras" IS NULL AND "permite_anexo" = FALSE)
        ),
    CONSTRAINT "questao_materia_id_foreign"
        FOREIGN KEY ("materia_id")
        REFERENCES "materia" ("id")
        ON DELETE RESTRICT,
    CONSTRAINT "questao_tema_id_foreign"
        FOREIGN KEY ("tema_id")
        REFERENCES "tema" ("id")
        ON DELETE SET NULL
);

CREATE INDEX "questao_materia_id_index"
    ON "questao" ("materia_id");

CREATE INDEX "questao_tema_id_index"
    ON "questao" ("tema_id");

CREATE INDEX "questao_tipo_index"
    ON "questao" ("tipo");

CREATE TABLE "enunciado" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "questao_id" UUID NOT NULL,
    "conteudo_latex" TEXT NOT NULL,
    "url_imagem" TEXT NULL,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enunciado_conteudo_latex_check"
        CHECK (char_length(btrim("conteudo_latex")) > 0),
    CONSTRAINT "enunciado_questao_id_unique"
        UNIQUE ("questao_id"),
    CONSTRAINT "enunciado_questao_id_foreign"
        FOREIGN KEY ("questao_id")
        REFERENCES "questao" ("id")
        ON DELETE CASCADE
);

CREATE TABLE "alternativa" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "questao_id" UUID NOT NULL,
    "ordem_original" INTEGER NOT NULL,
    "conteudo_latex" TEXT NOT NULL,
    "url_imagem" TEXT NULL,
    "correta" BOOLEAN NOT NULL DEFAULT FALSE,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alternativa_ordem_original_check"
        CHECK ("ordem_original" > 0),
    CONSTRAINT "alternativa_conteudo_latex_check"
        CHECK (char_length(btrim("conteudo_latex")) > 0),
    CONSTRAINT "alternativa_questao_id_ordem_original_unique"
        UNIQUE ("questao_id", "ordem_original"),
    CONSTRAINT "alternativa_questao_id_foreign"
        FOREIGN KEY ("questao_id")
        REFERENCES "questao" ("id")
        ON DELETE CASCADE
);

CREATE INDEX "alternativa_questao_id_index"
    ON "alternativa" ("questao_id");

CREATE UNIQUE INDEX "alternativa_uma_correta_por_questao_index"
    ON "alternativa" ("questao_id")
    WHERE "correta" = TRUE;

-- =========================================================
-- Provas, questoes da prova e aplicacoes para alunos
-- =========================================================

CREATE TABLE "prova" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "professor_id" UUID NOT NULL,
    "materia_id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "modalidade" TEXT NOT NULL DEFAULT 'online',
    "turma" TEXT NOT NULL,
    "semestre" TEXT NOT NULL,
    "instrucoes" TEXT NULL,
    "tempo_limite_min" INTEGER NULL,
    "data_inicio" TIMESTAMPTZ NULL,
    "data_fim" TIMESTAMPTZ NULL,
    "embaralhar_questoes" BOOLEAN NOT NULL DEFAULT TRUE,
    "embaralhar_alternativas" BOOLEAN NOT NULL DEFAULT TRUE,
    "status" "prova_status" NOT NULL DEFAULT 'rascunho',
    "url_acesso" TEXT NULL,
    "qr_code" TEXT NULL,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prova_titulo_check"
        CHECK (char_length(btrim("titulo")) > 0),
    CONSTRAINT "prova_modalidade_check"
        CHECK (char_length(btrim("modalidade")) > 0),
    CONSTRAINT "prova_turma_check"
        CHECK (char_length(btrim("turma")) > 0),
    CONSTRAINT "prova_semestre_check"
        CHECK (char_length(btrim("semestre")) > 0),
    CONSTRAINT "prova_tempo_limite_check"
        CHECK ("tempo_limite_min" IS NULL OR "tempo_limite_min" > 0),
    CONSTRAINT "prova_datas_check"
        CHECK (
            "data_inicio" IS NULL
            OR "data_fim" IS NULL
            OR "data_fim" > "data_inicio"
        ),
    CONSTRAINT "prova_publicada_campos_obrigatorios_check"
        CHECK (
            "status" <> 'publicada'
            OR (
                "data_inicio" IS NOT NULL
                AND "data_fim" IS NOT NULL
                AND "url_acesso" IS NOT NULL
                AND char_length(btrim("url_acesso")) > 0
            )
        ),
    CONSTRAINT "prova_url_acesso_unique"
        UNIQUE ("url_acesso"),
    CONSTRAINT "prova_professor_id_foreign"
        FOREIGN KEY ("professor_id")
        REFERENCES "professor" ("id")
        ON DELETE RESTRICT,
    CONSTRAINT "prova_materia_id_foreign"
        FOREIGN KEY ("materia_id")
        REFERENCES "materia" ("id")
        ON DELETE RESTRICT
);

CREATE INDEX "prova_professor_id_index"
    ON "prova" ("professor_id");

CREATE INDEX "prova_materia_id_index"
    ON "prova" ("materia_id");

CREATE INDEX "prova_status_index"
    ON "prova" ("status");

CREATE INDEX "prova_filtros_index"
    ON "prova" ("status", "turma", "semestre", "materia_id", "professor_id");

CREATE TABLE "prova_status_historico" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "prova_id" UUID NOT NULL,
    "status_anterior" "prova_status" NULL,
    "status_novo" "prova_status" NOT NULL,
    "alterado_por_auth_user_id" UUID NULL REFERENCES auth.users ("id") ON DELETE SET NULL,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prova_status_historico_prova_id_foreign"
        FOREIGN KEY ("prova_id")
        REFERENCES "prova" ("id")
        ON DELETE CASCADE
);

CREATE INDEX "prova_status_historico_prova_id_index"
    ON "prova_status_historico" ("prova_id");

CREATE TABLE "prova_questao" (
    "prova_id" UUID NOT NULL,
    "questao_id" UUID NOT NULL,
    "ordem_original" INTEGER NOT NULL,
    "pontuacao_max" NUMERIC(5, 2) NOT NULL DEFAULT 1,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("prova_id", "questao_id"),

    CONSTRAINT "prova_questao_ordem_original_check"
        CHECK ("ordem_original" > 0),
    CONSTRAINT "prova_questao_pontuacao_max_check"
        CHECK ("pontuacao_max" > 0),
    CONSTRAINT "prova_questao_prova_ordem_unique"
        UNIQUE ("prova_id", "ordem_original"),
    CONSTRAINT "prova_questao_prova_id_foreign"
        FOREIGN KEY ("prova_id")
        REFERENCES "prova" ("id")
        ON DELETE CASCADE,
    CONSTRAINT "prova_questao_questao_id_foreign"
        FOREIGN KEY ("questao_id")
        REFERENCES "questao" ("id")
        ON DELETE RESTRICT
);

CREATE INDEX "prova_questao_questao_id_index"
    ON "prova_questao" ("questao_id");

CREATE TABLE "prova_aluno" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "prova_id" UUID NOT NULL,
    "aluno_id" UUID NOT NULL,
    "status" "prova_aluno_status" NOT NULL DEFAULT 'nao_iniciada',
    "inicio_em" TIMESTAMPTZ NULL,
    "enviada_em" TIMESTAMPTZ NULL,
    "ordem_questoes" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "ordem_alternativas" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prova_aluno_datas_check"
        CHECK (
            "inicio_em" IS NULL
            OR "enviada_em" IS NULL
            OR "enviada_em" >= "inicio_em"
        ),
    CONSTRAINT "prova_aluno_unique"
        UNIQUE ("prova_id", "aluno_id"),
    CONSTRAINT "prova_aluno_prova_id_foreign"
        FOREIGN KEY ("prova_id")
        REFERENCES "prova" ("id")
        ON DELETE CASCADE,
    CONSTRAINT "prova_aluno_aluno_id_foreign"
        FOREIGN KEY ("aluno_id")
        REFERENCES "aluno" ("id")
        ON DELETE CASCADE
);

CREATE INDEX "prova_aluno_prova_id_index"
    ON "prova_aluno" ("prova_id");

CREATE INDEX "prova_aluno_aluno_id_index"
    ON "prova_aluno" ("aluno_id");

CREATE INDEX "prova_aluno_status_index"
    ON "prova_aluno" ("status");

CREATE TABLE "resposta_aluno" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "prova_aluno_id" UUID NOT NULL,
    "questao_id" UUID NOT NULL,
    "alternativa_id" UUID NULL,
    "resposta_texto" TEXT NULL,
    "url_imagem" TEXT NULL,
    "rascunho" BOOLEAN NOT NULL DEFAULT TRUE,
    "sincronizada_em" TIMESTAMPTZ NULL,
    "enviada_final" BOOLEAN NOT NULL DEFAULT FALSE,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resposta_aluno_unique"
        UNIQUE ("prova_aluno_id", "questao_id"),
    CONSTRAINT "resposta_aluno_conteudo_check"
        CHECK (
            "alternativa_id" IS NOT NULL
            OR "resposta_texto" IS NOT NULL
            OR "url_imagem" IS NOT NULL
        ),
    CONSTRAINT "resposta_aluno_prova_aluno_id_foreign"
        FOREIGN KEY ("prova_aluno_id")
        REFERENCES "prova_aluno" ("id")
        ON DELETE CASCADE,
    CONSTRAINT "resposta_aluno_questao_id_foreign"
        FOREIGN KEY ("questao_id")
        REFERENCES "questao" ("id")
        ON DELETE RESTRICT,
    CONSTRAINT "resposta_aluno_alternativa_id_foreign"
        FOREIGN KEY ("alternativa_id")
        REFERENCES "alternativa" ("id")
        ON DELETE RESTRICT
);

CREATE INDEX "resposta_aluno_prova_aluno_id_index"
    ON "resposta_aluno" ("prova_aluno_id");

CREATE INDEX "resposta_aluno_questao_id_index"
    ON "resposta_aluno" ("questao_id");

CREATE TABLE "resposta_anexo" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "resposta_id" UUID NOT NULL,
    "url_arquivo" TEXT NOT NULL,
    "nome_arquivo" TEXT NULL,
    "mime_type" TEXT NOT NULL,
    "tamanho_bytes" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resposta_anexo_url_check"
        CHECK (char_length(btrim("url_arquivo")) > 0),
    CONSTRAINT "resposta_anexo_mime_type_check"
        CHECK ("mime_type" IN ('image/jpeg', 'image/png', 'application/pdf')),
    CONSTRAINT "resposta_anexo_tamanho_check"
        CHECK ("tamanho_bytes" > 0 AND "tamanho_bytes" <= 5242880),
    CONSTRAINT "resposta_anexo_resposta_id_foreign"
        FOREIGN KEY ("resposta_id")
        REFERENCES "resposta_aluno" ("id")
        ON DELETE CASCADE
);

CREATE INDEX "resposta_anexo_resposta_id_index"
    ON "resposta_anexo" ("resposta_id");

CREATE TABLE "correcao" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "resposta_id" UUID NOT NULL,
    "professor_id" UUID NOT NULL,
    "nota" NUMERIC(5, 2) NOT NULL,
    "observacao" TEXT NULL,
    "tipo" "correcao_tipo" NOT NULL DEFAULT 'manual',
    "corrigida_em" TIMESTAMPTZ NULL,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "correcao_nota_check"
        CHECK ("nota" >= 0),
    CONSTRAINT "correcao_resposta_id_unique"
        UNIQUE ("resposta_id"),
    CONSTRAINT "correcao_resposta_id_foreign"
        FOREIGN KEY ("resposta_id")
        REFERENCES "resposta_aluno" ("id")
        ON DELETE CASCADE,
    CONSTRAINT "correcao_professor_id_foreign"
        FOREIGN KEY ("professor_id")
        REFERENCES "professor" ("id")
        ON DELETE RESTRICT
);

CREATE INDEX "correcao_professor_id_index"
    ON "correcao" ("professor_id");

CREATE TABLE "feedback" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "correcao_id" UUID NOT NULL,
    "professor_id" UUID NOT NULL,
    "mensagem" TEXT NOT NULL,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_mensagem_check"
        CHECK (char_length(btrim("mensagem")) > 0),
    CONSTRAINT "feedback_correcao_id_foreign"
        FOREIGN KEY ("correcao_id")
        REFERENCES "correcao" ("id")
        ON DELETE CASCADE,
    CONSTRAINT "feedback_professor_id_foreign"
        FOREIGN KEY ("professor_id")
        REFERENCES "professor" ("id")
        ON DELETE RESTRICT
);

CREATE INDEX "feedback_correcao_id_index"
    ON "feedback" ("correcao_id");

CREATE INDEX "feedback_professor_id_index"
    ON "feedback" ("professor_id");

-- =========================================================
-- Relatorios
-- =========================================================

CREATE TABLE "relatorio" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "prova_id" UUID NOT NULL,
    "coordenador_id" UUID NOT NULL,
    "tipo" "relatorio_tipo" NOT NULL,
    "titulo" TEXT NULL,
    "conteudo" TEXT NULL,
    "url_arquivo" TEXT NULL,
    "gerado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "relatorio_titulo_check"
        CHECK ("titulo" IS NULL OR char_length(btrim("titulo")) > 0),
    CONSTRAINT "relatorio_prova_id_foreign"
        FOREIGN KEY ("prova_id")
        REFERENCES "prova" ("id")
        ON DELETE CASCADE,
    CONSTRAINT "relatorio_coordenador_id_foreign"
        FOREIGN KEY ("coordenador_id")
        REFERENCES "coordenador" ("id")
        ON DELETE RESTRICT
);

CREATE INDEX "relatorio_prova_id_index"
    ON "relatorio" ("prova_id");

CREATE INDEX "relatorio_coordenador_id_index"
    ON "relatorio" ("coordenador_id");

CREATE INDEX "relatorio_tipo_index"
    ON "relatorio" ("tipo");

CREATE TABLE "resultado_aluno" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "prova_aluno_id" UUID NOT NULL UNIQUE,
    "nota_total" NUMERIC(6, 2) NOT NULL DEFAULT 0,
    "percentual" NUMERIC(5, 2) NULL,
    "liberado" BOOLEAN NOT NULL DEFAULT FALSE,
    "liberado_em" TIMESTAMPTZ NULL,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resultado_aluno_nota_total_check"
        CHECK ("nota_total" >= 0),
    CONSTRAINT "resultado_aluno_percentual_check"
        CHECK ("percentual" IS NULL OR ("percentual" >= 0 AND "percentual" <= 100)),
    CONSTRAINT "resultado_aluno_prova_aluno_id_foreign"
        FOREIGN KEY ("prova_aluno_id")
        REFERENCES "prova_aluno" ("id")
        ON DELETE CASCADE
);

CREATE TABLE "exportacao_resultado" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "prova_id" UUID NOT NULL,
    "coordenador_id" UUID NOT NULL,
    "formato" TEXT NOT NULL DEFAULT 'xlsx',
    "url_arquivo" TEXT NULL,
    "gerado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exportacao_resultado_formato_check"
        CHECK ("formato" IN ('xlsx', 'csv')),
    CONSTRAINT "exportacao_resultado_prova_id_foreign"
        FOREIGN KEY ("prova_id")
        REFERENCES "prova" ("id")
        ON DELETE CASCADE,
    CONSTRAINT "exportacao_resultado_coordenador_id_foreign"
        FOREIGN KEY ("coordenador_id")
        REFERENCES "coordenador" ("id")
        ON DELETE RESTRICT
);

CREATE TABLE "email_envio" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "prova_aluno_id" UUID NOT NULL,
    "destinatario" CITEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "corpo" TEXT NULL,
    "status" "email_status" NOT NULL DEFAULT 'pendente',
    "erro" TEXT NULL,
    "enviado_em" TIMESTAMPTZ NULL,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_envio_assunto_check"
        CHECK (char_length(btrim("assunto")) > 0),
    CONSTRAINT "email_envio_prova_aluno_id_foreign"
        FOREIGN KEY ("prova_aluno_id")
        REFERENCES "prova_aluno" ("id")
        ON DELETE CASCADE
);

CREATE INDEX "email_envio_prova_aluno_id_index" ON "email_envio" ("prova_aluno_id");
CREATE INDEX "email_envio_status_index" ON "email_envio" ("status");

CREATE TABLE "avaliacao_log" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "prova_id" UUID NULL,
    "prova_aluno_id" UUID NULL,
    "ator_tipo" TEXT NOT NULL,
    "ator_id" UUID NULL,
    "acao" TEXT NOT NULL,
    "detalhes" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avaliacao_log_ator_tipo_check"
        CHECK ("ator_tipo" IN ('aluno', 'professor', 'coordenador', 'sistema')),
    CONSTRAINT "avaliacao_log_acao_check"
        CHECK (char_length(btrim("acao")) > 0),
    CONSTRAINT "avaliacao_log_prova_id_foreign"
        FOREIGN KEY ("prova_id")
        REFERENCES "prova" ("id")
        ON DELETE SET NULL,
    CONSTRAINT "avaliacao_log_prova_aluno_id_foreign"
        FOREIGN KEY ("prova_aluno_id")
        REFERENCES "prova_aluno" ("id")
        ON DELETE SET NULL
);

CREATE INDEX "avaliacao_log_prova_id_index" ON "avaliacao_log" ("prova_id");
CREATE INDEX "avaliacao_log_prova_aluno_id_index" ON "avaliacao_log" ("prova_aluno_id");
CREATE INDEX "avaliacao_log_acao_index" ON "avaliacao_log" ("acao");

-- =========================================================
-- Funcoes de apoio para RLS
-- =========================================================

CREATE OR REPLACE FUNCTION "auth_coordenador_id"()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT "id"
    FROM "coordenador"
    WHERE "auth_user_id" = auth.uid()
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION "auth_professor_id"()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT "id"
    FROM "professor"
    WHERE "auth_user_id" = auth.uid()
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION "auth_aluno_id"()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT "id"
    FROM "aluno"
    WHERE "auth_user_id" = auth.uid()
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION "is_coordenador"()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM "coordenador"
        WHERE "auth_user_id" = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION "is_professor"()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM "professor"
        WHERE "auth_user_id" = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION "is_aluno"()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM "aluno"
        WHERE "auth_user_id" = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION "is_professor_da_materia"(p_materia_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM "materia_professor" mp
        JOIN "professor" p
            ON p."id" = mp."professor_id"
        WHERE mp."materia_id" = p_materia_id
          AND p."auth_user_id" = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION "is_professor_da_prova"(p_prova_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM "prova" pr
        JOIN "professor" p
            ON p."id" = pr."professor_id"
        WHERE pr."id" = p_prova_id
          AND p."auth_user_id" = auth.uid()
    )
    OR EXISTS (
        SELECT 1
        FROM "prova" pr
        JOIN "materia_professor" mp
            ON mp."materia_id" = pr."materia_id"
        JOIN "professor" p
            ON p."id" = mp."professor_id"
        WHERE pr."id" = p_prova_id
          AND p."auth_user_id" = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION "is_aluno_da_prova_aluno"(p_prova_aluno_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM "prova_aluno" pa
        JOIN "aluno" a
            ON a."id" = pa."aluno_id"
        WHERE pa."id" = p_prova_aluno_id
          AND a."auth_user_id" = auth.uid()
    );
$$;

-- =========================================================
-- Validacoes por trigger
-- =========================================================

CREATE OR REPLACE FUNCTION "validar_questao_tema_materia"()
RETURNS TRIGGER AS $$
DECLARE
    v_materia_tema UUID;
BEGIN
    IF NEW."tema_id" IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT "materia_id"
    INTO v_materia_tema
    FROM "tema"
    WHERE "id" = NEW."tema_id";

    IF v_materia_tema IS NULL THEN
        RAISE EXCEPTION 'Tema % nao encontrado.', NEW."tema_id";
    END IF;

    IF v_materia_tema <> NEW."materia_id" THEN
        RAISE EXCEPTION 'O tema informado nao pertence a mesma materia da questao.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "validar_questao_tema_materia_trigger"
BEFORE INSERT OR UPDATE OF "materia_id", "tema_id" ON "questao"
FOR EACH ROW
EXECUTE FUNCTION "validar_questao_tema_materia"();

CREATE OR REPLACE FUNCTION "validar_alternativa_tipo_questao"()
RETURNS TRIGGER AS $$
DECLARE
    v_tipo "questao_tipo";
BEGIN
    SELECT "tipo"
    INTO v_tipo
    FROM "questao"
    WHERE "id" = NEW."questao_id";

    IF v_tipo IS NULL THEN
        RAISE EXCEPTION 'Questao % nao encontrada.', NEW."questao_id";
    END IF;

    IF v_tipo NOT IN ('multipla_escolha', 'verdadeiro_falso') THEN
        RAISE EXCEPTION 'Somente questoes de multipla escolha ou verdadeiro/falso podem ter alternativas.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "validar_alternativa_tipo_questao_trigger"
BEFORE INSERT OR UPDATE OF "questao_id" ON "alternativa"
FOR EACH ROW
EXECUTE FUNCTION "validar_alternativa_tipo_questao"();

CREATE OR REPLACE FUNCTION "validar_professor_materia_prova"()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM "materia_professor"
        WHERE "materia_id" = NEW."materia_id"
          AND "professor_id" = NEW."professor_id"
    ) THEN
        RAISE EXCEPTION 'O professor informado nao esta vinculado a materia desta prova.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "validar_professor_materia_prova_trigger"
BEFORE INSERT OR UPDATE OF "professor_id", "materia_id" ON "prova"
FOR EACH ROW
EXECUTE FUNCTION "validar_professor_materia_prova"();

CREATE OR REPLACE FUNCTION "gerar_qr_code_prova"()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."url_acesso" IS NOT NULL AND char_length(btrim(NEW."url_acesso")) > 0 THEN
        -- O banco gera o payload a ser codificado no QR Code.
        -- A imagem do QR Code deve ser renderizada pelo backend/frontend a partir deste valor.
        NEW."qr_code" = NEW."url_acesso";
    ELSE
        NEW."qr_code" = NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "gerar_qr_code_prova_trigger"
BEFORE INSERT OR UPDATE OF "url_acesso" ON "prova"
FOR EACH ROW
EXECUTE FUNCTION "gerar_qr_code_prova"();

CREATE OR REPLACE FUNCTION "validar_prova_questao"()
RETURNS TRIGGER AS $$
DECLARE
    v_materia_prova UUID;
    v_materia_questao UUID;
    v_status_prova "prova_status";
BEGIN
    SELECT "materia_id", "status"
    INTO v_materia_prova, v_status_prova
    FROM "prova"
    WHERE "id" = NEW."prova_id";

    SELECT "materia_id"
    INTO v_materia_questao
    FROM "questao"
    WHERE "id" = NEW."questao_id";

    IF v_materia_prova IS NULL OR v_materia_questao IS NULL THEN
        RAISE EXCEPTION 'Prova ou questao inexistente.';
    END IF;

    IF v_status_prova <> 'rascunho' THEN
        RAISE EXCEPTION 'Questoes so podem ser alteradas em provas com status rascunho.';
    END IF;

    IF v_materia_prova <> v_materia_questao THEN
        RAISE EXCEPTION 'A questao nao pertence a mesma materia da prova.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM "enunciado"
        WHERE "questao_id" = NEW."questao_id"
    ) THEN
        RAISE EXCEPTION 'A questao precisa ter enunciado antes de ser associada a prova.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "validar_prova_questao_trigger"
BEFORE INSERT OR UPDATE OF "prova_id", "questao_id" ON "prova_questao"
FOR EACH ROW
EXECUTE FUNCTION "validar_prova_questao"();

CREATE OR REPLACE FUNCTION "validar_transicao_e_publicacao_prova"()
RETURNS TRIGGER AS $$
DECLARE
    v_quantidade_questoes INTEGER;
    v_sem_enunciado INTEGER;
    v_objetivas_invalidas INTEGER;
    v_vf_invalidas INTEGER;
    v_discursivas_com_alternativa INTEGER;
BEGIN
    IF TG_OP = 'UPDATE' AND NEW."status" <> OLD."status" THEN
        IF NOT (
            (OLD."status" = 'rascunho' AND NEW."status" = 'publicada')
            OR (OLD."status" = 'publicada' AND NEW."status" = 'rascunho')
            OR (OLD."status" = 'publicada' AND NEW."status" = 'encerrada')
            OR (OLD."status" = 'encerrada' AND NEW."status" = 'antiga')
        ) THEN
            RAISE EXCEPTION 'Transicao de status invalida: % -> %.', OLD."status", NEW."status";
        END IF;
    END IF;

    IF NEW."status" <> 'publicada' THEN
        RETURN NEW;
    END IF;

    IF NEW."data_inicio" IS NULL OR NEW."data_fim" IS NULL THEN
        RAISE EXCEPTION 'Provas publicadas precisam de data_inicio e data_fim.';
    END IF;

    IF NEW."data_fim" <= NEW."data_inicio" THEN
        RAISE EXCEPTION 'A data_fim precisa ser maior que a data_inicio.';
    END IF;

    IF NEW."url_acesso" IS NULL OR char_length(btrim(NEW."url_acesso")) = 0 THEN
        RAISE EXCEPTION 'Provas publicadas precisam de url_acesso.';
    END IF;

    SELECT COUNT(*)
    INTO v_quantidade_questoes
    FROM "prova_questao"
    WHERE "prova_id" = NEW."id";

    IF v_quantidade_questoes = 0 THEN
        RAISE EXCEPTION 'Nao e possivel publicar uma prova sem questoes.';
    END IF;

    SELECT COUNT(*)
    INTO v_sem_enunciado
    FROM "prova_questao" pq
    LEFT JOIN "enunciado" e
        ON e."questao_id" = pq."questao_id"
    WHERE pq."prova_id" = NEW."id"
      AND e."id" IS NULL;

    IF v_sem_enunciado > 0 THEN
        RAISE EXCEPTION 'Todas as questoes da prova precisam ter enunciado.';
    END IF;

    SELECT COUNT(*)
    INTO v_objetivas_invalidas
    FROM "prova_questao" pq
    JOIN "questao" q
        ON q."id" = pq."questao_id"
    WHERE pq."prova_id" = NEW."id"
      AND q."tipo" = 'multipla_escolha'
      AND (
          (SELECT COUNT(*) FROM "alternativa" a WHERE a."questao_id" = q."id") < 2
          OR
          (SELECT COUNT(*) FROM "alternativa" a WHERE a."questao_id" = q."id" AND a."correta" = TRUE) <> 1
      );

    IF v_objetivas_invalidas > 0 THEN
        RAISE EXCEPTION 'Questoes de multipla escolha precisam ter pelo menos duas alternativas e exatamente uma correta.';
    END IF;

    SELECT COUNT(*)
    INTO v_vf_invalidas
    FROM "prova_questao" pq
    JOIN "questao" q
        ON q."id" = pq."questao_id"
    WHERE pq."prova_id" = NEW."id"
      AND q."tipo" = 'verdadeiro_falso'
      AND (
          (SELECT COUNT(*) FROM "alternativa" a WHERE a."questao_id" = q."id") <> 2
          OR
          (SELECT COUNT(*) FROM "alternativa" a WHERE a."questao_id" = q."id" AND a."correta" = TRUE) <> 1
      );

    IF v_vf_invalidas > 0 THEN
        RAISE EXCEPTION 'Questoes de verdadeiro/falso precisam ter exatamente duas alternativas e uma correta.';
    END IF;

    SELECT COUNT(*)
    INTO v_discursivas_com_alternativa
    FROM "prova_questao" pq
    JOIN "questao" q
        ON q."id" = pq."questao_id"
    JOIN "alternativa" a
        ON a."questao_id" = q."id"
    WHERE pq."prova_id" = NEW."id"
      AND q."tipo" = 'discursiva';

    IF v_discursivas_com_alternativa > 0 THEN
        RAISE EXCEPTION 'Questoes discursivas nao podem ter alternativas.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "validar_transicao_e_publicacao_prova_trigger"
BEFORE INSERT OR UPDATE OF "status", "data_inicio", "data_fim", "url_acesso" ON "prova"
FOR EACH ROW
EXECUTE FUNCTION "validar_transicao_e_publicacao_prova"();

CREATE OR REPLACE FUNCTION "registrar_status_prova"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO "prova_status_historico" (
            "prova_id", "status_anterior", "status_novo", "alterado_por_auth_user_id"
        ) VALUES (
            NEW."id", NULL, NEW."status", auth.uid()
        );
    ELSIF NEW."status" <> OLD."status" THEN
        INSERT INTO "prova_status_historico" (
            "prova_id", "status_anterior", "status_novo", "alterado_por_auth_user_id"
        ) VALUES (
            NEW."id", OLD."status", NEW."status", auth.uid()
        );
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER "registrar_status_prova_trigger"
AFTER INSERT OR UPDATE OF "status" ON "prova"
FOR EACH ROW
EXECUTE FUNCTION "registrar_status_prova"();

CREATE OR REPLACE FUNCTION "validar_prova_aluno"()
RETURNS TRIGGER AS $$
DECLARE
    v_status_prova "prova_status";
    v_data_inicio TIMESTAMPTZ;
    v_data_fim TIMESTAMPTZ;
BEGIN
    SELECT "status", "data_inicio", "data_fim"
    INTO v_status_prova, v_data_inicio, v_data_fim
    FROM "prova"
    WHERE "id" = NEW."prova_id";

    IF v_status_prova IS NULL THEN
        RAISE EXCEPTION 'Prova % nao encontrada.', NEW."prova_id";
    END IF;

    IF TG_OP = 'UPDATE' AND NEW."status" <> OLD."status" THEN
        IF NOT (
            (OLD."status" = 'nao_iniciada' AND NEW."status" = 'em_andamento')
            OR (OLD."status" = 'em_andamento' AND NEW."status" = 'enviada')
            OR (OLD."status" = 'enviada' AND NEW."status" = 'corrigida')
        ) THEN
            RAISE EXCEPTION 'Transicao de status da prova do aluno invalida: % -> %.', OLD."status", NEW."status";
        END IF;
    END IF;

    IF NEW."status" IN ('em_andamento', 'enviada') THEN
        IF v_status_prova <> 'publicada' THEN
            RAISE EXCEPTION 'O aluno so pode iniciar ou enviar provas publicadas.';
        END IF;

        IF v_data_inicio IS NULL OR v_data_fim IS NULL THEN
            RAISE EXCEPTION 'A prova precisa ter data_inicio e data_fim para ser respondida.';
        END IF;

        IF CURRENT_TIMESTAMP < v_data_inicio THEN
            RAISE EXCEPTION 'A prova ainda nao iniciou.';
        END IF;

        IF CURRENT_TIMESTAMP > v_data_fim THEN
            RAISE EXCEPTION 'O prazo da prova ja terminou.';
        END IF;
    END IF;

    IF NEW."status" = 'em_andamento' AND NEW."inicio_em" IS NULL THEN
        NEW."inicio_em" = CURRENT_TIMESTAMP;
    END IF;

    IF NEW."status" = 'enviada' AND NEW."enviada_em" IS NULL THEN
        NEW."enviada_em" = CURRENT_TIMESTAMP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "validar_prova_aluno_trigger"
BEFORE INSERT OR UPDATE OF "status", "inicio_em", "enviada_em" ON "prova_aluno"
FOR EACH ROW
EXECUTE FUNCTION "validar_prova_aluno"();

CREATE OR REPLACE FUNCTION "validar_resposta_aluno"()
RETURNS TRIGGER AS $$
DECLARE
    v_prova_id UUID;
    v_tipo_questao "questao_tipo";
    v_questao_da_alternativa UUID;
    v_status_prova "prova_status";
    v_status_prova_aluno "prova_aluno_status";
    v_data_inicio TIMESTAMPTZ;
    v_data_fim TIMESTAMPTZ;
BEGIN
    SELECT pa."prova_id", pa."status", p."status", p."data_inicio", p."data_fim"
    INTO v_prova_id, v_status_prova_aluno, v_status_prova, v_data_inicio, v_data_fim
    FROM "prova_aluno" pa
    JOIN "prova" p
        ON p."id" = pa."prova_id"
    WHERE pa."id" = NEW."prova_aluno_id";

    SELECT "tipo"
    INTO v_tipo_questao
    FROM "questao"
    WHERE "id" = NEW."questao_id";

    IF v_prova_id IS NULL OR v_tipo_questao IS NULL THEN
        RAISE EXCEPTION 'Prova do aluno ou questao inexistente.';
    END IF;

    IF v_status_prova <> 'publicada' THEN
        RAISE EXCEPTION 'Nao e possivel responder prova que nao esta publicada.';
    END IF;

    IF v_status_prova_aluno <> 'em_andamento' THEN
        RAISE EXCEPTION 'O aluno so pode responder provas com status em_andamento.';
    END IF;

    IF v_data_inicio IS NULL OR v_data_fim IS NULL THEN
        RAISE EXCEPTION 'A prova precisa ter data_inicio e data_fim para ser respondida.';
    END IF;

    IF CURRENT_TIMESTAMP < v_data_inicio THEN
        RAISE EXCEPTION 'A prova ainda nao iniciou.';
    END IF;

    IF CURRENT_TIMESTAMP > v_data_fim THEN
        RAISE EXCEPTION 'O prazo da prova ja terminou.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM "prova_questao"
        WHERE "prova_id" = v_prova_id
          AND "questao_id" = NEW."questao_id"
    ) THEN
        RAISE EXCEPTION 'A questao informada nao pertence a prova do aluno.';
    END IF;

    IF NEW."alternativa_id" IS NOT NULL THEN
        SELECT "questao_id"
        INTO v_questao_da_alternativa
        FROM "alternativa"
        WHERE "id" = NEW."alternativa_id";

        IF v_questao_da_alternativa IS NULL OR v_questao_da_alternativa <> NEW."questao_id" THEN
            RAISE EXCEPTION 'A alternativa informada nao pertence a questao respondida.';
        END IF;
    END IF;

    IF v_tipo_questao IN ('multipla_escolha', 'verdadeiro_falso') AND NEW."alternativa_id" IS NULL THEN
        RAISE EXCEPTION 'Questoes de multipla escolha ou verdadeiro/falso precisam de alternativa marcada.';
    END IF;

    IF v_tipo_questao = 'discursiva' AND NEW."alternativa_id" IS NOT NULL THEN
        RAISE EXCEPTION 'Questoes discursivas nao devem ter alternativa marcada.';
    END IF;

    IF v_tipo_questao = 'discursiva' THEN
        IF EXISTS (
            SELECT 1 FROM "questao" q
            WHERE q."id" = NEW."questao_id"
              AND q."limite_caracteres" IS NOT NULL
              AND NEW."resposta_texto" IS NOT NULL
              AND char_length(NEW."resposta_texto") > q."limite_caracteres"
        ) THEN
            RAISE EXCEPTION 'A resposta ultrapassa o limite de caracteres da questao.';
        END IF;
    END IF;

    IF NEW."sincronizada_em" IS NULL THEN
        NEW."sincronizada_em" = CURRENT_TIMESTAMP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "validar_resposta_aluno_trigger"
BEFORE INSERT OR UPDATE OF "prova_aluno_id", "questao_id", "alternativa_id", "resposta_texto", "url_imagem", "rascunho", "sincronizada_em", "enviada_final" ON "resposta_aluno"
FOR EACH ROW
EXECUTE FUNCTION "validar_resposta_aluno"();

CREATE OR REPLACE FUNCTION "validar_correcao"()
RETURNS TRIGGER AS $$
DECLARE
    v_pontuacao_max NUMERIC(5, 2);
    v_materia_id UUID;
    v_professor_dono UUID;
    v_status_prova_aluno "prova_aluno_status";
BEGIN
    SELECT pq."pontuacao_max", p."materia_id", p."professor_id", pa."status"
    INTO v_pontuacao_max, v_materia_id, v_professor_dono, v_status_prova_aluno
    FROM "resposta_aluno" ra
    JOIN "prova_aluno" pa
        ON pa."id" = ra."prova_aluno_id"
    JOIN "prova" p
        ON p."id" = pa."prova_id"
    JOIN "prova_questao" pq
        ON pq."prova_id" = p."id"
       AND pq."questao_id" = ra."questao_id"
    WHERE ra."id" = NEW."resposta_id";

    IF v_pontuacao_max IS NULL THEN
        RAISE EXCEPTION 'Nao foi possivel encontrar a pontuacao maxima da resposta.';
    END IF;

    IF v_status_prova_aluno NOT IN ('enviada', 'corrigida') THEN
        RAISE EXCEPTION 'A correcao so pode ser feita depois que a prova for enviada pelo aluno.';
    END IF;

    IF NEW."nota" > v_pontuacao_max THEN
        RAISE EXCEPTION 'A nota nao pode ser maior que a pontuacao maxima da questao na prova.';
    END IF;

    IF NOT (
        NEW."professor_id" = v_professor_dono
        OR EXISTS (
            SELECT 1
            FROM "materia_professor" mp
            WHERE mp."materia_id" = v_materia_id
              AND mp."professor_id" = NEW."professor_id"
        )
    ) THEN
        RAISE EXCEPTION 'O professor informado nao esta associado a correcao desta prova.';
    END IF;

    IF NEW."corrigida_em" IS NULL THEN
        NEW."corrigida_em" = CURRENT_TIMESTAMP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "validar_correcao_trigger"
BEFORE INSERT OR UPDATE OF "resposta_id", "professor_id", "nota" ON "correcao"
FOR EACH ROW
EXECUTE FUNCTION "validar_correcao"();

CREATE OR REPLACE FUNCTION "corrigir_objetivas_automaticamente"(p_prova_aluno_id UUID, p_professor_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO "correcao" ("resposta_id", "professor_id", "nota", "tipo", "corrigida_em")
    SELECT
        ra."id",
        p_professor_id,
        CASE WHEN a."correta" = TRUE THEN pq."pontuacao_max" ELSE 0 END,
        'automatica',
        CURRENT_TIMESTAMP
    FROM "resposta_aluno" ra
    JOIN "prova_aluno" pa ON pa."id" = ra."prova_aluno_id"
    JOIN "prova_questao" pq ON pq."prova_id" = pa."prova_id" AND pq."questao_id" = ra."questao_id"
    JOIN "questao" q ON q."id" = ra."questao_id"
    JOIN "alternativa" a ON a."id" = ra."alternativa_id"
    WHERE ra."prova_aluno_id" = p_prova_aluno_id
      AND q."tipo" IN ('multipla_escolha', 'verdadeiro_falso')
    ON CONFLICT ("resposta_id") DO UPDATE
    SET "nota" = EXCLUDED."nota",
        "tipo" = 'automatica',
        "corrigida_em" = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =========================================================
-- Triggers de atualizado_em
-- =========================================================

CREATE TRIGGER "set_coordenador_atualizado_em"
BEFORE UPDATE ON "coordenador"
FOR EACH ROW EXECUTE FUNCTION "set_atualizado_em"();

CREATE TRIGGER "set_professor_atualizado_em"
BEFORE UPDATE ON "professor"
FOR EACH ROW EXECUTE FUNCTION "set_atualizado_em"();

CREATE TRIGGER "set_materia_atualizado_em"
BEFORE UPDATE ON "materia"
FOR EACH ROW EXECUTE FUNCTION "set_atualizado_em"();

CREATE TRIGGER "set_aluno_atualizado_em"
BEFORE UPDATE ON "aluno"
FOR EACH ROW EXECUTE FUNCTION "set_atualizado_em"();

CREATE TRIGGER "set_tema_atualizado_em"
BEFORE UPDATE ON "tema"
FOR EACH ROW EXECUTE FUNCTION "set_atualizado_em"();

CREATE TRIGGER "set_questao_atualizado_em"
BEFORE UPDATE ON "questao"
FOR EACH ROW EXECUTE FUNCTION "set_atualizado_em"();

CREATE TRIGGER "set_enunciado_atualizado_em"
BEFORE UPDATE ON "enunciado"
FOR EACH ROW EXECUTE FUNCTION "set_atualizado_em"();

CREATE TRIGGER "set_alternativa_atualizado_em"
BEFORE UPDATE ON "alternativa"
FOR EACH ROW EXECUTE FUNCTION "set_atualizado_em"();

CREATE TRIGGER "set_prova_atualizado_em"
BEFORE UPDATE ON "prova"
FOR EACH ROW EXECUTE FUNCTION "set_atualizado_em"();

CREATE TRIGGER "set_prova_aluno_atualizado_em"
BEFORE UPDATE ON "prova_aluno"
FOR EACH ROW EXECUTE FUNCTION "set_atualizado_em"();

CREATE TRIGGER "set_resposta_aluno_atualizado_em"
BEFORE UPDATE ON "resposta_aluno"
FOR EACH ROW EXECUTE FUNCTION "set_atualizado_em"();

CREATE TRIGGER "set_correcao_atualizado_em"
BEFORE UPDATE ON "correcao"
FOR EACH ROW EXECUTE FUNCTION "set_atualizado_em"();

CREATE TRIGGER "set_feedback_atualizado_em"
BEFORE UPDATE ON "feedback"
FOR EACH ROW EXECUTE FUNCTION "set_atualizado_em"();

CREATE TRIGGER "set_relatorio_atualizado_em"
BEFORE UPDATE ON "relatorio"
FOR EACH ROW EXECUTE FUNCTION "set_atualizado_em"();

CREATE TRIGGER "set_resultado_aluno_atualizado_em"
BEFORE UPDATE ON "resultado_aluno"
FOR EACH ROW EXECUTE FUNCTION "set_atualizado_em"();

CREATE TRIGGER "set_email_envio_atualizado_em"
BEFORE UPDATE ON "email_envio"
FOR EACH ROW EXECUTE FUNCTION "set_atualizado_em"();

-- =========================================================
-- Row Level Security - CRUD
-- =========================================================

ALTER TABLE "coordenador" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "professor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "materia" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "materia_professor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "aluno" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tema" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "questao" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "enunciado" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "alternativa" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "prova" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "prova_status_historico" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "prova_questao" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "prova_aluno" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "resposta_aluno" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "correcao" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "feedback" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "relatorio" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "resposta_anexo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "resultado_aluno" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "exportacao_resultado" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "email_envio" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "avaliacao_log" ENABLE ROW LEVEL SECURITY;

-- Coordenador
CREATE POLICY "coordenador_select" ON "coordenador"
FOR SELECT TO authenticated
USING ("auth_user_id" = auth.uid() OR "is_coordenador"());

CREATE POLICY "coordenador_insert" ON "coordenador"
FOR INSERT TO authenticated
WITH CHECK ("auth_user_id" = auth.uid() OR "is_coordenador"());

CREATE POLICY "coordenador_update" ON "coordenador"
FOR UPDATE TO authenticated
USING ("auth_user_id" = auth.uid() OR "is_coordenador"())
WITH CHECK ("auth_user_id" = auth.uid() OR "is_coordenador"());

CREATE POLICY "coordenador_delete" ON "coordenador"
FOR DELETE TO authenticated
USING ("auth_user_id" = auth.uid() OR "is_coordenador"());

-- Professor
CREATE POLICY "professor_select" ON "professor"
FOR SELECT TO authenticated
USING ("auth_user_id" = auth.uid() OR "is_coordenador"());

CREATE POLICY "professor_insert" ON "professor"
FOR INSERT TO authenticated
WITH CHECK ("is_coordenador"());

CREATE POLICY "professor_update" ON "professor"
FOR UPDATE TO authenticated
USING ("auth_user_id" = auth.uid() OR "is_coordenador"())
WITH CHECK ("auth_user_id" = auth.uid() OR "is_coordenador"());

CREATE POLICY "professor_delete" ON "professor"
FOR DELETE TO authenticated
USING ("is_coordenador"());

-- Materia
CREATE POLICY "materia_select" ON "materia"
FOR SELECT TO authenticated
USING (TRUE);

CREATE POLICY "materia_insert" ON "materia"
FOR INSERT TO authenticated
WITH CHECK ("is_coordenador"());

CREATE POLICY "materia_update" ON "materia"
FOR UPDATE TO authenticated
USING ("is_coordenador"())
WITH CHECK ("is_coordenador"());

CREATE POLICY "materia_delete" ON "materia"
FOR DELETE TO authenticated
USING ("is_coordenador"());

-- Materia_Professor
CREATE POLICY "materia_professor_select" ON "materia_professor"
FOR SELECT TO authenticated
USING (TRUE);

CREATE POLICY "materia_professor_insert" ON "materia_professor"
FOR INSERT TO authenticated
WITH CHECK ("is_coordenador"());

CREATE POLICY "materia_professor_update" ON "materia_professor"
FOR UPDATE TO authenticated
USING ("is_coordenador"())
WITH CHECK ("is_coordenador"());

CREATE POLICY "materia_professor_delete" ON "materia_professor"
FOR DELETE TO authenticated
USING ("is_coordenador"());

-- Aluno
CREATE POLICY "aluno_select" ON "aluno"
FOR SELECT TO authenticated
USING ("auth_user_id" = auth.uid() OR "is_professor"() OR "is_coordenador"());

CREATE POLICY "aluno_insert" ON "aluno"
FOR INSERT TO authenticated
WITH CHECK ("auth_user_id" = auth.uid() OR "is_professor"() OR "is_coordenador"());

CREATE POLICY "aluno_update" ON "aluno"
FOR UPDATE TO authenticated
USING ("auth_user_id" = auth.uid() OR "is_coordenador"())
WITH CHECK ("auth_user_id" = auth.uid() OR "is_coordenador"());

CREATE POLICY "aluno_delete" ON "aluno"
FOR DELETE TO authenticated
USING ("is_coordenador"());

-- Tema
CREATE POLICY "tema_select" ON "tema"
FOR SELECT TO authenticated
USING (TRUE);

CREATE POLICY "tema_insert" ON "tema"
FOR INSERT TO authenticated
WITH CHECK ("is_coordenador"() OR "is_professor_da_materia"("materia_id"));

CREATE POLICY "tema_update" ON "tema"
FOR UPDATE TO authenticated
USING ("is_coordenador"() OR "is_professor_da_materia"("materia_id"))
WITH CHECK ("is_coordenador"() OR "is_professor_da_materia"("materia_id"));

CREATE POLICY "tema_delete" ON "tema"
FOR DELETE TO authenticated
USING ("is_coordenador"());

-- Questao
CREATE POLICY "questao_select" ON "questao"
FOR SELECT TO authenticated
USING (TRUE);

CREATE POLICY "questao_insert" ON "questao"
FOR INSERT TO authenticated
WITH CHECK ("is_coordenador"() OR "is_professor_da_materia"("materia_id"));

CREATE POLICY "questao_update" ON "questao"
FOR UPDATE TO authenticated
USING ("is_coordenador"() OR "is_professor_da_materia"("materia_id"))
WITH CHECK ("is_coordenador"() OR "is_professor_da_materia"("materia_id"));

CREATE POLICY "questao_delete" ON "questao"
FOR DELETE TO authenticated
USING ("is_coordenador"() OR "is_professor_da_materia"("materia_id"));

-- Enunciado
CREATE POLICY "enunciado_select" ON "enunciado"
FOR SELECT TO authenticated
USING (TRUE);

CREATE POLICY "enunciado_insert" ON "enunciado"
FOR INSERT TO authenticated
WITH CHECK (
    "is_coordenador"()
    OR EXISTS (
        SELECT 1 FROM "questao" q
        WHERE q."id" = "enunciado"."questao_id"
          AND "is_professor_da_materia"(q."materia_id")
    )
);

CREATE POLICY "enunciado_update" ON "enunciado"
FOR UPDATE TO authenticated
USING (
    "is_coordenador"()
    OR EXISTS (
        SELECT 1 FROM "questao" q
        WHERE q."id" = "enunciado"."questao_id"
          AND "is_professor_da_materia"(q."materia_id")
    )
)
WITH CHECK (
    "is_coordenador"()
    OR EXISTS (
        SELECT 1 FROM "questao" q
        WHERE q."id" = "enunciado"."questao_id"
          AND "is_professor_da_materia"(q."materia_id")
    )
);

CREATE POLICY "enunciado_delete" ON "enunciado"
FOR DELETE TO authenticated
USING (
    "is_coordenador"()
    OR EXISTS (
        SELECT 1 FROM "questao" q
        WHERE q."id" = "enunciado"."questao_id"
          AND "is_professor_da_materia"(q."materia_id")
    )
);

-- Alternativa
CREATE POLICY "alternativa_select" ON "alternativa"
FOR SELECT TO authenticated
USING (TRUE);

CREATE POLICY "alternativa_insert" ON "alternativa"
FOR INSERT TO authenticated
WITH CHECK (
    "is_coordenador"()
    OR EXISTS (
        SELECT 1 FROM "questao" q
        WHERE q."id" = "alternativa"."questao_id"
          AND "is_professor_da_materia"(q."materia_id")
    )
);

CREATE POLICY "alternativa_update" ON "alternativa"
FOR UPDATE TO authenticated
USING (
    "is_coordenador"()
    OR EXISTS (
        SELECT 1 FROM "questao" q
        WHERE q."id" = "alternativa"."questao_id"
          AND "is_professor_da_materia"(q."materia_id")
    )
)
WITH CHECK (
    "is_coordenador"()
    OR EXISTS (
        SELECT 1 FROM "questao" q
        WHERE q."id" = "alternativa"."questao_id"
          AND "is_professor_da_materia"(q."materia_id")
    )
);

CREATE POLICY "alternativa_delete" ON "alternativa"
FOR DELETE TO authenticated
USING (
    "is_coordenador"()
    OR EXISTS (
        SELECT 1 FROM "questao" q
        WHERE q."id" = "alternativa"."questao_id"
          AND "is_professor_da_materia"(q."materia_id")
    )
);

-- Prova
CREATE POLICY "prova_select" ON "prova"
FOR SELECT TO authenticated
USING (
    "is_coordenador"()
    OR "is_professor_da_prova"("id")
    OR EXISTS (
        SELECT 1
        FROM "prova_aluno" pa
        WHERE pa."prova_id" = "prova"."id"
          AND pa."aluno_id" = "auth_aluno_id"()
    )
);

CREATE POLICY "prova_insert" ON "prova"
FOR INSERT TO authenticated
WITH CHECK (
    "is_coordenador"()
    OR (
        "professor_id" = "auth_professor_id"()
        AND "is_professor_da_materia"("materia_id")
    )
);

CREATE POLICY "prova_update" ON "prova"
FOR UPDATE TO authenticated
USING ("is_coordenador"() OR "is_professor_da_prova"("id"))
WITH CHECK (
    "is_coordenador"()
    OR (
        "professor_id" = "auth_professor_id"()
        AND "is_professor_da_materia"("materia_id")
    )
);

CREATE POLICY "prova_delete" ON "prova"
FOR DELETE TO authenticated
USING ("is_coordenador"() OR "professor_id" = "auth_professor_id"());

-- Historico de status da prova
CREATE POLICY "prova_status_historico_select" ON "prova_status_historico"
FOR SELECT TO authenticated
USING ("is_coordenador"() OR "is_professor_da_prova"("prova_id"));

-- Prova_Questao
CREATE POLICY "prova_questao_select" ON "prova_questao"
FOR SELECT TO authenticated
USING (
    "is_coordenador"()
    OR "is_professor_da_prova"("prova_id")
    OR EXISTS (
        SELECT 1 FROM "prova_aluno" pa
        WHERE pa."prova_id" = "prova_questao"."prova_id"
          AND pa."aluno_id" = "auth_aluno_id"()
    )
);

CREATE POLICY "prova_questao_insert" ON "prova_questao"
FOR INSERT TO authenticated
WITH CHECK ("is_coordenador"() OR "is_professor_da_prova"("prova_id"));

CREATE POLICY "prova_questao_update" ON "prova_questao"
FOR UPDATE TO authenticated
USING ("is_coordenador"() OR "is_professor_da_prova"("prova_id"))
WITH CHECK ("is_coordenador"() OR "is_professor_da_prova"("prova_id"));

CREATE POLICY "prova_questao_delete" ON "prova_questao"
FOR DELETE TO authenticated
USING ("is_coordenador"() OR "is_professor_da_prova"("prova_id"));

-- Prova_Aluno
CREATE POLICY "prova_aluno_select" ON "prova_aluno"
FOR SELECT TO authenticated
USING (
    "is_coordenador"()
    OR "is_professor_da_prova"("prova_id")
    OR "aluno_id" = "auth_aluno_id"()
);

CREATE POLICY "prova_aluno_insert" ON "prova_aluno"
FOR INSERT TO authenticated
WITH CHECK ("is_coordenador"() OR "is_professor_da_prova"("prova_id"));

CREATE POLICY "prova_aluno_update" ON "prova_aluno"
FOR UPDATE TO authenticated
USING (
    "is_coordenador"()
    OR "is_professor_da_prova"("prova_id")
    OR "aluno_id" = "auth_aluno_id"()
)
WITH CHECK (
    "is_coordenador"()
    OR "is_professor_da_prova"("prova_id")
    OR "aluno_id" = "auth_aluno_id"()
);

CREATE POLICY "prova_aluno_delete" ON "prova_aluno"
FOR DELETE TO authenticated
USING ("is_coordenador"() OR "is_professor_da_prova"("prova_id"));

-- Resposta_Aluno
CREATE POLICY "resposta_aluno_select" ON "resposta_aluno"
FOR SELECT TO authenticated
USING (
    "is_coordenador"()
    OR EXISTS (
        SELECT 1
        FROM "prova_aluno" pa
        WHERE pa."id" = "resposta_aluno"."prova_aluno_id"
          AND (
              pa."aluno_id" = "auth_aluno_id"()
              OR "is_professor_da_prova"(pa."prova_id")
          )
    )
);

CREATE POLICY "resposta_aluno_insert" ON "resposta_aluno"
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM "prova_aluno" pa
        WHERE pa."id" = "resposta_aluno"."prova_aluno_id"
          AND pa."aluno_id" = "auth_aluno_id"()
    )
);

CREATE POLICY "resposta_aluno_update" ON "resposta_aluno"
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM "prova_aluno" pa
        WHERE pa."id" = "resposta_aluno"."prova_aluno_id"
          AND pa."aluno_id" = "auth_aluno_id"()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM "prova_aluno" pa
        WHERE pa."id" = "resposta_aluno"."prova_aluno_id"
          AND pa."aluno_id" = "auth_aluno_id"()
    )
);

CREATE POLICY "resposta_aluno_delete" ON "resposta_aluno"
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM "prova_aluno" pa
        WHERE pa."id" = "resposta_aluno"."prova_aluno_id"
          AND pa."aluno_id" = "auth_aluno_id"()
    )
);

-- Correcao
CREATE POLICY "correcao_select" ON "correcao"
FOR SELECT TO authenticated
USING (
    "is_coordenador"()
    OR EXISTS (
        SELECT 1
        FROM "resposta_aluno" ra
        JOIN "prova_aluno" pa ON pa."id" = ra."prova_aluno_id"
        WHERE ra."id" = "correcao"."resposta_id"
          AND (
              pa."aluno_id" = "auth_aluno_id"()
              OR "is_professor_da_prova"(pa."prova_id")
          )
    )
);

CREATE POLICY "correcao_insert" ON "correcao"
FOR INSERT TO authenticated
WITH CHECK (
    "is_coordenador"()
    OR "professor_id" = "auth_professor_id"()
);

CREATE POLICY "correcao_update" ON "correcao"
FOR UPDATE TO authenticated
USING ("is_coordenador"() OR "professor_id" = "auth_professor_id"())
WITH CHECK ("is_coordenador"() OR "professor_id" = "auth_professor_id"());

CREATE POLICY "correcao_delete" ON "correcao"
FOR DELETE TO authenticated
USING ("is_coordenador"() OR "professor_id" = "auth_professor_id"());

-- Feedback
CREATE POLICY "feedback_select" ON "feedback"
FOR SELECT TO authenticated
USING (
    "is_coordenador"()
    OR "professor_id" = "auth_professor_id"()
    OR EXISTS (
        SELECT 1
        FROM "correcao" c
        JOIN "resposta_aluno" ra ON ra."id" = c."resposta_id"
        JOIN "prova_aluno" pa ON pa."id" = ra."prova_aluno_id"
        WHERE c."id" = "feedback"."correcao_id"
          AND pa."aluno_id" = "auth_aluno_id"()
    )
);

CREATE POLICY "feedback_insert" ON "feedback"
FOR INSERT TO authenticated
WITH CHECK ("is_coordenador"() OR "professor_id" = "auth_professor_id"());

CREATE POLICY "feedback_update" ON "feedback"
FOR UPDATE TO authenticated
USING ("is_coordenador"() OR "professor_id" = "auth_professor_id"())
WITH CHECK ("is_coordenador"() OR "professor_id" = "auth_professor_id"());

CREATE POLICY "feedback_delete" ON "feedback"
FOR DELETE TO authenticated
USING ("is_coordenador"() OR "professor_id" = "auth_professor_id"());

-- Relatorio
CREATE POLICY "relatorio_select" ON "relatorio"
FOR SELECT TO authenticated
USING ("is_coordenador"() OR "is_professor_da_prova"("prova_id"));

CREATE POLICY "relatorio_insert" ON "relatorio"
FOR INSERT TO authenticated
WITH CHECK ("is_coordenador"());

CREATE POLICY "relatorio_update" ON "relatorio"
FOR UPDATE TO authenticated
USING ("is_coordenador"())
WITH CHECK ("is_coordenador"());

CREATE POLICY "relatorio_delete" ON "relatorio"
FOR DELETE TO authenticated
USING ("is_coordenador"());


-- Portal publico do aluno por link unico (UC08 a UC11)
CREATE POLICY "prova_select_anon_publicada_por_link" ON "prova"
FOR SELECT TO anon
USING ("status" = 'publicada' AND "url_acesso" IS NOT NULL);

CREATE POLICY "aluno_insert_anon_portal" ON "aluno"
FOR INSERT TO anon
WITH CHECK (
    char_length(btrim("nome")) > 0
    AND "email" IS NOT NULL
    AND "cpf" IS NOT NULL
    AND "aceitou_termos_em" IS NOT NULL
);

-- Anexos de resposta
CREATE POLICY "resposta_anexo_select" ON "resposta_anexo"
FOR SELECT TO authenticated
USING (
    "is_coordenador"()
    OR EXISTS (
        SELECT 1
        FROM "resposta_aluno" ra
        JOIN "prova_aluno" pa ON pa."id" = ra."prova_aluno_id"
        WHERE ra."id" = "resposta_anexo"."resposta_id"
          AND (pa."aluno_id" = "auth_aluno_id"() OR "is_professor_da_prova"(pa."prova_id"))
    )
);

CREATE POLICY "resposta_anexo_insert" ON "resposta_anexo"
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM "resposta_aluno" ra
        JOIN "prova_aluno" pa ON pa."id" = ra."prova_aluno_id"
        WHERE ra."id" = "resposta_anexo"."resposta_id"
          AND pa."aluno_id" = "auth_aluno_id"()
          AND pa."status" = 'em_andamento'
    )
);

CREATE POLICY "resposta_anexo_delete" ON "resposta_anexo"
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM "resposta_aluno" ra
        JOIN "prova_aluno" pa ON pa."id" = ra."prova_aluno_id"
        WHERE ra."id" = "resposta_anexo"."resposta_id"
          AND pa."aluno_id" = "auth_aluno_id"()
          AND pa."status" = 'em_andamento'
    )
);

-- Resultados, exportacoes e emails
CREATE POLICY "resultado_aluno_select" ON "resultado_aluno"
FOR SELECT TO authenticated
USING (
    "is_coordenador"()
    OR EXISTS (
        SELECT 1 FROM "prova_aluno" pa
        WHERE pa."id" = "resultado_aluno"."prova_aluno_id"
          AND ("is_professor_da_prova"(pa."prova_id") OR (pa."aluno_id" = "auth_aluno_id"() AND "resultado_aluno"."liberado" = TRUE))
    )
);

CREATE POLICY "resultado_aluno_upsert" ON "resultado_aluno"
FOR ALL TO authenticated
USING (
    "is_coordenador"()
    OR EXISTS (SELECT 1 FROM "prova_aluno" pa WHERE pa."id" = "resultado_aluno"."prova_aluno_id" AND "is_professor_da_prova"(pa."prova_id"))
)
WITH CHECK (
    "is_coordenador"()
    OR EXISTS (SELECT 1 FROM "prova_aluno" pa WHERE pa."id" = "resultado_aluno"."prova_aluno_id" AND "is_professor_da_prova"(pa."prova_id"))
);

CREATE POLICY "exportacao_resultado_select" ON "exportacao_resultado"
FOR SELECT TO authenticated
USING ("is_coordenador"() OR "is_professor_da_prova"("prova_id"));

CREATE POLICY "exportacao_resultado_insert" ON "exportacao_resultado"
FOR INSERT TO authenticated
WITH CHECK ("is_coordenador"());

CREATE POLICY "email_envio_select" ON "email_envio"
FOR SELECT TO authenticated
USING (
    "is_coordenador"()
    OR EXISTS (SELECT 1 FROM "prova_aluno" pa WHERE pa."id" = "email_envio"."prova_aluno_id" AND "is_professor_da_prova"(pa."prova_id"))
);

CREATE POLICY "email_envio_insert" ON "email_envio"
FOR INSERT TO authenticated
WITH CHECK (
    "is_coordenador"()
    OR EXISTS (SELECT 1 FROM "prova_aluno" pa WHERE pa."id" = "email_envio"."prova_aluno_id" AND "is_professor_da_prova"(pa."prova_id"))
);

CREATE POLICY "email_envio_update" ON "email_envio"
FOR UPDATE TO authenticated
USING ("is_coordenador"())
WITH CHECK ("is_coordenador"());

CREATE POLICY "avaliacao_log_select" ON "avaliacao_log"
FOR SELECT TO authenticated
USING (
    "is_coordenador"()
    OR ("prova_id" IS NOT NULL AND "is_professor_da_prova"("prova_id"))
);

CREATE POLICY "avaliacao_log_insert" ON "avaliacao_log"
FOR INSERT TO authenticated
WITH CHECK (TRUE);

-- =========================================================
-- Observacao sobre QR Code
-- =========================================================
-- O PostgreSQL/Supabase nao gera imagem de QR Code nativamente sem extensoes externas.
-- Esta migration gera automaticamente o payload do QR Code em prova.qr_code a partir de prova.url_acesso.
-- A imagem deve ser renderizada pelo backend ou frontend usando esse payload.


-- =========================================================
-- Mapeamento resumido UC -> suporte no banco
-- =========================================================
-- UC01: auth_user_id, funcoes auth_* e RLS por perfil.
-- UC02: prova.status e indice prova_filtros_index.
-- UC03: prova com campos obrigatorios titulo, modalidade, materia, turma e semestre; default rascunho.
-- UC04: questao/enunciado/alternativa com LaTeX, tipos e limites para discursiva.
-- UC05: banco de questoes por materia, tema e tipo.
-- UC06: tempo_limite_min, data_inicio, data_fim e flags de embaralhamento.
-- UC07: url_acesso unica e payload qr_code.
-- UC08: aluno sem senha com CPF e aceite de termos; policies anon para entrada.
-- UC09: resposta_aluno e resposta_anexo com JPG/PNG/PDF ate 5MB.
-- UC10: resposta_aluno.rascunho e sincronizada_em para autosave.
-- UC11: status prova_aluno enviada/corrigida e bloqueio de resposta fora de em_andamento.
-- UC12: correcao por resposta/questao e feedback.
-- UC13: funcao corrigir_objetivas_automaticamente.
-- UC14: resultado_aluno, relatorio e exportacao_resultado.
-- UC15: email_envio com status de envio.
-- UC16: avaliacao_log para analytics.
