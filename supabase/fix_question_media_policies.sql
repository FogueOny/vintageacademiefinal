-- Script pour corriger les politiques RLS de question_media
-- Le problème vient du JOIN avec auth.users qui cause "permission denied for table users"

-- Supprimer les politiques existantes pour question_media
DROP POLICY IF EXISTS "Tout le monde peut voir les médias des questions" ON public.question_media;
DROP POLICY IF EXISTS "Seuls les administrateurs peuvent créer des médias" ON public.question_media;
DROP POLICY IF EXISTS "Seuls les administrateurs peuvent modifier des médias" ON public.question_media;
DROP POLICY IF EXISTS "Seuls les administrateurs peuvent supprimer des médias" ON public.question_media;

-- Recréer les politiques avec la même approche que les autres tables (sans JOIN auth.users)

-- Politique pour autoriser tout le monde à voir les médias
CREATE POLICY "Tout le monde peut voir les médias des questions"
  ON public.question_media FOR SELECT
  USING (true);

-- Politique pour autoriser les admins à créer des médias
CREATE POLICY "Seuls les administrateurs peuvent créer des médias"
  ON public.question_media FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
  );

-- Politique pour autoriser les admins à modifier des médias
CREATE POLICY "Seuls les administrateurs peuvent modifier des médias"
  ON public.question_media FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
  );

-- Politique pour autoriser les admins à supprimer des médias
CREATE POLICY "Seuls les administrateurs peuvent supprimer des médias"
  ON public.question_media FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
  );

-- Vérification des politiques
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
WHERE tablename = 'question_media'
ORDER BY cmd;