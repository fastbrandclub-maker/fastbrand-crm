-- =============================================================================
-- Migration : système de deadlines par étape
-- À exécuter dans Supabase SQL Editor (idempotent — safe à relancer)
-- =============================================================================

-- 1. Nouvelles colonnes student_steps
ALTER TABLE student_steps ADD COLUMN IF NOT EXISTS started_at        TIMESTAMPTZ;
ALTER TABLE student_steps ADD COLUMN IF NOT EXISTS deadline_at       TIMESTAMPTZ;
ALTER TABLE student_steps ADD COLUMN IF NOT EXISTS custom_delay_days INTEGER;
ALTER TABLE student_steps ADD COLUMN IF NOT EXISTS validated_at      TIMESTAMPTZ;
ALTER TABLE student_steps ADD COLUMN IF NOT EXISTS validated_by      VARCHAR(10);
ALTER TABLE student_steps ADD COLUMN IF NOT EXISTS nb_extensions     INTEGER NOT NULL DEFAULT 0;
ALTER TABLE student_steps ADD COLUMN IF NOT EXISTS extension_reason  TEXT;

-- 2. program_end_date sur students (nullable — offres résultats/indéterminé sans fin fixe)
ALTER TABLE students ADD COLUMN IF NOT EXISTS program_end_date TIMESTAMPTZ;

-- 3. Backfill program_end_date selon l'offre (idempotent : ne touche que les NULL)
UPDATE students SET program_end_date = start_date + INTERVAL '70 days'
  WHERE offre = '70_jours'  AND program_end_date IS NULL AND start_date IS NOT NULL;
UPDATE students SET program_end_date = start_date + INTERVAL '6 months'
  WHERE offre = '6_mois'    AND program_end_date IS NULL AND start_date IS NOT NULL;
UPDATE students SET program_end_date = start_date + INTERVAL '12 months'
  WHERE offre = '12_mois'   AND program_end_date IS NULL AND start_date IS NOT NULL;

-- 4. Backfill validated_at sur les étapes déjà validées (best effort = updated_at)
UPDATE student_steps
   SET validated_at = updated_at, validated_by = 'coach'
 WHERE status = 'validated' AND validated_at IS NULL;

-- 5. Backfill started_at sur les étapes en cours (best effort = updated_at)
UPDATE student_steps
   SET started_at = updated_at
 WHERE status = 'in_progress' AND started_at IS NULL;

-- 6. Mise à jour du trigger : à la création d'un élève, l'étape 1 démarre tout de suite
CREATE OR REPLACE FUNCTION create_student_steps()
RETURNS TRIGGER AS $$
DECLARE
  i INTEGER;
BEGIN
  FOR i IN 1..9 LOOP
    IF i = 1 THEN
      -- Étape 1 = call d'onboarding, démarre immédiatement (pas de timer mais started_at posé)
      INSERT INTO student_steps (student_id, step_number, status, started_at)
      VALUES (NEW.id, i, 'in_progress', now());
    ELSE
      INSERT INTO student_steps (student_id, step_number, status)
      VALUES (NEW.id, i, 'todo');
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Mise à jour du RPC get_portal_data pour inclure program_end_date
DROP FUNCTION IF EXISTS get_portal_data(uuid);
CREATE FUNCTION get_portal_data(p_token uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_student_id uuid;
  result json;
BEGIN
  SELECT id INTO v_student_id FROM students WHERE student_token = p_token;
  IF v_student_id IS NULL THEN RETURN NULL; END IF;
  SELECT json_build_object(
    'student', (SELECT row_to_json(s) FROM (
      SELECT id, first_name, last_name, offre, start_date, program_end_date
      FROM students WHERE id = v_student_id
    ) s),
    'steps', (SELECT json_agg(row_to_json(st) ORDER BY st.step_number)
              FROM student_steps st WHERE student_id = v_student_id),
    'messages', (SELECT json_agg(m) FROM (
      SELECT * FROM student_messages
      WHERE student_id = v_student_id
      ORDER BY created_at DESC
      LIMIT 20
    ) m)
  ) INTO result;
  RETURN result;
END;
$$;
