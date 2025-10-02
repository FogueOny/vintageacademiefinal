-- Vérifier d'abord si le module expression-orale existe déjà
INSERT INTO modules (name, slug, description)
SELECT 'Expression Orale', 'expression-orale', 'Module de test pour l''expression orale au TCF'
WHERE NOT EXISTS (
    SELECT 1 FROM modules WHERE slug = 'expression-orale'
);

-- Ajouter au moins une série de test pour ce module
-- On récupère d'abord l'ID du module qu'on vient d'insérer ou qui existait déjà
DO $$
DECLARE
    module_id UUID;
BEGIN
    SELECT id INTO module_id FROM modules WHERE slug = 'expression-orale';
    
    -- Vérifier si une série de test existe déjà pour ce module  Je remarque que tu li les question 
    IF NOT EXISTS (SELECT 1 FROM test_series WHERE module_id = module_id) THEN
        INSERT INTO test_series (name, description, slug, time_limit, module_id)
        VALUES ('Expression Orale - Série 1', 'Série de test pour l''expression orale', 'eo-serie-1', 900, module_id);
    END IF;
END $$;
