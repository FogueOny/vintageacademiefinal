-- Script pour corriger les politiques RLS de suppression pour les administrateurs
-- Ce script doit être exécuté dans Supabase pour permettre aux admins de supprimer des questions

-- ===== POLITIQUES POUR LA TABLE QUESTIONS =====

-- Supprimer les politiques existantes pour questions
DROP POLICY IF EXISTS "Admin peut créer des questions" ON public.questions;
DROP POLICY IF EXISTS "Admin peut modifier les questions" ON public.questions;
DROP POLICY IF EXISTS "Admin peut supprimer des questions" ON public.questions;

-- Autoriser les administrateurs à créer des questions
CREATE POLICY "Admin peut créer des questions"
  ON public.questions
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- Autoriser les administrateurs à modifier des questions
CREATE POLICY "Admin peut modifier les questions"
  ON public.questions
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- Autoriser les administrateurs à supprimer des questions
CREATE POLICY "Admin peut supprimer des questions"
  ON public.questions
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- ===== POLITIQUES POUR LA TABLE OPTIONS =====

-- Supprimer les politiques existantes pour options
DROP POLICY IF EXISTS "Admin peut créer des options" ON public.options;
DROP POLICY IF EXISTS "Admin peut modifier les options" ON public.options;
DROP POLICY IF EXISTS "Admin peut supprimer des options" ON public.options;

-- Autoriser les administrateurs à créer des options
CREATE POLICY "Admin peut créer des options"
  ON public.options
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- Autoriser les administrateurs à modifier des options
CREATE POLICY "Admin peut modifier les options"
  ON public.options
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- Autoriser les administrateurs à supprimer des options
CREATE POLICY "Admin peut supprimer des options"
  ON public.options
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- ===== POLITIQUES POUR LA TABLE QUESTION_MEDIA =====

-- Vérifier si la table question_media existe, sinon la créer
CREATE TABLE IF NOT EXISTS public.question_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'audio', 'video')),
  description TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Activer RLS pour question_media si pas déjà fait
ALTER TABLE public.question_media ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes pour question_media
DROP POLICY IF EXISTS "Tout le monde peut voir les médias des questions" ON public.question_media;
DROP POLICY IF EXISTS "Seuls les administrateurs peuvent créer des médias" ON public.question_media;
DROP POLICY IF EXISTS "Seuls les administrateurs peuvent modifier des médias" ON public.question_media;
DROP POLICY IF EXISTS "Seuls les administrateurs peuvent supprimer des médias" ON public.question_media;

-- Politique pour autoriser tout le monde à voir les médias
CREATE POLICY "Tout le monde peut voir les médias des questions"
  ON public.question_media FOR SELECT
  USING (true);

-- Politique pour autoriser les admins à créer des médias
CREATE POLICY "Seuls les administrateurs peuvent créer des médias"
  ON public.question_media FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Politique pour autoriser les admins à modifier des médias
CREATE POLICY "Seuls les administrateurs peuvent modifier des médias"
  ON public.question_media FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Politique pour autoriser les admins à supprimer des médias
CREATE POLICY "Seuls les administrateurs peuvent supprimer des médias"
  ON public.question_media FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ===== VÉRIFICATION DES POLITIQUES =====

-- Requête pour vérifier que les politiques sont bien appliquées
-- (Vous pouvez exécuter cela pour confirmer)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('questions', 'options', 'question_media')
ORDER BY tablename, cmd; 