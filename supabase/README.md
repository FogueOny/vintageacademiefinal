# Guide de configuration Supabase pour Vintage Académie

Ce document explique comment configurer une nouvelle instance Supabase pour le projet Vintage Académie.

## Étapes d'installation

1. Créez un nouveau projet dans Supabase
2. Exécutez les scripts SQL dans l'ordre suivant :
   - `schema.sql` - Structure de base de données
   - `init_storage.sql` - Configuration initiale du stockage
   - `company_data.sql` - Informations de l'entreprise (à créer)
   - `seed.sql` - Données de test/initiales

## Configuration des buckets de stockage

Assurez-vous de créer les buckets de stockage suivants :

- `avatars` : Pour les images de profil utilisateur
- `question-media` : Pour les médias associés aux questions de test

## Configuration des politiques de sécurité (RLS)

Exécutez les scripts suivants pour configurer les politiques RLS :
- `fix_rls_policies.sql`
- `fix_test_series_policy.sql`
- `fix_test_series_access.sql`

## Variables d'environnement

Configurez les variables d'environnement suivantes dans Netlify :

```
NEXT_PUBLIC_SUPABASE_URL=<votre-url-supabase>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<votre-clé-anonyme>
```

## Informations de l'entreprise

Pour ajouter les informations de l'entreprise, créez un fichier `company_data.sql` avec le contenu suivant et exécutez-le dans l'interface SQL de Supabase :

```sql
-- Exemple - à adapter selon vos besoins
INSERT INTO company_info (
  name, 
  address, 
  phone, 
  email, 
  description
) VALUES (
  'Vintage Académie',
  '123 Rue de Paris, 75001 Paris, France',
  '+33 1 23 45 67 89',
  'contact@vintageacademie.fr',
  'Centre de formation et préparation aux examens de français'
);
```

## Maintenance et mise à jour

Pour les mises à jour futures de la structure de base de données :
1. Créez un nouveau fichier SQL avec un nom descriptif et la date
2. Documentez les modifications dans ce README
3. Appliquez les modifications sur les instances de production et de développement
