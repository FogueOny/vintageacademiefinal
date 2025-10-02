-- Script pour permettre l'accès public aux tests tout en gardant les restrictions admin
-- Ce script corrige le problème 406 en permettant aux utilisateurs non connectés de voir les modules et tests

-- ===== POLITIQUES POUR LA TABLE MODULES =====

-- Supprimer les politiques restrictives pour modules
DROP POLICY IF EXISTS "Accès modules uniquement pour utilisateurs authentifiés" ON public.modules;
DROP POLICY IF EXISTS "Tout le monde peut voir les modules" ON public.modules;

-- Permettre à tout le monde de voir les modules (utilisateurs connectés ET non connectés)
CREATE POLICY "Accès public aux modules"
  ON public.modules
  FOR SELECT
  TO PUBLIC
  USING (true);

-- Garder les politiques admin pour la gestion des modules
-- (Ces politiques existent déjà dans fix_rls_policies.sql)

-- ===== POLITIQUES POUR LA TABLE TEST_SERIES =====

-- Supprimer les politiques restrictives pour test_series
DROP POLICY IF EXISTS "Accès séries de tests uniquement pour utilisateurs authentifiés" ON public.test_series;
DROP POLICY IF EXISTS "Tout le monde peut voir les séries de tests" ON public.test_series;

-- Permettre à tout le monde de voir les séries de tests
CREATE POLICY "Accès public aux séries de tests"
  ON public.test_series
  FOR SELECT
  TO PUBLIC
  USING (true);

-- ===== POLITIQUES POUR LA TABLE QUESTIONS =====

-- Supprimer les politiques restrictives pour questions
DROP POLICY IF EXISTS "Accès questions uniquement pour utilisateurs authentifiés" ON public.questions;
DROP POLICY IF EXISTS "Tout le monde peut voir les questions" ON public.questions;

-- Permettre à tout le monde de voir les questions
CREATE POLICY "Accès public aux questions"
  ON public.questions
  FOR SELECT
  TO PUBLIC
  USING (true);

-- ===== POLITIQUES POUR LA TABLE OPTIONS =====

-- Supprimer les politiques restrictives pour options
DROP POLICY IF EXISTS "Accès options uniquement pour utilisateurs authentifiés" ON public.options;
DROP POLICY IF EXISTS "Tout le monde peut voir les options" ON public.options;

-- Permettre à tout le monde de voir les options
CREATE POLICY "Accès public aux options"
  ON public.options
  FOR SELECT
  TO PUBLIC
  USING (true);

-- ===== POLITIQUES POUR LA TABLE QUESTION_MEDIA =====

-- S'assurer que les médias sont accessibles publiquement
DROP POLICY IF EXISTS "Tout le monde peut voir les médias des questions" ON public.question_media;

-- Permettre à tout le monde de voir les médias
CREATE POLICY "Accès public aux médias des questions"
  ON public.question_media
  FOR SELECT
  TO PUBLIC
  USING (true);

-- ===== RÉSUMÉ DES POLITIQUES =====

-- Vérification des politiques appliquées
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
WHERE tablename IN ('modules', 'test_series', 'questions', 'options', 'question_media')
  AND cmd = 'SELECT'
ORDER BY tablename, policyname; 