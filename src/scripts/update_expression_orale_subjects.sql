-- Script de mise à jour pour la table expression_orale_subjects
-- Ce script ajoute un champ 'question' et supprime le champ 'tags'

-- 1. Ajouter la nouvelle colonne 'question'
ALTER TABLE expression_orale_subjects
ADD COLUMN question TEXT;

-- 2. Migrer les données des tags vers la question si nécessaire
-- Cette étape est optionnelle et dépend de votre cas d'usage
-- Si vous avez déjà des données et souhaitez conserver les informations des tags,
-- vous pouvez les convertir en questions ou les déplacer ailleurs

-- 3. Supprimer la colonne 'tags'
ALTER TABLE expression_orale_subjects
DROP COLUMN tags;

-- 4. Ajouter un index sur la colonne question pour optimiser les recherches textuelles
CREATE INDEX idx_expression_orale_subjects_question ON expression_orale_subjects (question);

-- Commentaires pour documenter la modification
COMMENT ON COLUMN expression_orale_subjects.question IS 'Question spécifique posée pour ce sujet d''expression orale';
