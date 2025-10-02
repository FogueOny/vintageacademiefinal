# Base de données Expression Écrite TCF

## Vue d'ensemble

Cette documentation décrit la structure de base de données créée pour gérer les sujets d'Expression Écrite TCF de Vintage Académie. Le système permet de gérer des périodes, combinaisons, tâches, documents et corrections de manière structurée.

## Structure des tables

### 1. `expression_ecrite_periods`
Stocke les périodes organisées par mois et année.

**Colonnes principales :**
- `id` : UUID unique
- `month` : Nom du mois (janvier, fevrier, etc.)
- `year` : Année (2024, 2025, etc.)
- `slug` : Identifiant URL (janvier-2025)
- `title` : Titre affiché (Sujets Expression Écrite - Janvier 2025)
- `total_combinations` : Nombre de combinaisons (mis à jour automatiquement)

### 2. `expression_ecrite_combinations`
Stocke les combinaisons de sujets pour chaque période.

**Colonnes principales :**
- `id` : UUID unique
- `period_id` : Référence vers la période
- `combination_number` : Numéro de la combinaison (1, 2, 3, etc.)
- `title` : Titre optionnel

### 3. `expression_ecrite_tasks`
Stocke les tâches individuelles (1, 2, 3) pour chaque combinaison.

**Colonnes principales :**
- `id` : UUID unique
- `combination_id` : Référence vers la combinaison
- `task_number` : Numéro de la tâche (1, 2, ou 3)
- `title` : Titre de la tâche
- `description` : Description complète
- `word_count_min/max` : Limites de mots
- `task_type` : Type (courriel, blog, argumentation, etc.)
- `difficulty_level` : Niveau (beginner, intermediate, advanced)

### 4. `expression_ecrite_documents`
Stocke les documents de référence (principalement pour Tâche 3).

**Colonnes principales :**
- `id` : UUID unique
- `task_id` : Référence vers la tâche
- `document_number` : Numéro du document (1, 2, etc.)
- `title` : Titre du document
- `content` : Contenu complet
- `source` : Source optionnelle

### 5. `expression_ecrite_corrections`
Stocke les corrections et évaluations.

**Colonnes principales :**
- `id` : UUID unique
- `task_id` : Référence vers la tâche
- `correction_type` : Type (example, user_specific, model_answer)
- `content` : Contenu de la correction
- `score` : Score sur 20
- `feedback` : Commentaires
- `strengths/improvements` : Points forts et améliorations (arrays)

### 6. `expression_ecrite_stats`
Stocke les statistiques par période.

## Installation

### 1. Exécuter les scripts SQL

```bash
# Dans l'éditeur SQL de Supabase, exécuter dans l'ordre :
1. scripts/expression_ecrite_database.sql
2. scripts/expression_ecrite_sample_data.sql
```

### 2. Vérifier la création des tables

```sql
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename LIKE 'expression_ecrite_%'
ORDER BY tablename;
```

## Utilisation des fonctions TypeScript

### Importer les types et fonctions

```typescript
import {
  ExpressionEcritePeriod,
  CreatePeriodData,
  getPeriods,
  createPeriod,
  getPeriodWithCombinations
} from '@/lib/expression-ecrite-db';
```

### Exemples d'utilisation

#### Créer une nouvelle période

```typescript
const newPeriod: CreatePeriodData = {
  month: 'juin',
  year: 2025,
  slug: 'juin-2025',
  title: 'Sujets Expression Écrite - Juin 2025',
  description: 'Sujets d\'actualité pour juin 2025'
};

const result = await createPeriod(newPeriod);
if (result.data) {
  console.log('Période créée:', result.data);
}
```

#### Récupérer toutes les périodes

```typescript
const result = await getPeriods();
if (result.data) {
  console.log('Périodes:', result.data);
}
```

#### Récupérer une période avec toutes ses données

```typescript
const result = await getPeriodWithCombinations('juin-2025');
if (result.data) {
  console.log('Période complète:', result.data);
  // Accès aux combinaisons
  result.data.combinations.forEach(combo => {
    console.log(`Combinaison ${combo.combination_number}:`, combo.tasks);
  });
}
```

## Fonctionnalités automatiques

### 1. Mise à jour des compteurs
Le nombre de combinaisons dans chaque période est mis à jour automatiquement via des triggers.

### 2. Timestamps automatiques
Les colonnes `created_at` et `updated_at` sont gérées automatiquement.

### 3. Génération de slugs
Utilisez les fonctions utilitaires pour générer des slugs cohérents :

```typescript
import { generatePeriodSlug, formatPeriodTitle } from '@/lib/expression-ecrite-db';

const slug = generatePeriodSlug('juin', 2025); // 'juin-2025'
const title = formatPeriodTitle('juin', 2025); // 'Sujets Expression Écrite - Juin 2025'
```

## Interface d'administration

Une interface d'administration est disponible à `/admin-dashboard/expression-ecrite` pour :

- ✅ Gérer les périodes
- ✅ Créer des combinaisons
- ✅ Ajouter des tâches
- ✅ Gérer les documents
- ✅ Suivre les corrections

## Structure des données d'exemple

Le script `expression_ecrite_sample_data.sql` crée :

- **1 période** : Juin 2025
- **3 combinaisons** avec des sujets variés
- **9 tâches** (3 par combinaison)
- **Documents de référence** pour les Tâches 3
- **Corrections d'exemple**

## Bonnes pratiques

### 1. Nommage des périodes
- Utilisez des noms de mois en minuscules : `janvier`, `fevrier`, etc.
- Format de slug : `mois-annee` (ex: `juin-2025`)

### 2. Numérotation des combinaisons
- Commencez toujours à 1 pour chaque période
- Utilisez des numéros séquentiels

### 3. Types de tâches recommandés
- **Tâche 1** : `courriel`, `message`, `lettre`
- **Tâche 2** : `blog`, `article`, `chronique`
- **Tâche 3** : `argumentation`, `essai`, `dissertation`

### 4. Limites de mots par défaut
- **Tâche 1** : 60-120 mots
- **Tâche 2** : 120-150 mots
- **Tâche 3** : 120-180 mots

## Sécurité et permissions

- Toutes les opérations de création/modification nécessitent des droits d'administration
- Les données publiques (corrections avec `is_public = true`) sont accessibles aux utilisateurs
- Les statistiques sont calculées automatiquement et mises en cache

## Migration et sauvegarde

### Exporter les données

```sql
-- Exporter une période complète
SELECT * FROM expression_ecrite_periods WHERE slug = 'juin-2025';
-- + toutes les tables liées
```

### Importer des données

Utilisez les fonctions TypeScript pour maintenir l'intégrité référentielle :

```typescript
// Créer d'abord la période
const period = await createPeriod(periodData);
// Puis les combinaisons
const combination = await createCombination(combinationData);
// Puis les tâches
const task = await createTask(taskData);
```

## Support et maintenance

- Les indexes sont optimisés pour les requêtes fréquentes
- Les triggers maintiennent la cohérence des données
- Les statistiques peuvent être recalculées avec `updatePeriodStats()`

## Évolutions futures

- [ ] Système de versioning des sujets
- [ ] Intégration avec l'IA pour génération automatique
- [ ] Système de notation collaborative
- [ ] Export PDF des sujets
- [ ] API REST complète
