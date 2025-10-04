# Test du Simulateur en Local

## Étape 1: Créer la table simulator_responses

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Créez une nouvelle query
5. **Copiez-collez** le contenu de `supabase/migrations/create_simulator_tables.sql`
6. Cliquez sur **Run**

Vous devriez voir: ✅ "Table créée avec succès"

## Étape 2: Vérifier que la table existe

Exécutez cette requête:

```sql
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'simulator_responses'
ORDER BY ordinal_position;
```

Vous devriez voir toutes les colonnes (id, user_id, combination_id, task_id, user_text, ai_score, etc.)

## Étape 3: Tester l'API en local

1. Assurez-vous que `.env.local` contient:
```bash
OPENAI_API_KEY=sk-proj-votre-cle
OPENAI_ASSISTANT_ID=asst_3bBX8SR5xS3fl7VmHlSMjM1Z
```

2. Démarrez le serveur local:
```bash
npm run dev
```

3. Testez l'API avec curl ou Postman:

```bash
curl -X POST http://localhost:3000/api/ai/evaluate-simulator \
  -H "Content-Type: application/json" \
  -d '{
    "response_id": "VOTRE_RESPONSE_ID_ICI"
  }'
```

## Étape 4: Créer une réponse de test

Exécutez dans SQL Editor:

```sql
-- Remplacez USER_ID, COMBINATION_ID et TASK_ID par des valeurs réelles
INSERT INTO public.simulator_responses (
  user_id,
  combination_id,
  task_id,
  user_text,
  word_count
) VALUES (
  'VOTRE_USER_ID',
  'UNE_COMBINATION_ID',
  'UNE_TASK_ID',
  'Bonjour, je m''appelle Marie et j''habite à Paris. J''aime beaucoup lire des livres et écouter de la musique. Mon livre préféré est "Le Petit Prince" parce qu''il raconte une belle histoire sur l''amitié et l''amour. Quand j''ai du temps libre, je vais au parc avec mes amis pour faire du sport. Nous jouons au football et au tennis. C''est très amusant et ça me permet de rester en bonne santé.',
  82
) RETURNING id;
```

Notez l'ID retourné et utilisez-le pour tester l'API.

## Étape 5: Tester l'évaluation IA

Avec l'ID de la réponse créée:

```bash
curl -X POST http://localhost:3000/api/ai/evaluate-simulator \
  -H "Content-Type: application/json" \
  -d '{
    "response_id": "ID_DE_LA_REPONSE"
  }'
```

Vous devriez recevoir:
```json
{
  "success": true,
  "evaluation": {
    "score": 15,
    "details": { ... },
    "feedback": "...",
    "points_forts": [...],
    "points_amelioration": [...],
    "niveau_estime": "B1",
    "conseils_pratiques": [...]
  }
}
```

## Étape 6: Vérifier dans la DB

```sql
SELECT 
  id,
  ai_score,
  ai_niveau_estime,
  ai_evaluated_at,
  ai_points_forts,
  ai_points_amelioration
FROM public.simulator_responses
WHERE ai_score IS NOT NULL
ORDER BY ai_evaluated_at DESC
LIMIT 5;
```

## Problèmes courants

### Erreur: "OPENAI_API_KEY non configuré"
- Vérifiez `.env.local`
- Redémarrez le serveur (`npm run dev`)

### Erreur: "OPENAI_ASSISTANT_ID non configuré"
- Ajoutez l'ID de votre assistant dans `.env.local`

### Erreur: "relation does not exist"
- Exécutez d'abord `create_simulator_tables.sql`

### Erreur: "new row violates row-level security"
- Vérifiez que l'utilisateur est authentifié
- Vérifiez que `user_id` correspond à l'utilisateur connecté

## Résultat attendu

✅ Table créée
✅ API répond avec évaluation
✅ Données sauvegardées dans la DB
✅ Crédits déduits (si user_id valide)

Prêt pour la production! 🚀
