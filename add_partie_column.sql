-- Script SQL pour ajouter la colonne partie_number dans expression_orale_subjects
-- Avant d'exécuter ce script, assurez-vous d'avoir les droits nécessaires

-- Étape 1 : Ajouter la colonne partie_number
ALTER TABLE public.expression_orale_subjects 
ADD COLUMN IF NOT EXISTS partie_number integer NOT NULL DEFAULT 1;

-- Étape 2 : Mettre à jour l'index pour inclure partie_number
DROP INDEX IF EXISTS idx_expression_orale_subjects_task_subject;
CREATE UNIQUE INDEX IF NOT EXISTS idx_expression_orale_subjects_task_partie_subject 
ON public.expression_orale_subjects (task_id, partie_number, subject_number);

-- Étape 3 : Commentaire pour documentation
COMMENT ON COLUMN public.expression_orale_subjects.partie_number IS 'Numéro de partie (1, 2 ou 3) pour organiser les sujets par partie dans chaque tâche';

-- Étape 4 : Vérification de la structure 
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'expression_orale_subjects'
ORDER BY ordinal_position;
