-- Script pour corriger les politiques RLS des questions
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Supprimer les anciennes politiques problématiques
DROP POLICY IF EXISTS "questions_select_policy" ON questions;
DROP POLICY IF EXISTS "questions_insert_policy" ON questions;
DROP POLICY IF EXISTS "questions_update_policy" ON questions;
DROP POLICY IF EXISTS "questions_delete_policy" ON questions;

-- 2. Créer de nouvelles politiques pour les admins

-- Politique de lecture (SELECT) - Admins seulement
CREATE POLICY "questions_admin_select" ON questions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Politique d'insertion (INSERT) - Admins seulement
CREATE POLICY "questions_admin_insert" ON questions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Politique de mise à jour (UPDATE) - Admins seulement
CREATE POLICY "questions_admin_update" ON questions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Politique de suppression (DELETE) - Admins seulement
CREATE POLICY "questions_admin_delete" ON questions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 3. Faire la même chose pour la table options
DROP POLICY IF EXISTS "options_select_policy" ON options;
DROP POLICY IF EXISTS "options_insert_policy" ON options;
DROP POLICY IF EXISTS "options_update_policy" ON options;
DROP POLICY IF EXISTS "options_delete_policy" ON options;

-- Politiques pour les options
CREATE POLICY "options_admin_select" ON options
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "options_admin_insert" ON options
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "options_admin_update" ON options
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "options_admin_delete" ON options
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 4. Vérifier que RLS est activé
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE options ENABLE ROW LEVEL SECURITY;

-- 5. Afficher les politiques créées
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('questions', 'options')
ORDER BY tablename, policyname; 