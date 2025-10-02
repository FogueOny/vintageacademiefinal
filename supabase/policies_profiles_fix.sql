-- Fix recursion: profiles policies must not self-reference profiles
-- Strategy: create SECURITY DEFINER helper and re-create admin policies

-- 1) Helper function to check admin status without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  );
$$;

-- ensure privileges
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 2) Recreate admin policies for profiles without self-SELECTs
DROP POLICY IF EXISTS profiles_delete_admins ON public.profiles;
DROP POLICY IF EXISTS profiles_select_admins ON public.profiles;
DROP POLICY IF EXISTS profiles_update_admins ON public.profiles;

-- Allow admins to SELECT any profile, users can always select their own via the user policy
CREATE POLICY profiles_select_admins
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin() OR id = auth.uid()
  );

-- Allow admins to UPDATE any profile
CREATE POLICY profiles_update_admins
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
  )
  WITH CHECK (
    true
  );

-- Allow admins to DELETE any profile
CREATE POLICY profiles_delete_admins
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
  );

-- Notes:
-- - Existing user-scoped policies like "Les utilisateurs peuvent voir/mettre à jour leur propre profil"
--   restent en place et ne causent pas de récursion.
-- - The function runs as owner (SECURITY DEFINER) and bypasses RLS on profiles,
--   avoiding recursive evaluation.
