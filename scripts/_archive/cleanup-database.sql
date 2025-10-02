-- Script de nettoyage de base de données pour Supabase production
-- À exécuter avec prudence dans l'interface SQL de Supabase

-- Désactiver les contraintes de FK temporairement
SET session_replication_role = 'replica';

-- Truncate toutes les tables principales
TRUNCATE TABLE public.answers CASCADE;
TRUNCATE TABLE public.questions CASCADE;
TRUNCATE TABLE public.test_series CASCADE;
TRUNCATE TABLE public.modules CASCADE;
TRUNCATE TABLE public.user_answers CASCADE;
TRUNCATE TABLE public.user_results CASCADE;
TRUNCATE TABLE public.user_tests CASCADE;
TRUNCATE TABLE public.profiles CASCADE; -- À utiliser avec prudence car cela supprime tous les utilisateurs

-- Réinitialiser les séquences d'ID
ALTER SEQUENCE public.answers_id_seq RESTART WITH 1;
ALTER SEQUENCE public.questions_id_seq RESTART WITH 1;
ALTER SEQUENCE public.test_series_id_seq RESTART WITH 1;
ALTER SEQUENCE public.modules_id_seq RESTART WITH 1;
ALTER SEQUENCE public.user_answers_id_seq RESTART WITH 1;
ALTER SEQUENCE public.user_results_id_seq RESTART WITH 1;
ALTER SEQUENCE public.user_tests_id_seq RESTART WITH 1;

-- Réactiver les contraintes de FK
SET session_replication_role = 'origin';

-- Script pour créer un administrateur initial (à exécuter après création du compte via l'interface)
-- Remplacer 'user-id-from-auth' par l'ID réel de l'utilisateur après inscription
/*
UPDATE public.profiles
SET role = 'admin'
WHERE id = 'user-id-from-auth';
*/

-- Notes pour le nettoyage des buckets de stockage :
-- 1. Il est recommandé d'utiliser l'interface Supabase pour supprimer les fichiers des buckets
-- 2. Pour les gros volumes, utiliser l'API Supabase Storage avec un script Node.js
-- 3. Alternativement, vous pouvez supprimer et recréer les buckets via l'interface Supabase
