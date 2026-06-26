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
