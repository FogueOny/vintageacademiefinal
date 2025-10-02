-- Script de correction et prévention des problèmes de rôles utilisateur
-- À exécuter dans l'interface SQL de Supabase

-- 1. Vérifier les utilisateurs sans profil
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created,
  p.id as profile_id,
  p.role,
  p.full_name
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 2. Créer les profils manquants pour les utilisateurs existants
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Utilisateur'),
  'user' -- Rôle par défaut
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 3. Vérifier et corriger les rôles manquants
UPDATE public.profiles 
SET role = 'user' 
WHERE role IS NULL OR role = '';

-- 4. Créer une fonction de récupération de profil
CREATE OR REPLACE FUNCTION public.ensure_user_profile(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  profile_exists BOOLEAN;
BEGIN
  -- Vérifier si le profil existe
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = user_id) INTO profile_exists;
  
  -- Si le profil n'existe pas, le créer
  IF NOT profile_exists THEN
    INSERT INTO public.profiles (id, email, full_name, role)
    SELECT 
      id,
      email,
      COALESCE(raw_user_meta_data->>'full_name', 'Utilisateur'),
      'user'
    FROM auth.users 
    WHERE id = user_id;
    
    RETURN TRUE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Améliorer le trigger pour être plus robuste
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si le profil existe déjà
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
      NEW.id, 
      NEW.email, 
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilisateur'),
      'user'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Créer une politique pour permettre la récupération de profil
DROP POLICY IF EXISTS "Les admins peuvent voir tous les profils" ON public.profiles;
CREATE POLICY "Les admins peuvent voir tous les profils"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles admin_profile
      WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'admin'
    )
  );

-- 7. Créer une fonction pour promouvoir un utilisateur admin
CREATE OR REPLACE FUNCTION public.promote_to_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Trouver l'utilisateur par email
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non trouvé: %', user_email;
  END IF;
  
  -- S'assurer que le profil existe
  PERFORM public.ensure_user_profile(target_user_id);
  
  -- Promouvoir en admin
  UPDATE public.profiles 
  SET role = 'admin'
  WHERE id = target_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Créer une fonction pour récupérer les informations utilisateur
CREATE OR REPLACE FUNCTION public.get_user_info(user_id UUID DEFAULT auth.uid())
RETURNS TABLE(
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  profile_exists BOOLEAN
) AS $$
BEGIN
  -- S'assurer que le profil existe
  PERFORM public.ensure_user_profile(user_id);
  
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    TRUE as profile_exists
  FROM public.profiles p
  WHERE p.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Vérifier l'état actuel
SELECT 
  'État actuel' as info,
  COUNT(*) as total_users,
  COUNT(p.id) as users_with_profiles,
  COUNT(CASE WHEN p.role = 'admin' THEN 1 END) as admin_users,
  COUNT(CASE WHEN p.role = 'user' THEN 1 END) as regular_users
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id; 