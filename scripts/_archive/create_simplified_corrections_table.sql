-- Script pour créer la nouvelle table expression_ecrite_corrections simplifiée
-- Date: 27 juillet 2025

-- Vérification si la fonction trigger_set_timestamp existe déjà
DO $block$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trigger_set_timestamp') THEN
    EXECUTE $$
      CREATE OR REPLACE FUNCTION trigger_set_timestamp()
      RETURNS TRIGGER AS $func$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $func$ LANGUAGE plpgsql;
    $$;
  END IF;
END $block$;

-- Suppression de l'ancienne table si elle existe
DROP TABLE IF EXISTS expression_ecrite_corrections;

-- Création de la nouvelle table simplifiée
CREATE TABLE expression_ecrite_corrections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_id UUID REFERENCES expression_ecrite_periods(id),
  combination_number INTEGER NOT NULL,
  task_number INTEGER CHECK (task_number IN (1, 2, 3)),
  task_title VARCHAR(255),
  task_description TEXT,
  task_type VARCHAR(50),
  user_id UUID NULL,
  title VARCHAR(255) NOT NULL DEFAULT 'Exemple de correction',
  content TEXT NOT NULL,
  corrector_name VARCHAR(100) DEFAULT 'EVOLUE',
  correction_type VARCHAR(50) DEFAULT 'example',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commentaires pour documentation
COMMENT ON TABLE expression_ecrite_corrections IS 'Stocke les corrections pour les tâches d''expression écrite TCF';
COMMENT ON COLUMN expression_ecrite_corrections.period_id IS 'Référence à la période';
COMMENT ON COLUMN expression_ecrite_corrections.combination_number IS 'Numéro de la combinaison dans la période';
COMMENT ON COLUMN expression_ecrite_corrections.task_number IS 'Numéro de la tâche (1, 2 ou 3)';
COMMENT ON COLUMN expression_ecrite_corrections.task_title IS 'Titre de la tâche';
COMMENT ON COLUMN expression_ecrite_corrections.task_description IS 'Description de la tâche';
COMMENT ON COLUMN expression_ecrite_corrections.task_type IS 'Type de tâche (courriel, narration, argumentation, etc.)';
COMMENT ON COLUMN expression_ecrite_corrections.user_id IS 'Identifiant de l''utilisateur associé à la correction (pour les corrections personnalisées)';
COMMENT ON COLUMN expression_ecrite_corrections.title IS 'Titre de la correction';
COMMENT ON COLUMN expression_ecrite_corrections.content IS 'Contenu textuel complet de la correction';
COMMENT ON COLUMN expression_ecrite_corrections.corrector_name IS 'Nom du correcteur ou de l''enseignant ayant réalisé la correction';
COMMENT ON COLUMN expression_ecrite_corrections.correction_type IS 'Type de correction: example, user_specific, model_answer, official, community';
COMMENT ON COLUMN expression_ecrite_corrections.is_public IS 'Si true, la correction est visible par tous les utilisateurs';

-- Index pour améliorer les performances
CREATE INDEX idx_corrections_period_id ON expression_ecrite_corrections(period_id);
CREATE INDEX idx_corrections_combination_task ON expression_ecrite_corrections(combination_number, task_number);
CREATE INDEX idx_corrections_is_public ON expression_ecrite_corrections(is_public);

-- Trigger pour la mise à jour automatique de updated_at
CREATE TRIGGER set_timestamp_corrections
BEFORE UPDATE ON expression_ecrite_corrections
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp(); 