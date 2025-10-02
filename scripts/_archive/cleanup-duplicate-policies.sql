-- Script pour nettoyer les politiques RLS en double
-- Exécuter dans Supabase Dashboard > SQL Editor

-- 1. Supprimer TOUTES les politiques existantes pour questions
DROP POLICY IF EXISTS "Accès public aux questions" ON questions;
DROP POLICY IF EXISTS "Admin peut créer des questions" ON questions;
DROP POLICY IF EXISTS "Admin peut modifier les questions" ON questions;
DROP POLICY IF EXISTS "Admin peut supprimer des questions" ON questions;
DROP POLICY IF EXISTS "Allow public read access for questions" ON questions;
DROP POLICY IF EXISTS "questions_admin_delete" ON questions;
DROP POLICY IF EXISTS "questions_admin_insert" ON questions;
DROP POLICY IF EXISTS "questions_admin_select" ON questions;
DROP POLICY IF EXISTS "questions_admin_update" ON questions;

-- 2. Supprimer TOUTES les politiques existantes pour options
DROP POLICY IF EXISTS "Accès public aux options" ON options;
DROP POLICY IF EXISTS "Admin peut créer des options" ON options;
DROP POLICY IF EXISTS "Admin peut modifier les options" ON options;
DROP POLICY IF EXISTS "Admin peut supprimer des options" ON options;
DROP POLICY IF EXISTS "Allow public read access for options" ON options;
DROP POLICY IF EXISTS "options_admin_delete" ON options;
DROP POLICY IF EXISTS "options_admin_insert" ON options;
DROP POLICY IF EXISTS "options_admin_select" ON options;
DROP POLICY IF EXISTS "options_admin_update" ON options;

-- 3. Créer des politiques cohérentes pour QUESTIONS
-- Lecture publique pour tous
CREATE POLICY "questions_public_select" ON questions
    FOR SELECT USING (true);

-- Seuls les admins peuvent créer, modifier, supprimer
CREATE POLICY "questions_admin_insert" ON questions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "questions_admin_update" ON questions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "questions_admin_delete" ON questions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 4. Créer des politiques cohérentes pour OPTIONS
-- Lecture publique pour tous
CREATE POLICY "options_public_select" ON options
    FOR SELECT USING (true);

-- Seuls les admins peuvent créer, modifier, supprimer
CREATE POLICY "options_admin_insert" ON options
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "options_admin_update" ON options
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "options_admin_delete" ON options
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 5. Vérifier que RLS est activé
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE options ENABLE ROW LEVEL SECURITY;

-- 6. Vérification finale - lister les nouvelles politiques
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies 
WHERE tablename IN ('questions', 'options')
ORDER BY tablename, cmd, policyname; 