-- Migration 003: Batch correction function for objective questions
-- Replaces the per-student loop with a set-based approach

CREATE OR REPLACE FUNCTION "corrigir_objetivas_batch"(p_prova_id UUID, p_professor_id UUID)
RETURNS TABLE(resposta_id UUID, nota NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
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
    WHERE pa."prova_id" = p_prova_id
      AND pa."status" IN ('enviada', 'corrigida')
      AND q."tipo" IN ('multipla_escolha', 'verdadeiro_falso')
      AND ra."alternativa_id" IS NOT NULL
    ON CONFLICT ("resposta_id") DO UPDATE
    SET "nota" = EXCLUDED."nota",
        "tipo" = 'automatica',
        "corrigida_em" = CURRENT_TIMESTAMP
    RETURNING "id", "nota";
END;
$$;
