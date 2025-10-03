# 🔧 TODO: Refactorisation Système d'Authentification

## 📋 Problème Actuel

### Symptômes
- **Boucle infinie de chargement** sur `/dashboard/tests/comprehension-orale` lors de la navigation depuis le dashboard (sans refresh)
- Le problème ne se produit PAS lors d'un refresh direct de la page
- Logs montrent une boucle infinie de `⚠️ Auth timeout/erreur` → `🔄 Tentative de récupération` → `❌ Retry échoué` → `⚠️ Fallback mode anonyme`

### Cause Racine
Le hook `useAuthUnified` (dans `/src/hooks/use-auth-unified.ts`) crée une boucle de re-render:
1. Timeout lors de `supabase.auth.getUser()` (3 secondes)
2. Passe en mode anonyme (`user: null`)
3. Change l'état global → déclenche un re-render
4. Re-déclenche le hook → retour à l'étape 1

### Workaround Actuel
- Message ajouté dans l'écran de chargement: "Si le chargement prend trop de temps, actualisez la page (F5)"
- Les utilisateurs peuvent refresh manuellement pour charger la page correctement
- Le dashboard utilise un bypass du `ensureValidSession` qui fonctionne

## 🎯 Solution Recommandée

### Approche 1: Refactorisation Complète (Recommandé)
**Durée estimée**: 3-4 heures

1. **Supprimer `useAuthUnified`** complètement
2. **Standardiser sur l'approche du dashboard**:
   - Timeout court (3-5s) sur `ensureValidSession`
   - Si timeout → Bypass et appel direct à l'API
   - L'API vérifie la session de son côté
   - Si 401 → Redirect vers login
   
3. **Appliquer partout**:
   - `/src/app/(dashboard)/dashboard/tests/[moduleSlug]/page.tsx`
   - `/src/components/tests/test-series-list.tsx`
   - Toutes les pages protégées

4. **Avantages**:
   - ✅ Pas de boucle infinie
   - ✅ Chargement rapide (max 5-8 secondes)
   - ✅ Comportement cohérent partout
   - ✅ Fallback automatique si Supabase est lent

### Approche 2: Fix Minimal du Hook (Alternative)
**Durée estimée**: 1-2 heures

1. **Empêcher la boucle dans `useAuthUnified`**:
   - Ajouter un flag `isRetrying` pour éviter les appels multiples
   - Limiter le nombre de tentatives (max 2)
   - Forcer `loading: false` après les tentatives

2. **Problème**: Ne résout pas la cause racine (Supabase lent)

## 📝 Fichiers à Modifier

### Approche 1 (Recommandée)
```
/src/hooks/use-auth-unified.ts                    → SUPPRIMER
/src/lib/supabase/client.ts                       → Garder ensureValidSession avec timeout
/src/app/(dashboard)/dashboard/page.tsx           → Déjà fait ✅
/src/app/(dashboard)/dashboard/tests/[moduleSlug]/page.tsx → Appliquer même pattern
/src/components/tests/test-series-list.tsx        → Simplifier auth check
```

### Approche 2 (Alternative)
```
/src/hooks/use-auth-unified.ts                    → Ajouter protection contre boucle
```

## 🚀 Plan d'Action

### Phase 1: Préparation
- [ ] Créer une branche `refactor/auth-system`
- [ ] Documenter tous les endroits utilisant `useAuthUnified`
- [ ] Créer des tests manuels pour vérifier le comportement

### Phase 2: Implémentation
- [ ] Créer un nouveau hook `useAuthSimple` basé sur l'approche du dashboard
- [ ] Remplacer `useAuthUnified` par `useAuthSimple` dans un fichier test
- [ ] Vérifier que ça fonctionne
- [ ] Appliquer partout

### Phase 3: Nettoyage
- [ ] Supprimer `useAuthUnified`
- [ ] Supprimer le code mort
- [ ] Mettre à jour la documentation

### Phase 4: Tests
- [ ] Tester navigation dashboard → tests (sans refresh)
- [ ] Tester refresh direct sur page tests
- [ ] Tester avec connexion lente (throttling)
- [ ] Tester mode anonyme
- [ ] Tester avec abonnement actif/inactif

## 📊 État Actuel du Projet

### ✅ Fonctionnel
- Dashboard (avec bypass)
- Système vocal Examen Blanc (complet)
- Refresh de page sur toutes les pages
- Login/Logout

### ⚠️ Nécessite Workaround
- Navigation interne vers pages de tests (nécessite refresh manuel)

### ❌ À Corriger
- Boucle infinie sur navigation interne

## 💡 Notes Importantes

1. **Ne pas toucher au système vocal** - Il est complet et fonctionnel
2. **Le problème n'affecte que la navigation interne** - Pas critique pour la production
3. **Le workaround est acceptable** - Les utilisateurs peuvent refresh
4. **Priorité**: Moyenne (peut attendre après le lancement)

## 🔗 Références

- Issue originale: Logs montrant boucle infinie dans console
- Commit du bypass dashboard: `89f7f9f` - "fix: Add timeout and bypass for session check"
- Commit du workaround: `[À VENIR]` - "fix: Add loading message for manual refresh"

---

**Date de création**: 2025-10-03  
**Dernière mise à jour**: 2025-10-03  
**Statut**: 🟡 En attente (workaround en place)
