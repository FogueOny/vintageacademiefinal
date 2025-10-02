# Guide de nettoyage de la base de données pour la production

Ce guide décrit les étapes pour nettoyer la base de données Supabase et les buckets de stockage avant le déploiement en production.

## 1. Nettoyage de la base de données

### Option 1 : Utiliser le script SQL

Le script `scripts/cleanup-database.sql` permet de :
- Désactiver temporairement les contraintes de clés étrangères
- Tronquer toutes les tables principales
- Réinitialiser les séquences d'ID
- Réactiver les contraintes

**Procédure :**
1. Dans l'interface Supabase, aller dans la section "SQL Editor"
2. Copier le contenu du script `scripts/cleanup-database.sql`
3. Exécuter les commandes (attention : cela supprime toutes les données !)

### Option 2 : Suppression manuelle via l'interface

Si vous préférez une approche plus prudente :

1. Aller dans "Table Editor" dans le dashboard Supabase
2. Pour chaque table, utiliser le bouton "Delete rows" pour supprimer toutes les données
   - Ordre recommandé pour éviter les problèmes de clés étrangères :
     - `user_answers` → `user_results` → `user_tests` → `answers` → `questions` → `test_series` → `modules`
3. Après la suppression, réinitialiser les séquences avec la partie correspondante du script SQL

## 2. Nettoyage des buckets de stockage

### Option 1 : Utiliser le script JavaScript

Le script `scripts/cleanup-storage-buckets.js` permet de :
- Vider les buckets de stockage spécifiés
- Supprimer tous les fichiers dans ces buckets

**Prérequis :**
```bash
npm install @supabase/supabase-js dotenv
```

**Configuration :**
Créer un fichier `.env` à la racine du projet :
```
SUPABASE_URL=votre_url_supabase
SUPABASE_SERVICE_KEY=votre_clé_service_supabase
```

**Exécution :**
```bash
node scripts/cleanup-storage-buckets.js
```

### Option 2 : Suppression manuelle via l'interface

1. Dans l'interface Supabase, aller dans la section "Storage"
2. Pour chaque bucket, sélectionner tous les fichiers et cliquer sur "Delete"

## 3. Création d'un compte administrateur initial

1. Créer un compte utilisateur via l'interface d'inscription normale de l'application
2. Une fois le compte créé, exécuter la requête SQL suivante pour lui attribuer le rôle d'administrateur :

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = 'user-id-from-auth';  -- Remplacer par l'ID réel de l'utilisateur
```

Pour trouver l'ID de l'utilisateur, exécuter :
```sql
SELECT * FROM auth.users WHERE email = 'email@example.com';
```

## Notes importantes

- **Sauvegarde** : Assurez-vous de faire une sauvegarde complète avant toute opération de nettoyage.
- **Environnement** : Vérifiez que vous êtes bien sur l'environnement de production et non sur un environnement de développement.
- **Vérification** : Après le nettoyage, vérifiez le bon fonctionnement de l'application en créant quelques enregistrements de test.
