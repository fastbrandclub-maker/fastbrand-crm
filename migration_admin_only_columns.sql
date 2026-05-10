-- =============================================================================
-- Migration : protéger les colonnes admin-only de student_steps
-- contre les updates anon (élèves via le portail public).
--
-- Justification :
-- RLS est désactivée sur student_steps (cf supabase_full.sql:118) pour permettre
-- les écritures du portail élève (status, student_note, resource_link via la clé
-- anonyme). Sans précaution, un élève technique peut donc aussi modifier les
-- colonnes admin-only (custom_delay_days, nb_extensions, extension_reason).
--
-- Solution : trigger BEFORE UPDATE qui bloque ces colonnes pour le rôle anon.
-- Les coachs/admins authentifiés (auth.role() = 'authenticated') passent au travers.
--
-- À exécuter dans Supabase SQL Editor (idempotent — safe à relancer).
-- =============================================================================

CREATE OR REPLACE FUNCTION enforce_admin_only_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.role() = 'anon' THEN
    IF NEW.custom_delay_days IS DISTINCT FROM OLD.custom_delay_days
       OR NEW.nb_extensions    IS DISTINCT FROM OLD.nb_extensions
       OR NEW.extension_reason IS DISTINCT FROM OLD.extension_reason THEN
      RAISE EXCEPTION 'Permission denied: only authenticated coaches can modify deadline override columns';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS step_admin_only_columns ON student_steps;
CREATE TRIGGER step_admin_only_columns
  BEFORE UPDATE ON student_steps
  FOR EACH ROW EXECUTE FUNCTION enforce_admin_only_columns();
