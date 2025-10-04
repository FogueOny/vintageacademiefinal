-- Migration: Ajouter les champs IA à simulator_responses
-- Date: 2025-01-04

-- Ajouter les colonnes pour l'évaluation IA
ALTER TABLE public.simulator_responses
  ADD COLUMN IF NOT EXISTS ai_score INTEGER,
  ADD COLUMN IF NOT EXISTS ai_feedback TEXT,
  ADD COLUMN IF NOT EXISTS ai_details JSONB,
  ADD COLUMN IF NOT EXISTS ai_points_forts TEXT[],
  ADD COLUMN IF NOT EXISTS ai_points_amelioration TEXT[],
  ADD COLUMN IF NOT EXISTS ai_niveau_estime TEXT,
  ADD COLUMN IF NOT EXISTS ai_conseils_pratiques TEXT[],
  ADD COLUMN IF NOT EXISTS ai_evaluated_at TIMESTAMPTZ;

-- Ajouter des commentaires
COMMENT ON COLUMN public.simulator_responses.ai_score IS 'Score IA sur 25 points';
COMMENT ON COLUMN public.simulator_responses.ai_feedback IS 'Feedback détaillé de l''IA';
COMMENT ON COLUMN public.simulator_responses.ai_details IS 'Détails par critère (adequation, argumentation, lexique, grammaire)';
COMMENT ON COLUMN public.simulator_responses.ai_points_forts IS 'Liste des points forts identifiés par l''IA';
COMMENT ON COLUMN public.simulator_responses.ai_points_amelioration IS 'Liste des points à améliorer';
COMMENT ON COLUMN public.simulator_responses.ai_niveau_estime IS 'Niveau CECRL estimé (A1, A2, B1, B2, C1, C2)';
COMMENT ON COLUMN public.simulator_responses.ai_conseils_pratiques IS 'Conseils pratiques pour progresser';
COMMENT ON COLUMN public.simulator_responses.ai_evaluated_at IS 'Date de l''évaluation IA';

-- Créer un index pour les recherches par évaluation IA
CREATE INDEX IF NOT EXISTS idx_simulator_responses_ai_evaluated 
  ON public.simulator_responses(ai_evaluated_at) 
  WHERE ai_evaluated_at IS NOT NULL;

-- Créer un index pour les recherches par score
CREATE INDEX IF NOT EXISTS idx_simulator_responses_ai_score 
  ON public.simulator_responses(ai_score) 
  WHERE ai_score IS NOT NULL;
