-- Script pour créer la nouvelle table expression_ecrite_corrections
-- Date: 27 juillet 2025

-- Vérification si la fonction trigger_set_timestamp existe déjà
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trigger_set_timestamp') THEN
    CREATE OR REPLACE FUNCTION trigger_set_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  END IF;
END $$;

-- Suppression de l'ancienne table si elle existe
DROP TABLE IF EXISTS expression_ecrite_corrections;

-- Création de la nouvelle table
CREATE TABLE expression_ecrite_corrections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES expression_ecrite_tasks(id),
  combination_id UUID REFERENCES expression_ecrite_combinations(id),
  period_id UUID REFERENCES expression_ecrite_periods(id),
  user_id UUID NULL,
  title VARCHAR(255) NOT NULL DEFAULT 'Exemple de correction',
  content TEXT NOT NULL,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  feedback TEXT,
  strengths TEXT[],
  improvements TEXT[],
  corrector_name VARCHAR(100),
  correction_type VARCHAR(50) DEFAULT 'example' CHECK (correction_type IN ('example', 'user_specific', 'model_answer', 'official', 'community')),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commentaires pour documentation
COMMENT ON TABLE expression_ecrite_corrections IS 'Stocke les corrections pour les tâches d''expression écrite TCF';
COMMENT ON COLUMN expression_ecrite_corrections.task_id IS 'Référence à la tâche corrigée';
COMMENT ON COLUMN expression_ecrite_corrections.combination_id IS 'Référence à la combinaison (pour faciliter les requêtes)';
COMMENT ON COLUMN expression_ecrite_corrections.period_id IS 'Référence à la période (pour faciliter les requêtes)';
COMMENT ON COLUMN expression_ecrite_corrections.user_id IS 'Identifiant de l''utilisateur associé à la correction (pour les corrections personnalisées)';
COMMENT ON COLUMN expression_ecrite_corrections.title IS 'Titre de la correction';
COMMENT ON COLUMN expression_ecrite_corrections.content IS 'Contenu textuel complet de la correction';
COMMENT ON COLUMN expression_ecrite_corrections.score IS 'Score sur 100 pour cette correction';
COMMENT ON COLUMN expression_ecrite_corrections.feedback IS 'Commentaires généraux sur la correction';
COMMENT ON COLUMN expression_ecrite_corrections.strengths IS 'Liste des points forts de la correction';
COMMENT ON COLUMN expression_ecrite_corrections.improvements IS 'Liste des axes d''amélioration';
COMMENT ON COLUMN expression_ecrite_corrections.corrector_name IS 'Nom du correcteur ou de l''enseignant ayant réalisé la correction';
COMMENT ON COLUMN expression_ecrite_corrections.correction_type IS 'Type de correction: example, user_specific, model_answer, official, community';
COMMENT ON COLUMN expression_ecrite_corrections.is_public IS 'Si true, la correction est visible par tous les utilisateurs';

-- Index pour améliorer les performances
CREATE INDEX idx_corrections_task_id ON expression_ecrite_corrections(task_id);
CREATE INDEX idx_corrections_combination_id ON expression_ecrite_corrections(combination_id);
CREATE INDEX idx_corrections_period_id ON expression_ecrite_corrections(period_id);
CREATE INDEX idx_corrections_is_public ON expression_ecrite_corrections(is_public);

-- Trigger pour la mise à jour automatique de updated_at
CREATE TRIGGER set_timestamp_corrections
BEFORE UPDATE ON expression_ecrite_corrections
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Exemple d'insertion pour une correction
COMMENT ON TABLE expression_ecrite_corrections IS E'
Exemple d''utilisation:

-- Insertion d''une correction
INSERT INTO expression_ecrite_corrections (
  task_id, 
  combination_id, 
  period_id, 
  user_id,
  title,
  content, 
  score, 
  feedback,
  strengths, 
  improvements, 
  corrector_name,
  correction_type, 
  is_public
) VALUES (
  ''task-uuid'', 
  ''combination-uuid'', 
  ''period-uuid'', 
  NULL,
  ''Exemple de correction: Courriel professionnel'',
  ''Contenu complet de la correction avec mise en forme...'', 
  85, 
  ''Très bonne maîtrise globale du français écrit. Quelques points à améliorer sur la structure.'',
  ARRAY[''Bonne structure'', ''Vocabulaire riche'', ''Arguments clairs''], 
  ARRAY[''Améliorer les transitions'', ''Attention aux accords''], 
  ''Marie Dupont'',
  ''example'', 
  true
);';

-- Modification du script d'importation pour inclure les corrections
COMMENT ON TABLE expression_ecrite_corrections IS E'
Pour l''importation, le format SQL recommandé est:

-- Pour chaque combinaison
INSERT INTO expression_ecrite_combinations (id, period_id, ...) VALUES (...);

-- Pour chaque tâche
INSERT INTO expression_ecrite_tasks (id, combination_id, ...) VALUES (...);

-- Pour chaque correction (optionnel)
INSERT INTO expression_ecrite_corrections (task_id, combination_id, period_id, content, ...)
VALUES (''task-uuid'', ''combination-uuid'', ''period-uuid'', ''Correction...'', ...);
';