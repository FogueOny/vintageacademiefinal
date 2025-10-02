-- Ajouter le champ role à la table profiles si ce champ n'existe pas déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
END
$$;
