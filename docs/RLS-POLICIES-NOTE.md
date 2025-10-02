# Rappel: Revoir les politiques RLS (test_series)

Objectif: permettre aux admins (profiles.role = 'admin') de créer/mettre à jour/supprimer `public.test_series` depuis le dashboard admin.

Actions à faire quand on y revient:

1) Vérifier le profil de l’utilisateur admin
- S’assurer que la ligne existe dans `public.profiles` et que `role = 'admin'` pour l’utilisateur connecté.

2) Appliquer des policies explicites pour test_series
- Fichier à exécuter: `supabase/rls_test_series_admin.sql`
- Crée des policies séparées INSERT/UPDATE/DELETE pour les utilisateurs authentifiés ayant `profiles.role = 'admin'`.

3) Inspecter l’état RLS/policies
- Script: `node scripts/inspect-rls.js`
- Variables requises: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Option: `TABLES=test_series,profiles node scripts/inspect-rls.js`

4) Retester depuis l’admin
- Mettre à jour une série de tests.
- En cas d’erreur, se référer aux logs détaillés ajoutés dans `src/app/admin-dashboard/test-series/page.tsx` (message/details/hint/code).

Notes complémentaires:
- La colonne `is_free` doit exister (script: `supabase/add_is_free_field.sql`).
- Conflit de slug possible (unique). Le slug est dérivé du nom dans `handleSubmit()`.
