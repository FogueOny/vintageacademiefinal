# Checklist de transfert Supabase vers compte d'entreprise

## 📋 Préparation (Avant le transfert)

### ✅ Sauvegarde et documentation
- [ ] **Exporter les données** : Faire un backup complet de la base de données
- [ ] **Documenter la configuration actuelle** :
  - [ ] Lister toutes les tables et leurs structures
  - [ ] Documenter les politiques RLS actives
  - [ ] Inventorier les fonctions et triggers
  - [ ] Lister les buckets de stockage et leurs politiques
- [ ] **Sauvegarder les variables d'environnement actuelles**
- [ ] **Tester l'application** pour s'assurer qu'elle fonctionne parfaitement

### ✅ Préparation du compte d'entreprise
- [ ] **Créer le compte Supabase d'entreprise**
- [ ] **Configurer l'organisation** avec les bons membres
- [ ] **Vérifier les permissions** des membres de l'équipe

## 🔄 Processus de transfert

### Option 1 : Transfert direct (Recommandé)
- [ ] **Aller dans Project Settings → General**
- [ ] **Section "Transfer project"**
- [ ] **Entrer l'email du compte d'entreprise**
- [ ] **Confirmer le transfert**
- [ ] **Attendre la confirmation** (peut prendre quelques minutes)

### Option 2 : Migration manuelle (Si transfert direct impossible)
- [ ] **Créer un nouveau projet** sur le compte d'entreprise
- [ ] **Exporter la structure** : `pg_dump --schema-only`
- [ ] **Exporter les données** : `pg_dump --data-only`
- [ ] **Importer dans le nouveau projet**
- [ ] **Reconfigurer les politiques RLS**
- [ ] **Recréer les buckets de stockage**

## ⚙️ Configuration post-transfert

### ✅ Mise à jour des variables d'environnement

#### Netlify/Vercel (Production)
- [ ] **NEXT_PUBLIC_SUPABASE_URL** → Nouvelle URL du projet
- [ ] **NEXT_PUBLIC_SUPABASE_ANON_KEY** → Nouvelle clé anonyme
- [ ] **SUPABASE_SERVICE_ROLE_KEY** → Nouvelle clé de service

#### Développement local
- [ ] **Mettre à jour `.env.local`** avec les nouvelles clés
- [ ] **Tester la connexion locale** : `npm run dev`

### ✅ Vérification des services

#### Base de données
- [ ] **Tester les requêtes** : Vérifier que toutes les tables sont accessibles
- [ ] **Vérifier les politiques RLS** : Tester les permissions
- [ ] **Valider les relations** : S'assurer que les foreign keys fonctionnent

#### Stockage
- [ ] **Vérifier les buckets** : `avatars`, `question-media`
- [ ] **Tester l'upload** : Essayer d'uploader un fichier
- [ ] **Vérifier les politiques de stockage**

#### Authentification
- [ ] **Tester la connexion utilisateur**
- [ ] **Vérifier les rôles** : Admin, utilisateur standard
- [ ] **Valider les sessions**

## 🧪 Tests de validation

### ✅ Tests fonctionnels
- [ ] **Connexion/Déconnexion** utilisateur
- [ ] **Création de questions** (admin)
- [ ] **Passage de tests** (utilisateur)
- [ ] **Upload de médias** (admin)
- [ ] **Gestion des profils**

### ✅ Tests de performance
- [ ] **Temps de réponse** des requêtes
- [ ] **Chargement des pages**
- [ ] **Upload/Download** de fichiers

## 📞 Support et rollback

### ✅ Plan de rollback
- [ ] **Garder l'ancien projet** actif pendant 48h
- [ ] **Conserver les anciennes variables d'environnement**
- [ ] **Préparer un script de rollback** si nécessaire

### ✅ Contact support
- [ ] **Numéro de ticket** Supabase (si problème)
- [ ] **Documentation** des erreurs rencontrées
- [ ] **Contact équipe** en cas de problème critique

## 💡 Conseils pratiques

### 🔒 Sécurité
- **Changez immédiatement** les clés d'API après le transfert
- **Révoquez l'accès** de l'ancien compte si nécessaire
- **Vérifiez les permissions** de tous les membres de l'équipe

### 📈 Optimisation
- **Profitez du transfert** pour optimiser la structure si nécessaire
- **Mettez à jour** la documentation technique
- **Planifiez** les prochaines évolutions

### 🕒 Timing
- **Effectuez le transfert** en dehors des heures de pointe
- **Prévoyez 2-4h** pour l'ensemble du processus
- **Informez les utilisateurs** d'une maintenance possible

## ✅ Validation finale

- [ ] **Application fonctionne** en production
- [ ] **Tous les tests** passent avec succès
- [ ] **Équipe informée** des nouvelles configurations
- [ ] **Documentation mise à jour**
- [ ] **Ancien projet archivé** (après validation complète)

---

**Note importante** : Gardez toujours une sauvegarde complète avant toute migration ! 