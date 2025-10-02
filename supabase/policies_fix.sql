-- Vintage Académie - RLS policies cleanup and hardening
-- Idempotent script: safe to run multiple times

-- =====================
-- MODULES
-- =====================
DROP POLICY IF EXISTS "Accès public aux modules" ON public.modules;
DROP POLICY IF EXISTS "Tout le monde peut voir les modules" ON public.modules;
DROP POLICY IF EXISTS "nable read access for all users" ON public.modules;

-- Unified public SELECT policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'modules' AND policyname = 'modules_public_select'
  ) THEN
    CREATE POLICY modules_public_select
      ON public.modules
      FOR SELECT
      TO public
      USING (true);
  END IF;
END$$;

-- =====================
-- OPTIONS
-- =====================
-- Admin policies: restrict to authenticated
ALTER POLICY options_admin_delete ON public.options TO authenticated;
ALTER POLICY options_admin_insert ON public.options TO authenticated;
ALTER POLICY options_admin_update ON public.options TO authenticated;

-- Remove blanket public SELECT (conflicts with free/subscription gating)
DROP POLICY IF EXISTS options_public_select ON public.options;

-- =====================
-- QUESTION_MEDIA
-- =====================
-- Remove blanket public SELECT to preserve gating via anon_free/auth_by_subscription
DROP POLICY IF EXISTS "Accès public aux médias des questions" ON public.question_media;
DROP POLICY IF EXISTS "Allow public read access for question_media" ON public.question_media;

-- =====================
-- QUESTIONS
-- =====================
-- Admin policies: restrict to authenticated
ALTER POLICY questions_admin_delete ON public.questions TO authenticated;
ALTER POLICY questions_admin_insert ON public.questions TO authenticated;

-- Remove blanket public SELECT (keep anon_free/auth_by_subscription)
DROP POLICY IF EXISTS questions_public_select ON public.questions;

-- =====================
-- TEST_SERIES
-- =====================
-- Remove blanket public SELECT (keep anon_free/auth_by_subscription)
DROP POLICY IF EXISTS "Accès public aux séries de tests" ON public.test_series;
DROP POLICY IF EXISTS "Tous les utilisateurs peuvent voir les séries de tests" ON public.test_series;

-- Admin policy: restrict to authenticated
ALTER POLICY "Admin peut gérer les séries de tests" ON public.test_series TO authenticated;

-- =====================
-- USER_ANSWERS
-- =====================
-- Drop public variants; keep authenticated variants
DROP POLICY IF EXISTS "Les utilisateurs peuvent ajouter leurs propres réponses" ON public.user_answers;
DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leurs propres réponses" ON public.user_answers;
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres réponses" ON public.user_answers;

-- =====================
-- USER_TESTS
-- =====================
-- Drop public variants; keep authenticated variants
DROP POLICY IF EXISTS "Les utilisateurs peuvent ajouter leurs propres tests" ON public.user_tests;
DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leurs propres tests" ON public.user_tests;

-- =====================
-- PROFILES
-- =====================
-- Restrict user-facing policies to authenticated
ALTER POLICY "Les utilisateurs peuvent mettre à jour leur propre profil" ON public.profiles TO authenticated;
ALTER POLICY "Les utilisateurs peuvent voir leur propre profil" ON public.profiles TO authenticated;
ALTER POLICY "Le système peut créer des profils" ON public.profiles TO authenticated;

-- Notes:
-- - The Supabase Auth trigger (service role) can still insert into profiles regardless of RLS.
-- - If you rely on client-side insert into profiles before auth, consider adjusting this accordingly.
