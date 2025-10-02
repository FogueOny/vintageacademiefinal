-- Script pour corriger l'accès à la table test_series
-- Exécuter ce script dans l'interface SQL de Supabase

-- 1. Vérifier l'activation de RLS sur la table
SELECT relname as "Table",
       CASE WHEN relrowsecurity THEN 'Active' ELSE 'Inactive' END as "RLS",
       relowner::regrole as "Owner"
FROM pg_class
WHERE relname = 'test_series';

-- 2. Afficher les politiques existantes pour test_series
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
WHERE tablename = 'test_series';

-- 3. Supprimer toutes les politiques existantes pour test_series
DROP POLICY IF EXISTS "Tout le monde peut voir les séries de tests" ON public.test_series;
DROP POLICY IF EXISTS "Accès séries de tests uniquement pour utilisateurs authentifiés" ON public.test_series;
DROP POLICY IF EXISTS "Admin peut créer des séries de tests" ON public.test_series;
DROP POLICY IF EXISTS "Admin peut modifier les séries de tests" ON public.test_series;
DROP POLICY IF EXISTS "Admin peut supprimer des séries de tests" ON public.test_series;

-- 4. S'assurer que RLS est activé (c'est généralement la cause des problèmes)
ALTER TABLE public.test_series ENABLE ROW LEVEL SECURITY;

-- 5. Recréer les politiques avec un accès plus permissif pour le débogage
-- D'abord une politique qui permet à TOUS les utilisateurs authentifiés de voir les séries de tests
CREATE POLICY "Tous les utilisateurs peuvent voir les séries de tests" 
  ON public.test_series 
  FOR SELECT 
  USING (true);  -- Permet l'accès à tout le monde

-- 6. Autoriser les administrateurs à créer/modifier/supprimer
CREATE POLICY "Admin peut gérer les séries de tests"
  ON public.test_series
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 7. Après avoir exécuté ce script, vous devriez pouvoir accéder aux données
-- Si vous avez toujours des problèmes, vérifiez:
-- - Que vous êtes bien authentifié
-- - Que votre rôle est correctement défini dans la table profiles
-- - Qu'il y a effectivement des données dans la table test_series
