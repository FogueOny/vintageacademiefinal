-- Création de la table des profils utilisateurs (extension de auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',  -- 'user' ou 'admin'
  subscription_status TEXT DEFAULT 'inactive',
  subscription_expiry TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Créer des policies pour profiles 
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur propre profil" ON public.profiles;
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leur propre profil" ON public.profiles;
CREATE POLICY "Les utilisateurs peuvent mettre à jour leur propre profil" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Trigger pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ajouter une politique pour permettre l'insertion par le trigger
DROP POLICY IF EXISTS "Le système peut créer des profils" ON public.profiles;
CREATE POLICY "Le système peut créer des profils" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (true);  -- Permet l'insertion par le système

-- Modules 
CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'comprehension_ecrite', 'comprehension_orale', 'expression_ecrite', 'expression_orale'
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS pour modules
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- Créer des policies pour modules
DROP POLICY IF EXISTS "Tout le monde peut voir les modules" ON public.modules;
CREATE POLICY "Tout le monde peut voir les modules"
  ON public.modules
  FOR SELECT
  TO PUBLIC;

-- Séries de tests
CREATE TABLE IF NOT EXISTS public.test_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.modules NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  time_limit INTEGER NOT NULL, -- en secondes
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS pour test_series
ALTER TABLE public.test_series ENABLE ROW LEVEL SECURITY;

-- Créer des policies pour test_series
DROP POLICY IF EXISTS "Tout le monde peut voir les séries de tests" ON public.test_series;
CREATE POLICY "Tout le monde peut voir les séries de tests"
  ON public.test_series
  FOR SELECT
  TO PUBLIC;

-- Questions
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_series_id UUID REFERENCES public.test_series NOT NULL,
  question_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT, -- 'image', 'audio', 'video'
  points INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS pour questions
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Créer des policies pour questions
DROP POLICY IF EXISTS "Tout le monde peut voir les questions" ON public.questions;
CREATE POLICY "Tout le monde peut voir les questions"
  ON public.questions
  FOR SELECT
  TO PUBLIC;

-- Options (réponses possibles)
CREATE TABLE IF NOT EXISTS public.options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES public.questions NOT NULL,
  content TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  label TEXT NOT NULL, -- 'A', 'B', 'C', 'D'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS pour options
ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;

-- Créer des policies pour options
DROP POLICY IF EXISTS "Tout le monde peut voir les options" ON public.options;
CREATE POLICY "Tout le monde peut voir les options"
  ON public.options
  FOR SELECT
  TO PUBLIC;

-- Sessions de tests utilisateurs
CREATE TABLE IF NOT EXISTS public.user_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  test_series_id UUID REFERENCES public.test_series NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  score INTEGER,
  status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS pour user_tests
ALTER TABLE public.user_tests ENABLE ROW LEVEL SECURITY;

-- Créer des policies pour user_tests
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres tests" ON public.user_tests;
CREATE POLICY "Les utilisateurs peuvent voir leurs propres tests"
  ON public.user_tests
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Les utilisateurs peuvent ajouter leurs propres tests" ON public.user_tests;
CREATE POLICY "Les utilisateurs peuvent ajouter leurs propres tests"
  ON public.user_tests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leurs propres tests" ON public.user_tests;
CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres tests"
  ON public.user_tests
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Réponses des utilisateurs
CREATE TABLE IF NOT EXISTS public.user_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_test_id UUID REFERENCES public.user_tests NOT NULL,
  question_id UUID REFERENCES public.questions NOT NULL,
  selected_option_id UUID REFERENCES public.options,
  is_correct BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS pour user_answers
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;

-- Créer des policies pour user_answers
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres réponses" ON public.user_answers;
CREATE POLICY "Les utilisateurs peuvent voir leurs propres réponses"
  ON public.user_answers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tests
      WHERE user_tests.id = user_test_id
      AND user_tests.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Les utilisateurs peuvent ajouter leurs propres réponses" ON public.user_answers;
CREATE POLICY "Les utilisateurs peuvent ajouter leurs propres réponses"
  ON public.user_answers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_tests
      WHERE user_tests.id = user_test_id
      AND user_tests.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leurs propres réponses" ON public.user_answers;
CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres réponses"
  ON public.user_answers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tests
      WHERE user_tests.id = user_test_id
      AND user_tests.user_id = auth.uid()
    )
  );
