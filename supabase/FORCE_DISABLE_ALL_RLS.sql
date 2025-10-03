-- ========================================
-- DÉSACTIVER COMPLÈTEMENT RLS (FORCE)
-- Cette approche désactive RLS au niveau de la table
-- ========================================

-- ÉTAPE 1: Vérifier l'état actuel de RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'storage'
AND tablename IN ('objects', 'buckets');

-- ÉTAPE 2: Supprimer TOUTES les policies (au cas où)
DO $$
DECLARE
  pol record;
BEGIN
  -- Sur storage.objects
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    RAISE NOTICE 'Dropped policy on objects: %', pol.policyname;
  END LOOP;
  
  -- Sur storage.buckets
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'buckets'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.buckets', pol.policyname);
    RAISE NOTICE 'Dropped policy on buckets: %', pol.policyname;
  END LOOP;
END $$;

-- ÉTAPE 3: DÉSACTIVER RLS sur les tables storage
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;

-- ÉTAPE 4: Mettre le bucket en public
UPDATE storage.buckets
SET public = true
WHERE id = 'exam-oral-responses';

-- ÉTAPE 5: Vérifier que RLS est bien désactivé
SELECT 
  'RLS Status' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'storage'
AND tablename IN ('objects', 'buckets');

-- ÉTAPE 6: Vérifier le bucket
SELECT 
  'Bucket Status' as info,
  id,
  name,
  public,
  file_size_limit
FROM storage.buckets
WHERE id = 'exam-oral-responses';

-- ÉTAPE 7: Compter les policies restantes
SELECT 
  'Remaining Policies' as info,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'storage';
