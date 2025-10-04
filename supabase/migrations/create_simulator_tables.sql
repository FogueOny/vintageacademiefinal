-- =========================================
-- CRÉATION DES TABLES POUR LE SIMULATEUR
-- =========================================

-- Table: simulator_responses
-- Stocke les réponses des utilisateurs au simulateur
CREATE TABLE IF NOT EXISTS public.simulator_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  combination_id UUID NOT NULL REFERENCES public.expression_ecrite_combinations(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.expression_ecrite_tasks(id) ON DELETE CASCADE,
  
  -- Réponse de l'utilisateur
  user_text TEXT NOT NULL,
  word_count INTEGER NOT NULL DEFAULT 0,
  time_spent_seconds INTEGER,
  
  -- Évaluation IA
  ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 25),
  ai_feedback TEXT,
  ai_details JSONB,
  ai_points_forts TEXT[],
  ai_points_amelioration TEXT[],
  ai_niveau_estime TEXT CHECK (ai_niveau_estime IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  ai_conseils_pratiques TEXT[],
  ai_evaluated_at TIMESTAMPTZ,
  
  -- Métadonnées
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Contrainte: un utilisateur ne peut soumettre qu'une seule réponse par tâche
  UNIQUE(user_id, task_id)
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_simulator_responses_user_id 
  ON public.simulator_responses(user_id);

CREATE INDEX IF NOT EXISTS idx_simulator_responses_combination_id 
  ON public.simulator_responses(combination_id);

CREATE INDEX IF NOT EXISTS idx_simulator_responses_task_id 
  ON public.simulator_responses(task_id);

CREATE INDEX IF NOT EXISTS idx_simulator_responses_created_at 
  ON public.simulator_responses(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_simulator_responses_ai_evaluated 
  ON public.simulator_responses(ai_evaluated_at) 
  WHERE ai_evaluated_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_simulator_responses_ai_score 
  ON public.simulator_responses(ai_score) 
  WHERE ai_score IS NOT NULL;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_simulator_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_simulator_responses_updated_at
  BEFORE UPDATE ON public.simulator_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_simulator_responses_updated_at();

-- RLS (Row Level Security)
ALTER TABLE public.simulator_responses ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leurs propres réponses
CREATE POLICY "Users can view own responses"
  ON public.simulator_responses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent créer leurs propres réponses
CREATE POLICY "Users can create own responses"
  ON public.simulator_responses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent mettre à jour leurs propres réponses
CREATE POLICY "Users can update own responses"
  ON public.simulator_responses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent supprimer leurs propres réponses
CREATE POLICY "Users can delete own responses"
  ON public.simulator_responses
  FOR DELETE
  USING (auth.uid() = user_id);

-- Commentaires
COMMENT ON TABLE public.simulator_responses IS 'Réponses des utilisateurs au simulateur Expression Écrite';
COMMENT ON COLUMN public.simulator_responses.user_text IS 'Texte rédigé par l''utilisateur';
COMMENT ON COLUMN public.simulator_responses.word_count IS 'Nombre de mots du texte';
COMMENT ON COLUMN public.simulator_responses.time_spent_seconds IS 'Temps passé en secondes';
COMMENT ON COLUMN public.simulator_responses.ai_score IS 'Score IA sur 25 points';
COMMENT ON COLUMN public.simulator_responses.ai_feedback IS 'Feedback détaillé de l''IA';
COMMENT ON COLUMN public.simulator_responses.ai_details IS 'Détails par critère (adequation, argumentation, lexique, grammaire)';
COMMENT ON COLUMN public.simulator_responses.ai_points_forts IS 'Liste des points forts identifiés par l''IA';
COMMENT ON COLUMN public.simulator_responses.ai_points_amelioration IS 'Liste des points à améliorer';
COMMENT ON COLUMN public.simulator_responses.ai_niveau_estime IS 'Niveau CECRL estimé (A1, A2, B1, B2, C1, C2)';
COMMENT ON COLUMN public.simulator_responses.ai_conseils_pratiques IS 'Conseils pratiques pour progresser';
COMMENT ON COLUMN public.simulator_responses.ai_evaluated_at IS 'Date de l''évaluation IA';

-- Vérification
SELECT 
  'Table créée avec succès' as status,
  COUNT(*) as row_count
FROM public.simulator_responses;
