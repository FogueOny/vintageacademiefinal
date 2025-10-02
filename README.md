# 🎓 Vintage Académie

> Plateforme d'apprentissage et de préparation aux tests de langue française (TCF, TEF, IELTS) pour les candidats à l'immigration et étudiants internationaux.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green?logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-blue?logo=tailwind-css)](https://tailwindcss.com/)

## 📖 À propos du projet

Vintage Académie est une application web moderne développée avec Next.js qui offre un environnement complet pour la préparation aux tests de langue française. L'application propose :

- 🎯 **Tests interactifs** : TCF, TEF, IELTS avec questions réelles
- 📊 **Suivi personnalisé** : Progression détaillée et statistiques
- 🎨 **Interface moderne** : Design responsive et animations fluides
- 👥 **Gestion multi-utilisateurs** : Rôles admin et utilisateurs
- 📱 **Mobile-first** : Optimisé pour tous les appareils
- 🔒 **Sécurisé** : Authentification et protection des données

## 🚀 Fonctionnalités

### ✅ Implémentées
- **Authentification complète** (Supabase Auth)
- **Interface d'administration** pour la gestion des contenus
- **Tests interactifs** avec média (audio, images, vidéos)
- **Navigation responsive** cohérente desktop/mobile
- **Gestion des questions** avec options multiples
- **Upload de médias** pour les questions
- **Système de permissions** (RLS Supabase)
- **Tests gratuits et payants**

### 🔄 En cours de développement
- **Système de paiement** (Stripe integration)
- **Certificats** de réussite automatiques
- **Mode hors-ligne** pour les tests
- **Analytics avancées** de performance

## 🛠 Technologies utilisées

| Catégorie | Technologies |
|-----------|-------------|
| **Frontend** | Next.js 15, React 19, TypeScript 5 |
| **Styling** | Tailwind CSS, Framer Motion |
| **Backend** | Supabase (Database, Auth, Storage) |
| **UI Components** | Radix UI, Lucide React |
| **Deployment** | Netlify, Vercel compatible |

## 📦 Installation

### Prérequis
- **Node.js** 18+ et npm
- **Compte Supabase** pour les services backend
- **Git** pour le versioning

### 1. Cloner le repository
```bash
git clone https://github.com/FogueOny/vintageacademie.git
cd vintageacademie
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configuration des variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```env
# 🔑 Configuration Supabase (OBLIGATOIRE)
# Obtenez ces valeurs depuis votre tableau de bord Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# ⚠️ Clé de service (SENSIBLE - côté serveur uniquement)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# 🌐 Configuration du site (optionnel)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> **⚠️ Important** : Ne commitez jamais vos vraies clés d'API ! Utilisez des variables d'environnement.

### 4. Configuration de la base de données

Exécutez les scripts SQL dans l'ordre suivant dans votre interface Supabase :

```bash
# 1. Structure de base
supabase/schema.sql

# 2. Stockage
supabase/init_storage.sql

# 3. Politiques de sécurité
supabase/fix_public_access_policies.sql
supabase/fix_question_media_policies.sql

# 4. Données de test (optionnel)
supabase/seed.sql
```

### 5. Lancer l'application
```bash
npm run dev
```

🎉 **L'application est maintenant accessible sur** [http://localhost:3000](http://localhost:3000)

## 📁 Structure du projet

```
vintageacademie/
├── 📁 src/
│   ├── 📁 app/                    # Pages et routes (App Router)
│   │   ├── 📁 (auth)/            # Routes d'authentification
│   │   ├── 📁 (dashboard)/       # Tableau de bord
│   │   ├── 📁 (tests)/           # Modules de tests
│   │   ├── 📁 admin-client/      # Interface admin
│   │   └── 📁 api/               # API Routes
│   ├── 📁 components/            # Composants réutilisables
│   │   ├── 📁 admin/             # Composants d'administration
│   │   ├── 📁 tests/             # Composants de tests
│   │   └── 📁 ui/                # Composants UI de base
│   ├── 📁 lib/                   # Utilitaires et configuration
│   │   └── 📁 supabase/          # Configuration Supabase
│   └── 📁 types/                 # Types TypeScript
├── 📁 public/                    # Ressources statiques
├── 📁 supabase/                  # Scripts SQL et configuration
├── 📁 docs/                      # Documentation
└── 📁 scripts/                   # Scripts utilitaires
```

## 🔧 Scripts disponibles

```bash
# Développement
npm run dev          # Lancer en mode développement
npm run build        # Build de production
npm run start        # Lancer en production
npm run lint         # Vérification du code

# Utilitaires
npm run check-env    # Vérifier les variables d'environnement
```

## 🚀 Déploiement

### Netlify (Recommandé)
1. Connectez votre repository GitHub à Netlify
2. Configurez les variables d'environnement dans Netlify
3. Le déploiement se fait automatiquement à chaque push

### Vercel
1. Importez le projet sur Vercel
2. Configurez les variables d'environnement
3. Déploiement automatique

### Variables d'environnement de production
```env
NEXT_PUBLIC_SUPABASE_URL=your-production-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-key
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## 🔒 Sécurité

- **RLS (Row Level Security)** : Toutes les tables sont protégées
- **Authentification** : Gestion sécurisée des sessions
- **Permissions** : Système de rôles admin/utilisateur
- **Variables sensibles** : Exclusion du versioning (.gitignore)

## 🤝 Contribution

1. **Fork** le projet
2. Créez votre **branche feature** (`git checkout -b feature/AmazingFeature`)
3. **Committez** vos changements (`git commit -m 'Add AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une **Pull Request**

## 📄 Documentation

- 📋 [Checklist de transfert Supabase](docs/supabase-transfer-checklist.md)
- 🗃️ [Guide de configuration Supabase](supabase/README.md)
- 📝 [Guide des modifications](docs/modifications-recap.md)

## 📞 Support

- **Email** : contact@vintageacademie.fr
- **WhatsApp** : [Contactez-nous](https://wa.me/237652385531)
- **Issues** : [GitHub Issues](https://github.com/FogueOny/vintageacademie/issues)

## 🗓️ Journal des changements — 2025-09-10

Améliorations majeures apportées à l'examen blanc (côté utilisateur et admin):

- **Actions aléatoires EE/EO**
  - Ajout de boutons « Sujet aléatoire » par emplacement pour Expression Écrite (T1, T2, T3) et Expression Orale (Parties 2 et 3).
  - Côté admin (soumission): `src/app/admin-dashboard/exam-blanc/submissions/[id]/page.tsx`.
  - Côté admin (preview de plan): `src/app/admin-dashboard/exam-blanc/preview/page.tsx`.
- **Boutons d'actualisation**
  - Bouton « Actualiser » global et « Actualiser EE/EO » lorsque la section est vide sur la page de soumission admin.
- **Nouvelles routes API**
  - `GET /api/exam-blanc/random-ee?task_number=1|2|3&exclude=<id>`
  - `GET /api/exam-blanc/random-eo?partie_number=2|3&exclude=<id>`
- **Sélection de plan (backend)**
  - `src/app/api/exam-blanc/route.ts` met maintenant `description` (au lieu de `instructions`) pour les tâches EE.
- **Affichage CO/CE (utilisateur et preview)**
  - Utilisation prioritaire de `question_text` (énoncé) puis fallback `content`/`title`.
  - Affichage de `context_text` (description/contexte) lorsqu'il existe.
  - Sur la page utilisateur, le contexte s'affiche désormais **avant** la question.
- **Affichage EE**
  - Passage au duo de champs `title` + `description` partout (UI + API Random EE).

Répertoires/fichiers clefs modifiés:

- `src/app/(dashboard)/dashboard/exam-blanc/[id]/page.tsx`
- `src/app/admin-dashboard/exam-blanc/submissions/[id]/page.tsx`
- `src/app/admin-dashboard/exam-blanc/preview/page.tsx`
- `src/app/api/exam-blanc/route.ts`
- `src/app/api/exam-blanc/random-ee/route.ts`
- `src/app/api/exam-blanc/random-eo/route.ts`

Efforts de QA recommandés:

- Tester la navigation CO → CE → EE → EO côté utilisateur et vérifier l'affichage des énoncés et contextes.
- Vérifier les boutons « Sujet aléatoire » par emplacement (EE/EO) et l'actualisation sur la page de soumission admin.
- Valider que les tâches EE affichent bien `title` + `description`.
- Vérifier que les questions CE ayant un `context_text` l'affichent bien avant l'énoncé.

## 📄 Licence

Ce projet est sous licence privée. Tous droits réservés à EVOLUE.

---

<div align="center">

**Développé avec ❤️ par l'équipe EVOLUE**

[🌐 Site Web](https://vintageacademie.netlify.app) • [📧 Contact](mailto:contact@vintageacademie.fr) • [💬 WhatsApp](https://wa.me/237652385531)

</div>

## NOTE 

les sujets d'actualités (Juillet) 2025
les sujets d'actualités (Juin) 2025
les sujets d'actualités (Mai) 2025
les sujets d'actualités (Avril) 2025
les sujets d'actualités (Mars) 2025
les sujets d'actualités (Février) 2025
les sujets d'actualités (Janvier) 2025
les sujets d'actualités (Décembre) 2024
les sujets d'actualités (Décembre) 2024
les sujets d'actualités (Novembre) 2024
les sujets d'actualités (Octobre) 2024
les sujets d'actualités (Septembre) 2024
les sujets d'actualités (Août ) 2024
les sujets d'actualités (Juillet ) 2024
les sujets d'actualités (Juin) 2024
les sujets d'actualités (Mai) 2024
les sujets d'actualités (Avril ) 2024
les sujets d'actualités (Mars ) 2024
les sujets d'actualités (Février) 2024
les sujets d'actualités (Janvier) 2024
#resumer
----
okey je penses que sa  a marcher, on va tester et te revenir.  tu peux faire en sorte que lorsque on creer un compte, au niveau de la confirmation de l'adresse, sa dirge sur le nom de domaine :  https://vafinal.netlify.app/ 
au lieu  de localhost:3000