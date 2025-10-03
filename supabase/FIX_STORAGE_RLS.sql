-- ========================================
-- FIX COMPLET POUR STORAGE RLS
-- À exécuter dans Supabase SQL Editor
-- ========================================

-- ÉTAPE 1: Supprimer TOUTES les policies existantes pour exam-oral-responses
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND (
      policyname LIKE '%oral%' 
      OR policyname LIKE '%exam%'
    )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    RAISE NOTICE 'Policy supprimée: %', pol.policyname;
  END LOOP;
END $$;

-- ÉTAPE 2: Créer le bucket (si n'existe pas)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exam-oral-responses', 
  'exam-oral-responses', 
  false,
  10485760, -- 10MB max
  ARRAY['audio/webm', 'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['audio/webm', 'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg'];

-- ÉTAPE 3: Créer les policies ULTRA SIMPLES (pas de vérification de dossier)
CREATE POLICY "exam_oral_insert_simple"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'exam-oral-responses');

CREATE POLICY "exam_oral_select_simple"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'exam-oral-responses');

CREATE POLICY "exam_oral_update_simple"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'exam-oral-responses')
WITH CHECK (bucket_id = 'exam-oral-responses');

CREATE POLICY "exam_oral_delete_simple"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'exam-oral-responses');

-- ÉTAPE 4: Vérifier que tout est OK
SELECT 
  'Bucket créé' as status,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'exam-oral-responses';

SELECT 
  'Policies actives' as status,
  policyname,
  cmd as operation,
  qual as using_expression,
  with_check as check_expression
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%oral%'
ORDER BY policyname;
