CREATE OR REPLACE FUNCTION "validar_prova_aluno"()
RETURNS TRIGGER AS $$
DECLARE
    v_status_prova "prova_status";
    v_data_inicio TIMESTAMPTZ;
    v_data_fim TIMESTAMPTZ;
    v_system_expiration BOOLEAN := current_setting('app.system_expiration', TRUE) = 'true';
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

    IF NEW."status" IN ('em_andamento', 'enviada') AND NOT v_system_expiration THEN
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
