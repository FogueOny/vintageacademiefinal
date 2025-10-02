-- Schéma de base de données pour les simulateurs d'examen
-- Exécuter dans Supabase Dashboard > SQL Editor

-- Table des simulateurs d'examen
CREATE TABLE IF NOT EXISTS exam_simulators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  exam_type VARCHAR NOT NULL, -- 'tcf', 'tef', 'goethe', 'cambridge'
  level VARCHAR NOT NULL, -- 'a1', 'a2', 'b1', 'b2', 'c1', 'c2'
  total_duration INTEGER NOT NULL, -- durée totale en minutes
  description TEXT,
  instructions TEXT,
  sections JSONB NOT NULL, -- configuration des sections
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des sections d'examen
CREATE TABLE IF NOT EXISTS exam_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulator_id UUID REFERENCES exam_simulators(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL, -- 'comprehension-ecrite', 'comprehension-orale', etc.
  display_name VARCHAR NOT NULL, -- nom d'affichage
  duration INTEGER NOT NULL, -- durée en minutes
  question_count INTEGER NOT NULL,
  order_index INTEGER NOT NULL,
  instructions TEXT,
  media_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table des sessions de simulation
CREATE TABLE IF NOT EXISTS simulation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  simulator_id UUID REFERENCES exam_simulators(id) ON DELETE CASCADE,
  status VARCHAR NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  total_score INTEGER,
  section_scores JSONB, -- scores par section
  time_spent INTEGER, -- temps total en secondes
  answers JSONB, -- réponses détaillées
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des réponses de simulation
CREATE TABLE IF NOT EXISTS simulation_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES simulation_sessions(id) ON DELETE CASCADE,
  section_name VARCHAR NOT NULL,
  question_number INTEGER NOT NULL,
  answer_content TEXT,
  time_spent INTEGER, -- temps passé sur cette question en secondes
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_simulation_sessions_user_id ON simulation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_simulation_sessions_simulator_id ON simulation_sessions(simulator_id);
CREATE INDEX IF NOT EXISTS idx_simulation_sessions_status ON simulation_sessions(status);
CREATE INDEX IF NOT EXISTS idx_exam_sections_simulator_id ON exam_sections(simulator_id);
CREATE INDEX IF NOT EXISTS idx_simulation_answers_session_id ON simulation_answers(session_id);

-- Politiques RLS pour la sécurité
ALTER TABLE exam_simulators ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_answers ENABLE ROW LEVEL SECURITY;

-- Politiques pour exam_simulators (lecture publique, écriture admin)
CREATE POLICY "exam_simulators_public_select" ON exam_simulators
  FOR SELECT USING (is_active = true);

CREATE POLICY "exam_simulators_admin_insert" ON exam_simulators
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "exam_simulators_admin_update" ON exam_simulators
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Politiques pour exam_sections (lecture publique, écriture admin)
CREATE POLICY "exam_sections_public_select" ON exam_sections
  FOR SELECT USING (true);

CREATE POLICY "exam_sections_admin_insert" ON exam_sections
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Politiques pour simulation_sessions (utilisateur peut voir ses propres sessions)
CREATE POLICY "simulation_sessions_user_select" ON simulation_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "simulation_sessions_user_insert" ON simulation_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "simulation_sessions_user_update" ON simulation_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Politiques pour simulation_answers (utilisateur peut voir ses propres réponses)
CREATE POLICY "simulation_answers_user_select" ON simulation_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM simulation_sessions 
      WHERE simulation_sessions.id = simulation_answers.session_id 
      AND simulation_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "simulation_answers_user_insert" ON simulation_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM simulation_sessions 
      WHERE simulation_sessions.id = simulation_answers.session_id 
      AND simulation_sessions.user_id = auth.uid()
    )
  );

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_exam_simulators_updated_at 
  BEFORE UPDATE ON exam_simulators 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_simulation_sessions_updated_at 
  BEFORE UPDATE ON simulation_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 