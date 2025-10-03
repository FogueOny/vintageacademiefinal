-- ========================================
-- FIX POLICIES SUR storage.buckets
-- Le problème: les policies sur storage.objects ne suffisent pas
-- Il faut AUSSI des policies sur storage.buckets
-- ========================================

-- ÉTAPE 1: Supprimer les anciennes policies sur buckets
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'buckets'
    AND policyname LIKE '%oral%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.buckets', pol.policyname);
    RAISE NOTICE 'Policy bucket supprimée: %', pol.policyname;
  END LOOP;
END $$;

-- ÉTAPE 2: Créer les policies sur storage.buckets
-- Policy SELECT: Tout le monde peut voir que le bucket existe
CREATE POLICY "exam_oral_bucket_select_all"
ON storage.buckets
FOR SELECT
TO public
USING (id = 'exam-oral-responses');

-- ÉTAPE 3: Vérifier
SELECT 
  'Policies sur buckets' as status,
  policyname,
  cmd as operation,
  roles
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'buckets'
AND policyname LIKE '%oral%'
ORDER BY policyname;
