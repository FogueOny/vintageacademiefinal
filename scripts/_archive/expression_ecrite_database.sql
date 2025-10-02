-- Script SQL pour créer les tables des sujets Expression Écrite TCF
-- À exécuter dans l'éditeur SQL de Supabase

-- Table principale pour les périodes (mois/année)
CREATE TABLE IF NOT EXISTS expression_ecrite_periods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    month TEXT NOT NULL, -- 'janvier', 'fevrier', etc.
    year INTEGER NOT NULL,
    slug TEXT NOT NULL UNIQUE, -- 'janvier-2025', 'fevrier-2025', etc.
    title TEXT NOT NULL, -- 'Sujets Expression Écrite - Janvier 2025'
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    total_combinations INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_month_year UNIQUE (month, year)
);

-- Table pour les combinaisons de sujets
CREATE TABLE IF NOT EXISTS expression_ecrite_combinations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    period_id UUID NOT NULL REFERENCES expression_ecrite_periods(id) ON DELETE CASCADE,
    combination_number INTEGER NOT NULL, -- 1, 2, 3, etc.
    title TEXT, -- Titre optionnel pour la combinaison
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_combination_per_period UNIQUE (period_id, combination_number)
);

-- Table pour les tâches individuelles
CREATE TABLE IF NOT EXISTS expression_ecrite_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    combination_id UUID NOT NULL REFERENCES expression_ecrite_combinations(id) ON DELETE CASCADE,
    task_number INTEGER NOT NULL CHECK (task_number IN (1, 2, 3)), -- Tâche 1, 2 ou 3
    title TEXT NOT NULL, -- Titre de la tâche
    description TEXT NOT NULL, -- Description complète de la tâche
    word_count_min INTEGER, -- Nombre de mots minimum
    word_count_max INTEGER, -- Nombre de mots maximum
    task_type TEXT NOT NULL, -- 'courriel', 'blog', 'argumentation', etc.
    duration_minutes INTEGER, -- Durée recommandée en minutes
    difficulty_level TEXT DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced'
    instructions TEXT, -- Instructions spécifiques
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_task_per_combination UNIQUE (combination_id, task_number)
);

-- Table pour les documents de référence (principalement pour Tâche 3)
CREATE TABLE IF NOT EXISTS expression_ecrite_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES expression_ecrite_tasks(id) ON DELETE CASCADE,
    document_number INTEGER NOT NULL, -- Document 1, Document 2, etc.
    title TEXT NOT NULL, -- Titre du document
    content TEXT NOT NULL, -- Contenu du document
    source TEXT, -- Source du document (optionnel)
    document_type TEXT DEFAULT 'reference', -- 'reference', 'example', 'support'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les corrections et évaluations
CREATE TABLE IF NOT EXISTS expression_ecrite_corrections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES expression_ecrite_tasks(id) ON DELETE CASCADE,
    user_id UUID, -- Référence vers l'utilisateur (optionnel pour corrections génériques)
    correction_type TEXT DEFAULT 'example', -- 'example', 'user_specific', 'model_answer'
    title TEXT NOT NULL, -- Titre de la correction
    content TEXT NOT NULL, -- Contenu de la correction
    score INTEGER CHECK (score >= 0 AND score <= 20), -- Score sur 20
    feedback TEXT, -- Commentaires détaillés
    strengths TEXT[], -- Points forts (array)
    improvements TEXT[], -- Points à améliorer (array)
    corrector_name TEXT, -- Nom du correcteur
    is_public BOOLEAN DEFAULT false, -- Visible publiquement ou non
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les statistiques et métriques
CREATE TABLE IF NOT EXISTS expression_ecrite_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    period_id UUID NOT NULL REFERENCES expression_ecrite_periods(id) ON DELETE CASCADE,
    total_attempts INTEGER DEFAULT 0,
    average_score DECIMAL(4,2), -- Score moyen sur 20
    completion_rate DECIMAL(5,2), -- Taux de completion en %
    most_difficult_task INTEGER, -- Tâche la plus difficile (1, 2 ou 3)
    popular_topics TEXT[], -- Sujets les plus populaires
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_periods_slug ON expression_ecrite_periods(slug);
CREATE INDEX IF NOT EXISTS idx_periods_year_month ON expression_ecrite_periods(year, month);
CREATE INDEX IF NOT EXISTS idx_combinations_period ON expression_ecrite_combinations(period_id);
CREATE INDEX IF NOT EXISTS idx_tasks_combination ON expression_ecrite_tasks(combination_id);
CREATE INDEX IF NOT EXISTS idx_tasks_number ON expression_ecrite_tasks(task_number);
CREATE INDEX IF NOT EXISTS idx_documents_task ON expression_ecrite_documents(task_id);
CREATE INDEX IF NOT EXISTS idx_corrections_task ON expression_ecrite_corrections(task_id);
CREATE INDEX IF NOT EXISTS idx_corrections_public ON expression_ecrite_corrections(is_public);

-- Triggers pour mettre à jour les timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_periods_updated_at BEFORE UPDATE ON expression_ecrite_periods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_combinations_updated_at BEFORE UPDATE ON expression_ecrite_combinations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON expression_ecrite_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON expression_ecrite_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_corrections_updated_at BEFORE UPDATE ON expression_ecrite_corrections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour mettre à jour le nombre de combinaisons dans une période
CREATE OR REPLACE FUNCTION update_period_combinations_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE expression_ecrite_periods 
        SET total_combinations = (
            SELECT COUNT(*) 
            FROM expression_ecrite_combinations 
            WHERE period_id = NEW.period_id AND is_active = true
        )
        WHERE id = NEW.period_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE expression_ecrite_periods 
        SET total_combinations = (
            SELECT COUNT(*) 
            FROM expression_ecrite_combinations 
            WHERE period_id = OLD.period_id AND is_active = true
        )
        WHERE id = OLD.period_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Mettre à jour les deux périodes si period_id a changé
        IF OLD.period_id != NEW.period_id THEN
            UPDATE expression_ecrite_periods 
            SET total_combinations = (
                SELECT COUNT(*) 
                FROM expression_ecrite_combinations 
                WHERE period_id = OLD.period_id AND is_active = true
            )
            WHERE id = OLD.period_id;
        END IF;
        
        UPDATE expression_ecrite_periods 
        SET total_combinations = (
            SELECT COUNT(*) 
            FROM expression_ecrite_combinations 
            WHERE period_id = NEW.period_id AND is_active = true
        )
        WHERE id = NEW.period_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_combinations_count 
    AFTER INSERT OR UPDATE OR DELETE ON expression_ecrite_combinations 
    FOR EACH ROW EXECUTE FUNCTION update_period_combinations_count();

-- Commentaires pour documenter les tables
COMMENT ON TABLE expression_ecrite_periods IS 'Périodes (mois/année) pour les sujets Expression Écrite TCF';
COMMENT ON TABLE expression_ecrite_combinations IS 'Combinaisons de sujets pour chaque période';
COMMENT ON TABLE expression_ecrite_tasks IS 'Tâches individuelles (1, 2, 3) pour chaque combinaison';
COMMENT ON TABLE expression_ecrite_documents IS 'Documents de référence pour les tâches (principalement Tâche 3)';
COMMENT ON TABLE expression_ecrite_corrections IS 'Corrections et évaluations des tâches';
COMMENT ON TABLE expression_ecrite_stats IS 'Statistiques et métriques par période';

-- Vérification de la création des tables
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename LIKE 'expression_ecrite_%'
ORDER BY tablename;
