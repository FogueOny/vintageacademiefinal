-- Script pour initialiser le bucket de stockage et les politiques
-- À exécuter dans la console SQL de Supabase

-- Supprimer le bucket s'il existe déjà (optionnel, à décommenter si nécessaire)
-- SELECT storage.delete_bucket('questions-media');

-- Créer le bucket pour les médias des questions
SELECT storage.create_bucket(
  'questions-media',
  'Media files for questions', 
  public => true, 
  file_size_limit => 10485760 -- 10 MB
);

-- Politiques pour permettre aux utilisateurs authentifiés de lire les fichiers
CREATE POLICY "Tout le monde peut voir les médias des questions" 
  ON storage.objects FOR SELECT
  USING (bucket_id = 'questions-media');
  
-- Politique pour permettre aux administrateurs d'insérer des fichiers
CREATE POLICY "Seuls les administrateurs peuvent uploader des fichiers" 
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'questions-media' 
    AND (EXISTS (
      SELECT 1 
      FROM auth.users 
      JOIN public.profiles ON auth.users.id = public.profiles.id 
      WHERE auth.users.id = auth.uid() 
      AND profiles.role = 'admin'
    ))
  );
  
-- Politique pour permettre aux administrateurs de mettre à jour des fichiers
CREATE POLICY "Seuls les administrateurs peuvent modifier des fichiers" 
  ON storage.objects FOR UPDATE
  WITH CHECK (
    bucket_id = 'questions-media' 
    AND (EXISTS (
      SELECT 1 
      FROM auth.users 
      JOIN public.profiles ON auth.users.id = public.profiles.id 
      WHERE auth.users.id = auth.uid() 
      AND profiles.role = 'admin'
    ))
  );
  
-- Politique pour permettre aux administrateurs de supprimer des fichiers
CREATE POLICY "Seuls les administrateurs peuvent supprimer des fichiers" 
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'questions-media' 
    AND (EXISTS (
      SELECT 1 
      FROM auth.users 
      JOIN public.profiles ON auth.users.id = public.profiles.id 
      WHERE auth.users.id = auth.uid() 
      AND profiles.role = 'admin'
    ))
  );
