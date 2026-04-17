-- ============================================================
-- FASTBRAND CRM — SQL COMPLET (safe à relancer)
-- ============================================================

-- Tables de base
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  coach_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  general_notes TEXT,
  project_url TEXT, shop_url TEXT, doc_url TEXT,
  last_updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE TABLE IF NOT EXISTS student_steps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  step_number INTEGER NOT NULL CHECK (step_number BETWEEN 1 AND 9),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'validated', 'blocked')),
  notes TEXT, resource_link TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(student_id, step_number)
);
CREATE TABLE IF NOT EXISTS calls (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  coach_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  call_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_minutes INTEGER, summary TEXT, next_appointment TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE TABLE IF NOT EXISTS improvement_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  step_number INTEGER, note TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE TABLE IF NOT EXISTS resources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL, description TEXT, url TEXT,
  category TEXT DEFAULT 'general',
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL, description TEXT,
  event_date TIMESTAMPTZ NOT NULL, assigned_to TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE TABLE IF NOT EXISTS admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, content TEXT,
  category TEXT NOT NULL DEFAULT 'divers',
  type TEXT DEFAULT 'sales',
  author_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS compta_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cta_group TEXT DEFAULT 'Autre', client_name TEXT NOT NULL,
  closer TEXT, offre TEXT DEFAULT 'a_vie', prix INTEGER DEFAULT 0,
  date_paiement DATE, paiement_recu NUMERIC DEFAULT 0,
  restant_du NUMERIC DEFAULT 0, frais_closer NUMERIC DEFAULT 0,
  net_apres_frais NUMERIC DEFAULT 0, moyen_paiement TEXT,
  frais_paiement NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS compta_frais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL, montant NUMERIC NOT NULL,
  date_frais DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT DEFAULT 'autre',
  author_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS student_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  step_number INTEGER,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'update',
  link_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_by_coach BOOLEAN DEFAULT FALSE
);

-- Colonnes supplémentaires
ALTER TABLE students ALTER COLUMN email DROP NOT NULL;
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_email_key;
ALTER TABLE students ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS has_litige BOOLEAN DEFAULT FALSE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS litige_description TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS offre TEXT DEFAULT 'indetermine';
ALTER TABLE students ADD COLUMN IF NOT EXISTS montant_collecte INTEGER DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS montant_restant INTEGER DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS student_token UUID DEFAULT gen_random_uuid();
ALTER TABLE student_steps ADD COLUMN IF NOT EXISTS student_note TEXT;
ALTER TABLE student_messages ADD COLUMN IF NOT EXISTS link_url TEXT;
ALTER TABLE compta_entries ADD COLUMN IF NOT EXISTS paye_closer BOOLEAN DEFAULT FALSE;
ALTER TABLE compta_entries ADD COLUMN IF NOT EXISTS paye_coach BOOLEAN DEFAULT FALSE;
ALTER TABLE compta_entries ADD COLUMN IF NOT EXISTS frais_coach NUMERIC;
ALTER TABLE compta_entries ADD COLUMN IF NOT EXISTS coach TEXT;
ALTER TABLE admin_notes ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'sales';

-- Générer les tokens manquants
UPDATE students SET student_token = gen_random_uuid() WHERE student_token IS NULL;

-- RLS
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_steps DISABLE ROW LEVEL SECURITY;
ALTER TABLE calls DISABLE ROW LEVEL SECURITY;
ALTER TABLE improvement_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE compta_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE compta_frais ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage admin_notes" ON admin_notes;
DROP POLICY IF EXISTS "Admins manage compta_entries" ON compta_entries;
DROP POLICY IF EXISTS "Admins manage compta_frais" ON compta_frais;
DROP POLICY IF EXISTS "student_messages_all" ON student_messages;

CREATE POLICY "Admins manage admin_notes" ON admin_notes FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins manage compta_entries" ON compta_entries FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins manage compta_frais" ON compta_frais FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "student_messages_all" ON student_messages FOR ALL USING (true) WITH CHECK (true);

-- Triggers
CREATE OR REPLACE FUNCTION create_student_steps()
RETURNS TRIGGER AS $$
DECLARE i INTEGER;
BEGIN
  FOR i IN 1..9 LOOP
    INSERT INTO student_steps (student_id, step_number, status) VALUES (NEW.id, i, 'todo');
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_student_created ON students;
CREATE TRIGGER on_student_created
  AFTER INSERT ON students FOR EACH ROW EXECUTE FUNCTION create_student_steps();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), 'coach', NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonctions portail élève
CREATE OR REPLACE FUNCTION get_portal_data(p_token uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_student_id uuid; result json;
BEGIN
  SELECT id INTO v_student_id FROM students WHERE student_token = p_token;
  IF v_student_id IS NULL THEN RETURN NULL; END IF;
  SELECT json_build_object(
    'student', (SELECT row_to_json(s) FROM (SELECT id, first_name, last_name, offre, start_date FROM students WHERE id = v_student_id) s),
    'steps', (SELECT json_agg(row_to_json(st) ORDER BY st.step_number) FROM student_steps st WHERE student_id = v_student_id),
    'messages', (SELECT json_agg(m) FROM (SELECT * FROM student_messages WHERE student_id = v_student_id ORDER BY created_at DESC LIMIT 20) m)
  ) INTO result;
  RETURN result;
END;$$;

CREATE OR REPLACE FUNCTION portal_add_message(p_token uuid, p_message text, p_type text DEFAULT 'update', p_step_number integer DEFAULT NULL, p_link_url text DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_student_id uuid;
BEGIN
  SELECT id INTO v_student_id FROM students WHERE student_token = p_token;
  IF v_student_id IS NULL THEN RETURN false; END IF;
  INSERT INTO student_messages (student_id, step_number, message, type, link_url)
  VALUES (v_student_id, p_step_number, p_message, p_type, p_link_url);
  UPDATE students SET last_updated_at = now() WHERE id = v_student_id;
  RETURN true;
END;$$;

CREATE OR REPLACE FUNCTION mark_messages_read(p_student_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE student_messages SET read_by_coach = true
  WHERE student_id = p_student_id AND read_by_coach = false;
END;$$;

-- Admins
UPDATE profiles SET role = 'admin' WHERE email = 'lilian.lapie311@gmail.com';
UPDATE profiles SET role = 'admin', full_name = 'Selim Amrani' WHERE email = 'selim.amrani007@gmail.com';
