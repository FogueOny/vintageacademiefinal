-- ========================================
-- DIAGNOSTIC COMPLET DU STORAGE
-- Exécutez ce script pour voir l'état actuel
-- ========================================

-- 1. Vérifier le bucket
SELECT 
  '=== BUCKET INFO ===' as section,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id = 'exam-oral-responses';

-- 2. Vérifier toutes les policies du bucket
SELECT 
  '=== POLICIES ===' as section,
  policyname,
  cmd as operation,
  roles,
  qual as using_clause,
  with_check as check_clause
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%oral%'
ORDER BY policyname;

-- 3. Vérifier les fichiers existants
SELECT 
  '=== FICHIERS ===' as section,
  name,
  bucket_id,
  owner,
  created_at,
  metadata
FROM storage.objects
WHERE bucket_id = 'exam-oral-responses'
ORDER BY created_at DESC
LIMIT 10;

-- 4. Tester les permissions pour l'utilisateur actuel
SELECT 
  '=== USER INFO ===' as section,
  auth.uid() as current_user_id,
  auth.role() as current_role,
  auth.email() as current_email;
