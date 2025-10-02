-- Ajouter le champ is_free à la table test_series
ALTER TABLE public.test_series 
ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false;

-- Mettre à jour les séries existantes pour qu'elles soient gratuites par défaut
-- Vous pouvez ajuster cette logique selon vos besoins
UPDATE public.test_series 
SET is_free = true 
WHERE name ILIKE '%gratuit%' OR name ILIKE '%free%' OR description ILIKE '%gratuit%';

-- Ajouter un commentaire pour documenter le champ
COMMENT ON COLUMN public.test_series.is_free IS 'Indique si le test est gratuit et accessible sans inscription'; 