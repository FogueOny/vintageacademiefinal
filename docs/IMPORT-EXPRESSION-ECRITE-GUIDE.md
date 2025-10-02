# 🚀 Guide d'importation Expression Écrite - RÉSOLU

## ❌ Problème identifié

L'importation échouait car le template CSV utilisait des **noms de colonnes incorrects** :

```csv
# ❌ ANCIEN FORMAT (incorrect)
module_id,series_name,series_description,series_slug,time_limit,is_free,question_number,question_content...

# ✅ NOUVEAU FORMAT (correct)
module_id,title,description,time_limit,slug,is_free
```

## ✅ Solution mise en place

### 1. Templates corrigés créés

- **`expression-ecrite-series-template.csv`** - Format correct pour l'API
- **`expression-ecrite-questions-template.csv`** - Template des questions (à utiliser après)
- **Scripts automatisés** pour générer et tester les templates

### 2. Scripts d'assistance

- **`generate-expression-ecrite-template.js`** - Génère les templates
- **`test-series-import.js`** - Teste la validité des templates
- **`get-series-ids.js`** - Aide pour récupérer les IDs après import

## 🎯 Procédure d'importation (2 étapes)

### ÉTAPE 1: Importer les séries de tests

1. **Aller dans l'interface admin**
   ```
   Admin → Importation → Séries de tests
   ```

2. **Utiliser le template corrigé**
   - Fichier: `public/templates/expression-ecrite-series-template.csv`
   - Format: `module_id,title,description,time_limit,slug,is_free`
   - Contenu: 40 séries d'expression écrite

3. **Lancer l'importation**
   - Sélectionner le fichier CSV
   - Cliquer sur "Importer les séries"
   - Vérifier les logs d'importation

### ÉTAPE 2: Récupérer les IDs et importer les questions

1. **Récupérer les IDs des séries créées**
   
   **Option A - Via SQL:**
   ```sql
   SELECT id, name FROM test_series 
   WHERE module_id = '1ece538c-8d39-4bea-8819-b0927dee4751' 
   ORDER BY CAST(SUBSTRING(name FROM 'Série ([0-9]+)') AS INTEGER);
   ```

   **Option B - Via JavaScript (console navigateur):**
   ```javascript
   // Exécuter dans la console sur la page admin
   async function getSeriesIds() {
     const response = await fetch('/api/admin/modules-and-tests');
     const data = await response.json();
     const expressionSeries = data.testSeries
       .filter(s => s.module_id === '1ece538c-8d39-4bea-8819-b0927dee4751')
       .sort((a, b) => {
         const numA = parseInt(a.name.match(/Série (\d+)/)?.[1] || '0');
         const numB = parseInt(b.name.match(/Série (\d+)/)?.[1] || '0');
         return numA - numB;
       });
     console.log('IDs:', expressionSeries.map(s => s.id));
   }
   getSeriesIds();
   ```

2. **Générer le template des questions avec les vrais IDs**
   ```bash
   node scripts/get-series-ids.js --generate-questions "id1,id2,id3,..."
   ```

3. **Importer les questions**
   ```
   Admin → Importation → Questions
   ```

## 📋 Vérification des résultats

### Vérifier les séries importées
```sql
SELECT COUNT(*) as total_series FROM test_series 
WHERE module_id = '1ece538c-8d39-4bea-8819-b0927dee4751';
-- Résultat attendu: 40
```

### Vérifier les questions importées
```sql
SELECT COUNT(*) as total_questions FROM questions q
JOIN test_series ts ON q.test_series_id = ts.id
WHERE ts.module_id = '1ece538c-8d39-4bea-8819-b0927dee4751';
-- Résultat attendu: 40
```

## 🛠️ Scripts utiles

### Générer de nouveaux templates
```bash
# Template standard (40 séries)
node scripts/generate-expression-ecrite-template.js

# Template personnalisé
node scripts/generate-expression-ecrite-template.js --count 20 --time 1800

# Seulement les séries
node scripts/generate-expression-ecrite-template.js --series-only
```

### Tester un template
```bash
node scripts/test-series-import.js
```

### Récupérer les IDs après import
```bash
# Afficher les instructions complètes
node scripts/get-series-ids.js

# Afficher seulement la requête SQL
node scripts/get-series-ids.js --sql

# Générer le template des questions (après avoir récupéré les IDs)
node scripts/get-series-ids.js --generate-questions "id1,id2,id3,..."
```

## 🎉 Résultat final

Une fois l'importation terminée, vous aurez :

- **40 séries de tests** d'expression écrite
- **40 questions** avec des sujets variés (60-80 mots)
- **Durée**: 60 minutes par test
- **Accès**: Gratuit
- **Points**: 10 par question

## 📞 Support

Si vous rencontrez des problèmes :

1. **Vérifiez les logs** d'importation dans l'interface admin
2. **Testez le template** avec le script de test
3. **Vérifiez les permissions** admin de votre utilisateur
4. **Consultez la console** du navigateur pour les erreurs JavaScript

## 🔗 Fichiers créés

- ✅ `public/templates/expression-ecrite-series-template.csv` - Template corrigé
- ✅ `public/templates/expression-ecrite-questions-template.csv` - Template questions
- ✅ `scripts/generate-expression-ecrite-template.js` - Générateur automatique
- ✅ `scripts/test-series-import.js` - Script de test
- ✅ `scripts/get-series-ids.js` - Assistant pour les IDs
- ✅ `docs/expression-ecrite-templates-guide.md` - Guide détaillé

**Le problème d'importation est maintenant résolu ! 🎯** 