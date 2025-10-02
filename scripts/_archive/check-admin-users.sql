-- Script pour vérifier et corriger les utilisateurs admin
-- À exécuter dans l'interface SQL de Supabase

-- 1. Voir tous les utilisateurs et leurs rôles
SELECT 
  id,
  email,
  role,
  full_name,
  created_at
FROM profiles 
ORDER BY created_at DESC;

-- 2. Voir les utilisateurs admin actuels
SELECT 
  id,
  email,
  role,
  full_name
FROM profiles 
WHERE role = 'admin';

-- 3. Pour promouvoir un utilisateur en admin (remplacez l'email)
-- UPDATE profiles 
-- SET role = 'admin' 
-- WHERE email = 'votre-email@example.com';

-- 4. Pour créer un profil admin si il n'existe pas
-- INSERT INTO profiles (id, email, role, full_name)
-- VALUES (
--   'user-uuid-from-auth', 
--   'votre-email@example.com', 
--   'admin', 
--   'Votre Nom'
-- )
-- ON CONFLICT (id) DO UPDATE SET role = 'admin'; 