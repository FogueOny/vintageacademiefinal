# Guide d'importation des templates Expression Écrite

## Vue d'ensemble

Ce guide explique comment importer les 40 séries de tests d'expression écrite pour le module TCF. L'importation se fait en **deux étapes** :

1. **Import des séries de tests** (structure des tests)
2. **Import des questions** (contenu des exercices)

## Fichiers générés

### 1. Template des séries (`expression-ecrite-series-template.csv`)

**Format CSV :**
```csv
module_id,title,description,time_limit,slug,is_free
1ece538c-8d39-4bea-8819-b0927dee4751,Expression Écrite - Série 1,Série de tests d'expression écrite numéro 1,3600,expression-ecrite-serie-1,true
```

**Colonnes :**
- `module_id` : ID du module Expression Écrite
- `title` : Nom de la série (utilisé comme `name` dans l'API)
- `description` : Description de la série
- `time_limit` : Durée en secondes (3600 = 60 minutes)
- `slug` : Identifiant URL unique
- `is_free` : Accès gratuit (true/false)

### 2. Template des questions (`expression-ecrite-questions-template.csv`)

**Format CSV :**
```csv
test_series_id,question_text,type,order,media_url,media_type,points
{SERIES_ID_1},"Rédigez un texte de 60 à 80 mots sur le sujet suivant : Décrivez votre ville natale...",essay,1,,,10
```

**Colonnes :**
- `test_series_id` : ID de la série (à remplacer après import des séries)
- `question_text` : Texte de la consigne d'écriture
- `type` : Type de question (`essay` pour expression écrite)
- `order` : Ordre de la question (toujours 1 pour expression écrite)
- `media_url` : URL du média (vide pour expression écrite)
- `media_type` : Type de média (vide pour expression écrite)
- `points` : Points attribués (10 par défaut)

## Procédure d'importation

### Étape 1 : Importer les séries de tests

1. **Accéder à l'interface d'importation**
   - Aller dans l'interface admin
   - Cliquer sur l'onglet "Importation"
   - Sélectionner l'onglet "Séries de tests"

2. **Importer le fichier des séries**
   - Cliquer sur "Sélectionner un fichier"
   - Choisir `expression-ecrite-series-template.csv`
   - Cliquer sur "Importer les séries"

3. **Vérifier l'importation**
   - Consulter les logs d'importation
   - Vérifier que les 40 séries ont été créées
   - Noter les IDs des séries créées

### Étape 2 : Préparer et importer les questions

1. **Récupérer les IDs des séries**
   - Aller dans l'onglet "Séries de tests" de l'admin
   - Noter les IDs des séries créées
   - Ou utiliser la base de données pour récupérer les IDs

2. **Modifier le template des questions**
   - Ouvrir `expression-ecrite-questions-template.csv`
   - Remplacer chaque `{SERIES_ID_X}` par l'ID réel de la série correspondante
   - Exemple : `{SERIES_ID_1}` → `uuid-de-la-serie-1`

3. **Importer les questions**
   - Aller dans l'onglet "Questions" de l'importation
   - Sélectionner le fichier des questions modifié
   - Cliquer sur "Importer les questions"

## Utilisation du script générateur

### Génération des templates

```bash
# Générer les deux templates avec les paramètres par défaut
node scripts/generate-expression-ecrite-template.js

# Générer seulement les séries
node scripts/generate-expression-ecrite-template.js --series-only

# Générer seulement les questions
node scripts/generate-expression-ecrite-template.js --questions-only

# Personnaliser les paramètres
node scripts/generate-expression-ecrite-template.js --count 20 --time 1800 --free false
```

### Options disponibles

- `--module-id <id>` : ID du module (défaut: module Expression Écrite)
- `--count <number>` : Nombre de séries (défaut: 40)
- `--time <seconds>` : Durée limite en secondes (défaut: 3600)
- `--free <true/false>` : Accès gratuit (défaut: true)
- `--points <number>` : Points par question (défaut: 10)
- `--series-only` : Générer seulement les séries
- `--questions-only` : Générer seulement les questions

## Contenu des sujets d'expression écrite

Les 40 sujets couvrent différents thèmes :

### Thèmes personnels
- Ville natale, souvenirs d'enfance
- Famille, amis, relations
- Loisirs, sports, activités

### Thèmes quotidiens
- Routine, alimentation, transport
- Travail, études, projets
- Célébrations, traditions

### Thèmes réflexifs
- Environnement, société
- Défis personnels, apprentissage
- Conseils, expériences

## Dépannage

### Problèmes courants

1. **Erreur "Champs obligatoires manquants"**
   - Vérifier que toutes les colonnes requises sont présentes
   - S'assurer que les valeurs ne sont pas vides

2. **Erreur "Module non trouvé"**
   - Vérifier que l'ID du module est correct
   - S'assurer que le module existe dans la base de données

3. **Erreur "Série non trouvée" (pour les questions)**
   - Vérifier que les IDs de séries sont corrects
   - S'assurer que les séries ont été importées en premier

### Vérification des données

```sql
-- Vérifier les séries créées
SELECT id, name, slug FROM test_series 
WHERE module_id = '1ece538c-8d39-4bea-8819-b0927dee4751'
ORDER BY name;

-- Vérifier les questions créées
SELECT ts.name, q.question_text 
FROM questions q 
JOIN test_series ts ON q.test_series_id = ts.id 
WHERE ts.module_id = '1ece538c-8d39-4bea-8819-b0927dee4751';
```

## Prochaines étapes

Après l'importation réussie :

1. **Tester les séries** via l'interface utilisateur
2. **Configurer les permissions** d'accès
3. **Ajouter des médias** si nécessaire (images, audio)
4. **Mettre à jour la navigation** pour inclure les nouvelles séries

## Support

En cas de problème :
- Consulter les logs d'importation dans l'interface admin
- Vérifier les permissions de l'utilisateur admin
- Contrôler la structure des fichiers CSV
- Tester avec un petit échantillon avant l'import complet 