-- Supprimer les politiques existantes pour modules
DROP POLICY IF EXISTS "Tout le monde peut voir les modules" ON public.modules;
DROP POLICY IF EXISTS "Accès modules uniquement pour utilisateurs authentifiés" ON public.modules;
DROP POLICY IF EXISTS "Admin peut modifier les modules" ON public.modules;
DROP POLICY IF EXISTS "Admin peut créer des modules" ON public.modules;
DROP POLICY IF EXISTS "Admin peut supprimer des modules" ON public.modules;

-- Recréer la politique pour modules avec accès restreint aux utilisateurs authentifiés
CREATE POLICY "Accès modules uniquement pour utilisateurs authentifiés" 
  ON public.modules 
  FOR SELECT 
  USING (auth.role() = 'authenticated');  -- Permet l'accès uniquement aux utilisateurs connectés

-- Autoriser les administrateurs à créer des modules
CREATE POLICY "Admin peut créer des modules"
  ON public.modules
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- Autoriser les administrateurs à modifier des modules
CREATE POLICY "Admin peut modifier les modules"
  ON public.modules
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- Autoriser les administrateurs à supprimer des modules
CREATE POLICY "Admin peut supprimer des modules" 
  ON public.modules
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- Supprimer les politiques existantes pour test_series
DROP POLICY IF EXISTS "Tout le monde peut voir les séries de tests" ON public.test_series;
DROP POLICY IF EXISTS "Accès séries de tests uniquement pour utilisateurs authentifiés" ON public.test_series;
DROP POLICY IF EXISTS "Admin peut créer des séries de tests" ON public.test_series;
DROP POLICY IF EXISTS "Admin peut modifier les séries de tests" ON public.test_series;
DROP POLICY IF EXISTS "Admin peut supprimer des séries de tests" ON public.test_series;

-- Recréer la politique pour test_series avec accès restreint aux utilisateurs authentifiés
CREATE POLICY "Accès séries de tests uniquement pour utilisateurs authentifiés" 
  ON public.test_series 
  FOR SELECT 
  USING (auth.role() = 'authenticated');  -- Permet l'accès uniquement aux utilisateurs connectés

-- Autoriser les administrateurs à créer des séries de tests
CREATE POLICY "Admin peut créer des séries de tests"
  ON public.test_series
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- Autoriser les administrateurs à modifier des séries de tests
CREATE POLICY "Admin peut modifier les séries de tests"
  ON public.test_series
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- Autoriser les administrateurs à supprimer des séries de tests
CREATE POLICY "Admin peut supprimer des séries de tests"
  ON public.test_series
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- Supprimer les politiques existantes pour questions
DROP POLICY IF EXISTS "Tout le monde peut voir les questions" ON public.questions;
DROP POLICY IF EXISTS "Accès questions uniquement pour utilisateurs authentifiés" ON public.questions;
DROP POLICY IF EXISTS "Admin peut créer des questions" ON public.questions;
DROP POLICY IF EXISTS "Admin peut modifier les questions" ON public.questions;
DROP POLICY IF EXISTS "Admin peut supprimer des questions" ON public.questions;

-- Recréer la politique pour questions avec accès restreint aux utilisateurs authentifiés
CREATE POLICY "Accès questions uniquement pour utilisateurs authentifiés" 
  ON public.questions 
  FOR SELECT 
  USING (auth.role() = 'authenticated');  -- Permet l'accès uniquement aux utilisateurs connectés

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

-- Supprimer les politiques existantes pour options
DROP POLICY IF EXISTS "Tout le monde peut voir les options" ON public.options;
DROP POLICY IF EXISTS "Accès options uniquement pour utilisateurs authentifiés" ON public.options;
DROP POLICY IF EXISTS "Admin peut créer des options" ON public.options;
DROP POLICY IF EXISTS "Admin peut modifier les options" ON public.options;
DROP POLICY IF EXISTS "Admin peut supprimer des options" ON public.options;

-- Recréer la politique pour options avec accès restreint aux utilisateurs authentifiés
CREATE POLICY "Accès options uniquement pour utilisateurs authentifiés" 
  ON public.options 
  FOR SELECT 
  USING (auth.role() = 'authenticated');  -- Permet l'accès uniquement aux utilisateurs connectés

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
