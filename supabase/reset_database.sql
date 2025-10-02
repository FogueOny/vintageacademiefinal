-- Script pour réinitialiser entièrement la base de données Supabase
-- ATTENTION: Ce script supprime TOUTES les données existantes !

-- 1. Supprimer toutes les données des tables en respectant les contraintes de clé étrangère
-- D'abord, supprimer les données des tables qui font référence à d'autres tables
DELETE FROM user_answers; -- Réponses utilisateurs -> options + user_tests
DELETE FROM user_tests; -- Tests utilisateurs -> test_series
DELETE FROM question_media; -- Médias -> questions
DELETE FROM options; -- Options -> questions
DELETE FROM questions; -- Questions -> test_series
DELETE FROM test_series; -- Séries de test -> modules
DELETE FROM modules; -- Modules (table de base)

-- Supprimer les utilisateurs et profils
-- IMPORTANT: Supprimer d'abord les profils car ils référencent les utilisateurs
DELETE FROM profiles;
-- Ensuite seulement, supprimer les utilisateurs (sauf service role si nécessaire)
DELETE FROM auth.users WHERE NOT email = 'service_role@supabase.io';

-- 2. Réinitialiser les séquences d'ID auto-incrémentés si nécessaire
-- (ajustez selon vos besoins)
-- ALTER SEQUENCE table_id_seq RESTART WITH 1;

-- 3. Créer un nouvel utilisateur administrateur
-- NOTE: Cette partie ne peut pas être effectuée directement en SQL standard
-- Vous devrez utiliser l'API Supabase ou l'interface d'administration
-- Exemple de commande (à exécuter via l'API JS):
/*
const { data, error } = await supabase.auth.admin.createUser({
  email: 'admin@example.com',
  password: 'votre_mot_de_passe_securise',
  email_confirm: true,
  user_metadata: { role: 'admin' }
});

-- Puis insérer le profil correspondant
INSERT INTO profiles (id, role, created_at, updated_at)
VALUES ([ID de l'utilisateur créé], 'admin', NOW(), NOW());
*/

-- Un commentaire pour rappeler comment créer manuellement un admin depuis l'interface :
-- 1. Allez sur l'interface Admin de Supabase
-- 2. Créez un nouvel utilisateur via Authentication > Users
-- 3. Puis insérez une ligne dans la table "profiles" avec le rôle "admin"
