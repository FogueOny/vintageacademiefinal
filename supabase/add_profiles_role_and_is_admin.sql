-- Add role column to profiles (idempotent), constrain values, and create is_admin() RPC
-- Safe to run multiple times

BEGIN;

-- 1) Ensure role column exists with default 'user'
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';

-- 2) Constrain allowed values for role ('user' | 'admin') if constraint missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_role_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_check CHECK (role IN ('user','admin'));
  END IF;
END$$;

-- 3) Optional: create an index to speed up role checks (id + role)
CREATE INDEX IF NOT EXISTS idx_profiles_id_role ON public.profiles (id, role);

-- 4) Create/replace lightweight admin checker that bypasses RLS recursion
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

-- 5) Ensure privileges on the RPC
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 6) (Optional) Backfill: set specific users as admin
-- Replace the sample UUID below with your real admin user id(s) or add WHERE email = '...'
-- UPDATE public.profiles SET role = 'admin' WHERE id = '00000000-0000-0000-0000-000000000000';
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@example.com';

COMMIT;

