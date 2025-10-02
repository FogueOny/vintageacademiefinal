# 🎤 Configuration Réponses Vocales - Examen Blanc

## 📋 Résumé des Changements

Ce système permet aux utilisateurs d'enregistrer leurs réponses orales pour l'Expression Orale (EO) et de soumettre leurs textes pour l'Expression Écrite (EE). Les admins peuvent ensuite écouter les audios et corriger les réponses.

## 🗄️ Base de Données

### 1. Exécuter les migrations SQL

```bash
# Dans Supabase SQL Editor, exécuter dans l'ordre:

# 1. Créer la table des réponses
supabase/schema/expression_responses.sql

# 2. Configurer le storage pour les audios
supabase/storage_exam_oral.sql
```

### 2. Vérifier les tables créées

- `submission_expression_responses`: Stocke les réponses EE/EO
- `v_expression_responses_enriched`: Vue enrichie avec infos utilisateur
- Bucket Storage: `exam-oral-responses`

## 🔌 API Routes Créées

### Pour les Utilisateurs

**POST** `/api/exam-submissions/[id]/expressions`
- Enregistrer une réponse EE (texte) ou EO (audio URL)
- Body: `{ type, task_number, text_response, audio_url, ... }`

**GET** `/api/exam-submissions/[id]/expressions`
- Récupérer toutes les réponses d'une soumission

### Pour les Admins

**POST** `/api/exam-submissions/[id]/expressions/[responseId]/correct`
- Corriger une réponse (score + feedback)
- Body: `{ admin_score, admin_feedback }`

## 🎨 Composants Créés

### 1. `AudioRecorder.tsx`
Composant d'enregistrement audio pour les utilisateurs
- Enregistrement avec timer
- Pause/Reprise
- Prévisualisation
- Upload vers Supabase Storage

### 2. `AudioPlayer.tsx`
Lecteur audio pour les admins
- Play/Pause
- Barre de progression
- Vitesse de lecture (0.5x à 2x)
- Téléchargement

### 3. `ExpressionCorrectionForm.tsx`
Formulaire de correction admin
- Score (0-25)
- Feedback texte
- Validation

## 📝 Prochaines Étapes d'Intégration

### Étape 1: Modifier la page utilisateur
`src/app/(dashboard)/dashboard/exam-blanc/[id]/page.tsx`

```typescript
// Importer les composants
import { AudioRecorder } from '@/components/exam/AudioRecorder';

// Dans la section Expression Orale (step === 'eo'):
// Remplacer le textarea par:
<AudioRecorder
  userId={user.id}
  submissionId={submissionId || ''}
  taskIndex={index}
  maxDurationSeconds={180}
  onAudioReady={(audioUrl, duration) => {
    // Enregistrer dans state local
    setEoAudioUrls({ ...eoAudioUrls, [index]: { url: audioUrl, duration } });
  }}
/>

// Modifier submitStage('EO') pour envoyer les audios:
const submitEO = async () => {
  for (const [idx, audio] of Object.entries(eoAudioUrls)) {
    await fetch(`/api/exam-submissions/${submissionId}/expressions`, {
      method: 'POST',
      body: JSON.stringify({
        type: 'expression_orale',
        partie_number: eo[idx].partie_number,
        audio_url: audio.url,
        audio_duration_seconds: audio.duration,
      })
    });
  }
};
```

### Étape 2: Modifier la page admin
`src/app/admin-dashboard/exam-blanc/submissions/[id]/page.tsx`

