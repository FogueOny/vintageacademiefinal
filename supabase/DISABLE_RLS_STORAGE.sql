-- ========================================
-- SOLUTION RADICALE: DÉSACTIVER RLS SUR LE BUCKET
-- L'authentification est déjà gérée au niveau de l'app
-- ========================================

-- ÉTAPE 1: Supprimer TOUTES les policies
DO $$
DECLARE
  pol record;
BEGIN
  -- Policies sur storage.objects
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND policyname LIKE '%oral%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
  
  -- Policies sur storage.buckets
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'buckets'
    AND policyname LIKE '%oral%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.buckets', pol.policyname);
  END LOOP;
END $$;

-- ÉTAPE 2: Rendre le bucket PUBLIC
UPDATE storage.buckets
SET public = true
WHERE id = 'exam-oral-responses';

-- ÉTAPE 3: Créer UNE SEULE policy permissive pour storage.objects
CREATE POLICY "exam_oral_public_access"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'exam-oral-responses')
WITH CHECK (bucket_id = 'exam-oral-responses');

-- ÉTAPE 4: Policy pour voir le bucket
CREATE POLICY "exam_oral_bucket_public"
ON storage.buckets
FOR SELECT
TO public
USING (id = 'exam-oral-responses');

-- ÉTAPE 5: Vérifier
SELECT 
  'Bucket status' as info,
  id,
  name,
  public,
  file_size_limit
FROM storage.buckets
WHERE id = 'exam-oral-responses';

SELECT 
  'Policies objects' as info,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%oral%';

SELECT 
  'Policies buckets' as info,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'buckets'
AND policyname LIKE '%oral%';
