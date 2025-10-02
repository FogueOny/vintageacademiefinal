-- Allow authenticated users to SELECT their own profile row to support server-side admin checks
-- Idempotent creation: creates policy only if not existing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Allow users to read own profile'
  ) THEN
    CREATE POLICY "Allow users to read own profile"
      ON public.profiles
      FOR SELECT
      TO authenticated
      USING ( id = auth.uid() );
  END IF;
END$$;