```typescript
// Importer les composants
import { AudioPlayer } from '@/components/exam/AudioPlayer';
import { ExpressionCorrectionForm } from '@/components/exam/ExpressionCorrectionForm';

// Charger les réponses EE/EO
useEffect(() => {
  const loadExpressions = async () => {
    const res = await fetch(`/api/exam-submissions/${id}/expressions`);
    const json = await res.json();
    setExpressionResponses(json.data || []);
  };
  loadExpressions();
}, [id]);

// Afficher section Expression Écrite
{expressionResponses
  .filter(r => r.type === 'expression_ecrite')
  .map(response => (
    <Card key={response.id}>
      <CardHeader>
        <CardTitle>Tâche {response.task_number}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="whitespace-pre-wrap mb-4">
          {response.text_response}
        </div>
        <div className="text-xs text-gray-500">
          Mots: {response.word_count}
        </div>
        <ExpressionCorrectionForm
          responseId={response.id}
          submissionId={id}
          type="expression_ecrite"
          taskNumber={response.task_number}
          currentScore={response.admin_score}
          currentFeedback={response.admin_feedback}
          onCorrectionSaved={() => loadExpressions()}
        />
      </CardContent>
    </Card>
  ))}

// Afficher section Expression Orale
{expressionResponses
  .filter(r => r.type === 'expression_orale')
  .map(response => (
    <Card key={response.id}>
      <CardHeader>
        <CardTitle>Partie {response.partie_number}</CardTitle>
      </CardHeader>
      <CardContent>
        <AudioPlayer
          audioUrl={response.audio_url}
          duration={response.audio_duration_seconds}
          title={`Réponse orale - Partie ${response.partie_number}`}
        />
        <ExpressionCorrectionForm
          responseId={response.id}
          submissionId={id}
          type="expression_orale"
          partieNumber={response.partie_number}
          currentScore={response.admin_score}
          currentFeedback={response.admin_feedback}
          onCorrectionSaved={() => loadExpressions()}
        />
      </CardContent>
    </Card>
  ))}
```

### Étape 3: Modifier submitStage pour EE
Dans la page utilisateur, enregistrer aussi les textes EE:

```typescript
const submitEE = async () => {
  for (const [taskNum, text] of Object.entries(eeNotes)) {
    if (!text) continue;
    const wordCount = text.trim().split(/\s+/).length;
    await fetch(`/api/exam-submissions/${submissionId}/expressions`, {
      method: 'POST',
      body: JSON.stringify({
        type: 'expression_ecrite',
        task_number: parseInt(taskNum),
        text_response: text,
        word_count: wordCount,
      })
    });
  }
};
```

## ✅ Checklist de Déploiement

- [ ] Exécuter `expression_responses.sql` sur Supabase
- [ ] Exécuter `storage_exam_oral.sql` sur Supabase
- [ ] Vérifier que le bucket `exam-oral-responses` existe
- [ ] Tester les permissions RLS
- [ ] Intégrer AudioRecorder dans la page utilisateur
- [ ] Intégrer AudioPlayer + CorrectionForm dans la page admin
- [ ] Tester l'enregistrement audio (permissions micro)
- [ ] Tester l'upload vers Supabase Storage
- [ ] Tester la correction admin
- [ ] Vérifier le calcul du score total

## 🔒 Sécurité

- ✅ RLS activé sur `submission_expression_responses`
- ✅ Users peuvent uniquement voir/modifier leurs propres réponses
- ✅ Admins peuvent tout voir et corriger
- ✅ Storage bucket privé avec policies RLS
- ✅ URLs signées avec expiration (1 an)

## 📊 Calcul du Score Total

```
Score Total = Score CO/CE + Score EE + Score EO

- CO/CE: Auto-calculé (nombre de bonnes réponses)
- EE: Somme des admin_score des 3 tâches (max 75)
- EO: Somme des admin_score des 3 parties (max 75)
```

Le score est automatiquement recalculé à chaque correction admin.

## 🐛 Dépannage

### L'enregistrement audio ne fonctionne pas
- Vérifier les permissions du navigateur (micro)
- Tester sur HTTPS (requis pour MediaRecorder)
- Vérifier la console pour les erreurs

### L'upload échoue
- Vérifier que le bucket existe
- Vérifier les policies RLS
- Vérifier la taille du fichier (limite Supabase)

### Les corrections ne s'enregistrent pas
- Vérifier que l'utilisateur est admin
- Vérifier les logs API
- Vérifier les permissions RLS
