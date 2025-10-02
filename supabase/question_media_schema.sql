-- Création de la table pour gérer plusieurs médias par question
CREATE TABLE IF NOT EXISTS public.question_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'audio', 'video')),
  description TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index pour accélérer les recherches par question_id
CREATE INDEX IF NOT EXISTS question_media_question_id_idx ON public.question_media(question_id);

-- RLS pour la table question_media
ALTER TABLE public.question_media ENABLE ROW LEVEL SECURITY;

-- Politique pour autoriser tout le monde à voir les médias
CREATE POLICY "Tout le monde peut voir les médias des questions"
  ON public.question_media FOR SELECT
  USING (true);

-- Politique pour autoriser les admins à gérer les médias
CREATE POLICY "Seuls les administrateurs peuvent créer des médias"
  ON public.question_media FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM auth.users
      JOIN public.profiles ON auth.users.id = public.profiles.id
      WHERE auth.users.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Seuls les administrateurs peuvent modifier des médias"
  ON public.question_media FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM auth.users
      JOIN public.profiles ON auth.users.id = public.profiles.id
      WHERE auth.users.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Seuls les administrateurs peuvent supprimer des médias"
  ON public.question_media FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM auth.users
      JOIN public.profiles ON auth.users.id = public.profiles.id
      WHERE auth.users.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Trigger pour mettre à jour le champ updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_question_media_modtime
  BEFORE UPDATE ON public.question_media
  FOR EACH ROW
  EXECUTE PROCEDURE update_modified_column();
