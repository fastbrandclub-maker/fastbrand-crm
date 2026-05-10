-- =============================================================================
-- Migration : table step_history pour tracer les actions sur les étapes
-- À exécuter dans Supabase SQL Editor (idempotent — safe à relancer)
-- =============================================================================

CREATE TABLE IF NOT EXISTS step_history (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_step_id UUID        NOT NULL REFERENCES student_steps(id) ON DELETE CASCADE,
  action          VARCHAR(20) NOT NULL,    -- 'validated' | 'devalidated' | 'delay_changed'
  actor           VARCHAR(10) NOT NULL,    -- 'student' | 'coach'
  actor_id        UUID        NULL,        -- profile.id si coach, NULL si élève
  old_value       JSONB       NULL,
  new_value       JSONB       NULL,
  reason          TEXT        NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_step_history_step
  ON step_history(student_step_id, created_at DESC);

-- Cohérent avec student_steps qui a aussi RLS désactivé
ALTER TABLE step_history DISABLE ROW LEVEL SECURITY;
