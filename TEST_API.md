# Test de l'API d'évaluation IA

## Vérifications préalables

### 1. Vérifier les variables d'environnement

Ouvrez `.env.local` et vérifiez:

```bash
OPENAI_API_KEY=sk-proj-...
OPENAI_ASSISTANT_ID=asst_3bBX8SR5xS3fl7VmHlSMjM1Z
```

### 2. Redémarrer le serveur

```bash
# Arrêter le serveur (Ctrl+C)
npm run dev
```

### 3. Tester l'API directement

Ouvrez un nouveau terminal et testez:

```bash
# Remplacez ATTEMPT_ID par un vrai ID de votre base de données
curl -X POST http://localhost:3000/api/ai/evaluate-simulator \
  -H "Content-Type: application/json" \
  -d '{
    "attempt_id": "VOTRE_ATTEMPT_ID",
    "task_number": 1
  }'
```

## Erreurs courantes et solutions

### Erreur: "OPENAI_API_KEY non configurée"

**Solution:**
1. Créez/modifiez `.env.local`
2. Ajoutez: `OPENAI_API_KEY=sk-proj-votre-cle`
3. Redémarrez le serveur

### Erreur: "OPENAI_ASSISTANT_ID non configurée"

**Solution:**
1. Ajoutez dans `.env.local`: `OPENAI_ASSISTANT_ID=asst_3bBX8SR5xS3fl7VmHlSMjM1Z`
2. Redémarrez le serveur

### Erreur: "Attempt non trouvé"

**Solution:**
Créez un attempt de test dans Supabase:

```sql
-- 1. Trouver un user_id
SELECT id, email FROM auth.users LIMIT 1;

-- 2. Trouver une combination_id
SELECT id, title FROM expression_ecrite_combinations LIMIT 1;

-- 3. Créer un attempt
INSERT INTO simulator_attempts (user_id, combination_id, status)
VALUES ('VOTRE_USER_ID', 'VOTRE_COMBINATION_ID', 'submitted')
RETURNING id;

-- 4. Créer une réponse
INSERT INTO simulator_answers (attempt_id, task_id, task_number, content, word_count)
VALUES (
  'ATTEMPT_ID_RETOURNÉ',
  (SELECT id FROM expression_ecrite_tasks WHERE task_number = 1 LIMIT 1),
  1,
  'Bonjour, je m''appelle Marie. J''habite à Paris depuis 5 ans. J''aime beaucoup cette ville car elle est très belle et il y a beaucoup de choses à faire. Mon quartier préféré est le Marais parce qu''il y a de jolies boutiques et des cafés sympathiques.',
  60
);
```

### Erreur: "OpenAI API error"

**Solution:**
1. Vérifiez que votre clé API OpenAI est valide
2. Vérifiez que vous avez des crédits sur votre compte OpenAI
3. Vérifiez que l'assistant existe: https://platform.openai.com/assistants

## Logs à vérifier

Dans le terminal du serveur, vous devriez voir:

```
📥 Requête reçue: { attempt_id: '...', task_number: 1 }
🤖 Évaluation IA Simulateur en cours: { attempt_id: '...', task_number: 1 }
✅ Évaluation terminée: { score: 18, ... }
```

Si vous voyez `❌`, lisez le message d'erreur qui suit.

## Test complet étape par étape

1. **Vérifier .env.local** ✓
2. **Redémarrer serveur** ✓
3. **Créer un attempt de test** ✓
4. **Tester l'API avec curl** ✓
5. **Vérifier les logs** ✓
6. **Tester dans l'interface** ✓

Si tout fonctionne, vous verrez le design moderne avec les résultats!
