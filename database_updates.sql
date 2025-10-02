-- Script SQL pour ajouter les nouveaux champs pour les tests écrits
-- À exécuter dans l'éditeur SQL de Supabase

-- Ajouter les nouvelles colonnes à la table questions
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS speaker_name TEXT,
ADD COLUMN IF NOT EXISTS question_text TEXT,
ADD COLUMN IF NOT EXISTS context_text TEXT;

-- Ajouter des commentaires pour documenter les colonnes
COMMENT ON COLUMN questions.speaker_name IS 'Nom de la personne qui parle (pour tests écrits) - affiché en italique';
COMMENT ON COLUMN questions.question_text IS 'Texte spécifique de la question (pour tests écrits) - affiché en gras';
COMMENT ON COLUMN questions.context_text IS 'Texte de contexte supplémentaire (pour tests écrits)';

-- Vérifier que les colonnes ont été ajoutées
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'questions' 
AND column_name IN ('speaker_name', 'question_text', 'context_text');
