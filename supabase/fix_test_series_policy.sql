-- Remplacer la politique de sélection par une politique plus permissive
DROP POLICY IF EXISTS "Accès séries de tests uniquement pour utilisateurs authentifi" ON public.test_series;

-- Nouvelle politique qui permet à tout le monde d'accéder en lecture
CREATE POLICY "Tout le monde peut voir les séries de tests" 
  ON public.test_series 
  FOR SELECT 
  USING (true);  -- Permet l'accès à tout le monde, même non authentifié

-- Afficher les politiques après modification pour vérifier
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'test_series';
