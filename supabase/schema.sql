-- ============================================================
-- FastBrand Club CRM — Schéma Supabase
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (étend auth.users)
-- ============================================================
CREATE TABLE profiles (
  id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email      TEXT NOT NULL,
  full_name  TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'coach'
             CHECK (role IN ('admin', 'coach', 'assistant')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Crée automatiquement un profil à l'inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'coach')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- STUDENTS
-- ============================================================
CREATE TABLE students (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  phone           TEXT,
  start_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  coach_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  general_notes   TEXT,
  project_url     TEXT,
  shop_url        TEXT,
  doc_url         TEXT,
  last_updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- STUDENT STEPS (9 étapes par élève)
-- ============================================================
CREATE TABLE student_steps (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id   UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  step_number  INTEGER NOT NULL CHECK (step_number BETWEEN 1 AND 9),
  status       TEXT NOT NULL DEFAULT 'todo'
               CHECK (status IN ('todo', 'in_progress', 'validated', 'blocked')),
  notes        TEXT,
  resource_link TEXT,
  updated_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(student_id, step_number)
);

-- ============================================================
-- CALLS HISTORY
-- ============================================================
CREATE TABLE calls (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id       UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  coach_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  call_date        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_minutes INTEGER CHECK (duration_minutes > 0),
  summary          TEXT,
  next_appointment TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- IMPROVEMENT NOTES
-- ============================================================
CREATE TABLE improvement_notes (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id   UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  step_number  INTEGER CHECK (step_number BETWEEN 1 AND 9),
  note         TEXT NOT NULL,
  author_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- TRIGGERS — met à jour last_updated_at automatiquement
-- ============================================================
CREATE OR REPLACE FUNCTION update_student_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE students SET last_updated_at = NOW() WHERE id = NEW.student_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_step_updates_student
  AFTER INSERT OR UPDATE ON student_steps
  FOR EACH ROW EXECUTE FUNCTION update_student_last_updated();

CREATE TRIGGER trg_call_updates_student
  AFTER INSERT ON calls
  FOR EACH ROW EXECUTE FUNCTION update_student_last_updated();

CREATE TRIGGER trg_note_updates_student
  AFTER INSERT ON improvement_notes
  FOR EACH ROW EXECUTE FUNCTION update_student_last_updated();

-- ============================================================
-- TRIGGER — crée les 9 étapes automatiquement à la création d'un élève
-- ============================================================
CREATE OR REPLACE FUNCTION create_student_steps()
RETURNS TRIGGER AS $$
DECLARE i INTEGER;
BEGIN
  FOR i IN 1..9 LOOP
    INSERT INTO student_steps (student_id, step_number, status)
    VALUES (NEW.id, i, 'todo');
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_student_created
  AFTER INSERT ON students
  FOR EACH ROW EXECUTE FUNCTION create_student_steps();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE students         ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_steps    ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls            ENABLE ROW LEVEL SECURITY;
ALTER TABLE improvement_notes ENABLE ROW LEVEL SECURITY;

-- Helper : rôle de l'utilisateur connecté
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- STUDENTS
CREATE POLICY "students_select" ON students
  FOR SELECT USING (
    get_user_role() IN ('admin', 'assistant')
    OR coach_id = auth.uid()
  );

CREATE POLICY "students_insert" ON students
  FOR INSERT WITH CHECK (get_user_role() IN ('admin', 'coach'));

CREATE POLICY "students_update" ON students
  FOR UPDATE USING (
    get_user_role() = 'admin' OR coach_id = auth.uid()
  );

CREATE POLICY "students_delete" ON students
  FOR DELETE USING (get_user_role() = 'admin');

-- STUDENT_STEPS
CREATE POLICY "steps_select" ON student_steps
  FOR SELECT USING (
    get_user_role() IN ('admin', 'assistant')
    OR EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_steps.student_id
        AND (s.coach_id = auth.uid() OR get_user_role() = 'admin')
    )
  );

CREATE POLICY "steps_write" ON student_steps
  FOR ALL USING (
    get_user_role() IN ('admin', 'assistant')
    OR EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_steps.student_id
        AND s.coach_id = auth.uid()
    )
  );

-- CALLS
CREATE POLICY "calls_select" ON calls
  FOR SELECT USING (
    get_user_role() IN ('admin', 'assistant')
    OR coach_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = calls.student_id AND s.coach_id = auth.uid()
    )
  );

CREATE POLICY "calls_insert" ON calls
  FOR INSERT WITH CHECK (get_user_role() IN ('admin', 'coach'));

CREATE POLICY "calls_manage" ON calls
  FOR ALL USING (
    get_user_role() = 'admin' OR coach_id = auth.uid()
  );

-- IMPROVEMENT_NOTES
CREATE POLICY "notes_select" ON improvement_notes
  FOR SELECT USING (
    get_user_role() IN ('admin', 'assistant')
    OR author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = improvement_notes.student_id AND s.coach_id = auth.uid()
    )
  );

CREATE POLICY "notes_insert" ON improvement_notes
  FOR INSERT WITH CHECK (get_user_role() IN ('admin', 'coach'));

CREATE POLICY "notes_delete" ON improvement_notes
  FOR DELETE USING (
    get_user_role() = 'admin' OR author_id = auth.uid()
  );

-- ============================================================
-- DONNÉES INITIALES : créer les comptes admin manuellement
-- dans Supabase Auth, puis mettre à jour leur rôle ici :
-- UPDATE profiles SET role = 'admin' WHERE email IN ('selim@...', 'lilian@...');
-- UPDATE profiles SET role = 'assistant' WHERE email = 'ronaldo@...';
-- ============================================================
