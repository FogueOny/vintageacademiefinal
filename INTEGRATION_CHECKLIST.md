# ✅ Checklist d'Intégration - Réponses Vocales Examen Blanc

## 📦 Fichiers Créés

### Base de Données
- ✅ `supabase/schema/expression_responses.sql` - Table + RLS + Vue
- ✅ `supabase/storage_exam_oral.sql` - Bucket + Policies

### API Routes
- ✅ `/api/exam-submissions/[id]/expressions/route.ts` - GET/POST réponses
- ✅ `/api/exam-submissions/[id]/expressions/[responseId]/correct/route.ts` - Correction admin

### Composants
- ✅ `src/components/exam/AudioRecorder.tsx` - Enregistrement audio utilisateur
- ✅ `src/components/exam/AudioPlayer.tsx` - Lecteur audio admin
- ✅ `src/components/exam/ExpressionCorrectionForm.tsx` - Formulaire correction

### Documentation
- ✅ `EXAM_BLANC_VOCAL_SETUP.md` - Guide complet
- ✅ `INTEGRATION_CHECKLIST.md` - Ce fichier

## 🔧 Étapes d'Intégration

### 1. Base de Données (URGENT - À faire en premier)

```bash
# Se connecter à Supabase Dashboard
# SQL Editor → Nouvelle requête

# Exécuter dans l'ordre:
1. Copier le contenu de supabase/schema/expression_responses.sql
2. Exécuter
3. Copier le contenu de supabase/storage_exam_oral.sql  
4. Exécuter

# Vérifier:
- Table: submission_expression_responses existe
- Vue: v_expression_responses_enriched existe
- Bucket: exam-oral-responses existe dans Storage
```

### 2. Page Utilisateur - Expression Écrite

**Fichier**: `src/app/(dashboard)/dashboard/exam-blanc/[id]/page.tsx`

**Modifications à apporter**:

```typescript
// 1. Ajouter state pour stocker les réponses EE
const [eeResponses, setEeResponses] = useState<Record<number, string>>({});

// 2. Modifier la fonction submitStage pour EE
const submitStageEE = async () => {
  if (!submissionId || !user) return false;
  
  try {
    // Enregistrer chaque tâche EE
    for (const taskNum of [1, 2, 3]) {
      const text = eeNotes[taskNum];
      if (!text || !text.trim()) continue;
      
      const wordCount = text.trim().split(/\s+/).length;
      
      await fetch(`/api/exam-submissions/${submissionId}/expressions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'expression_ecrite',
          task_number: taskNum,
          text_response: text,
          word_count: wordCount,
        }),
      });
    }
    
    // Marquer EE comme terminé
    return await submitStage('EE');
  } catch (error) {
    console.error('Erreur soumission EE:', error);
    return false;
  }
};

// 3. Remplacer l'appel submitStage('EE') par submitStageEE()
// Ligne ~586: Remplacer
<Button onClick={() => submitStage('EE')} disabled={isSubmitting}>
// Par:
<Button onClick={submitStageEE} disabled={isSubmitting}>
```

### 3. Page Utilisateur - Expression Orale

**Fichier**: `src/app/(dashboard)/dashboard/exam-blanc/[id]/page.tsx`

**Modifications à apporter**:

```typescript
// 1. Importer le composant
import { AudioRecorder } from '@/components/exam/AudioRecorder';

// 2. Ajouter state pour les audios
const [eoAudios, setEoAudios] = useState<Record<number, { url: string; duration: number }>>({});

// 3. Dans la section EO (ligne ~492), REMPLACER le textarea par:
{step === 'eo' && (
  <Card className="shadow-sm">
    <CardHeader>
      <CardTitle>Expression orale ({index+1}/{eo.length})</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {/* Afficher la question */}
      {(() => {
        const s = eo[index] as any;
        const partie = s?.partie_number;
        const sujet = s?.subject_number;
        const question = s?.question;
        const content = s?.content;
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-700">
              {typeof partie !== 'undefined' && <Badge variant="outline">Partie {partie}</Badge>}
              {typeof sujet !== 'undefined' && <Badge variant="outline">Sujet #{sujet}</Badge>}
            </div>
            {question && <div className="text-sm font-medium">{question}</div>}
            {content && (
              <div className="text-sm bg-gray-50 p-3 rounded border whitespace-pre-wrap">{content}</div>
            )}
          </div>
        );
      })()}
      
      {/* Composant d'enregistrement audio */}
      {user && submissionId && (
        <AudioRecorder
          userId={user.id}
          submissionId={submissionId}
          taskIndex={index}
          maxDurationSeconds={180}
          onAudioReady={(audioUrl, duration) => {
            setEoAudios(prev => ({
              ...prev,
              [index]: { url: audioUrl, duration }
            }));
          }}
        />
      )}
      
      {/* Notes optionnelles */}
      <div className="space-y-2">
        <div className="text-xs text-gray-500">Notes personnelles (optionnel)</div>
        <textarea
          className="w-full border rounded p-2 text-sm min-h-[80px]"
          value={eoNotes[index] || ''}
          onChange={(e) => setEoNotes({ ...eoNotes, [index]: e.target.value })}
          placeholder="Notes pour vous aider (non enregistrées)"
        />
      </div>
    </CardContent>
  </Card>
)}

// 4. Créer fonction submitStageEO
const submitStageEO = async () => {
  if (!submissionId || !user) return false;
  
  try {
    // Enregistrer chaque audio EO
    for (let i = 0; i < eo.length; i++) {
      const audio = eoAudios[i];
      if (!audio) {
        alert(`Veuillez enregistrer votre réponse pour la partie ${i + 1}`);
        return false;
      }
      
      const s = eo[i] as any;
      await fetch(`/api/exam-submissions/${submissionId}/expressions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'expression_orale',
          partie_number: s.partie_number,
          audio_url: audio.url,
          audio_duration_seconds: audio.duration,
        }),
      });
    }
    
    // Marquer EO comme terminé
    return await submitStage('EO');
  } catch (error) {
    console.error('Erreur soumission EO:', error);
    return false;
  }
};

// 5. Remplacer submitStage('EO') par submitStageEO()
// Ligne ~593: Remplacer
<Button onClick={() => submitStage('EO')} disabled={isSubmitting}>
// Par:
<Button onClick={submitStageEO} disabled={isSubmitting}>
```

### 4. Page Admin - Affichage des Réponses

**Fichier**: `src/app/admin-dashboard/exam-blanc/submissions/[id]/page.tsx`

**Modifications à apporter**:

```typescript
// 1. Importer les composants
import { AudioPlayer } from '@/components/exam/AudioPlayer';
import { ExpressionCorrectionForm } from '@/components/exam/ExpressionCorrectionForm';

// 2. Ajouter state
const [expressionResponses, setExpressionResponses] = useState<any[]>([]);

// 3. Charger les réponses
useEffect(() => {
  const loadExpressions = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/exam-submissions/${id}/expressions`);
      if (res.ok) {
        const json = await res.json();
        setExpressionResponses(json.data || []);
      }
    } catch (error) {
      console.error('Erreur chargement expressions:', error);
    }
  };
  loadExpressions();
}, [id]);

// 4. Ajouter sections après les réponses CO/CE (après ligne ~280)

{/* Expression Écrite */}
<Card>
  <CardHeader>
    <CardTitle>Expression Écrite (EE)</CardTitle>
  </CardHeader>
  <CardContent className="space-y-6">
    {expressionResponses
      .filter(r => r.type === 'expression_ecrite')
      .sort((a, b) => (a.task_number || 0) - (b.task_number || 0))
      .map(response => (
        <div key={response.id} className="border-l-4 border-orange-500 pl-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Tâche {response.task_number}</h3>
            {response.admin_score !== null && (
              <Badge variant="secondary">Score: {response.admin_score}/25</Badge>
            )}
          </div>
          
          <div className="bg-gray-50 p-4 rounded border">
            <div className="whitespace-pre-wrap text-sm">{response.text_response}</div>
            <div className="text-xs text-gray-500 mt-2">
              Mots: {response.word_count}
            </div>
          </div>
          
          {response.admin_feedback && (
            <div className="bg-blue-50 p-3 rounded border border-blue-200 text-sm">
              <div className="font-medium text-blue-900 mb-1">Feedback:</div>
              <div className="text-blue-800">{response.admin_feedback}</div>
            </div>
          )}
          
          <ExpressionCorrectionForm
            responseId={response.id}
            submissionId={id}
            type="expression_ecrite"
            taskNumber={response.task_number}
            currentScore={response.admin_score}
            currentFeedback={response.admin_feedback}
            onCorrectionSaved={() => {
              load(); // Recharger la soumission
              loadExpressions(); // Recharger les expressions
            }}
          />
        </div>
      ))}
    {expressionResponses.filter(r => r.type === 'expression_ecrite').length === 0 && (
      <div className="text-sm text-gray-500 text-center py-4">
        Aucune réponse Expression Écrite
      </div>
    )}
  </CardContent>
</Card>

{/* Expression Orale */}
<Card>
  <CardHeader>
    <CardTitle>Expression Orale (EO)</CardTitle>
  </CardHeader>
  <CardContent className="space-y-6">
    {expressionResponses
      .filter(r => r.type === 'expression_orale')
      .sort((a, b) => (a.partie_number || 0) - (b.partie_number || 0))
      .map(response => (
        <div key={response.id} className="border-l-4 border-orange-500 pl-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Partie {response.partie_number}</h3>
            {response.admin_score !== null && (
              <Badge variant="secondary">Score: {response.admin_score}/25</Badge>
            )}
          </div>
          
          <AudioPlayer
            audioUrl={response.audio_url}
            duration={response.audio_duration_seconds}
            title={`Réponse orale - Partie ${response.partie_number}`}
          />
          
          {response.admin_feedback && (
            <div className="bg-blue-50 p-3 rounded border border-blue-200 text-sm">
              <div className="font-medium text-blue-900 mb-1">Feedback:</div>
              <div className="text-blue-800">{response.admin_feedback}</div>
            </div>
          )}
          
          <ExpressionCorrectionForm
            responseId={response.id}
            submissionId={id}
            type="expression_orale"
            partieNumber={response.partie_number}
            currentScore={response.admin_score}
            currentFeedback={response.admin_feedback}
            onCorrectionSaved={() => {
              load();
              loadExpressions();
            }}
          />
        </div>
      ))}
    {expressionResponses.filter(r => r.type === 'expression_orale').length === 0 && (
      <div className="text-sm text-gray-500 text-center py-4">
        Aucune réponse Expression Orale
      </div>
    )}
  </CardContent>
</Card>
```

## 🧪 Tests à Effectuer

### Tests Utilisateur
- [ ] Enregistrer un audio EO (vérifier permissions micro)
- [ ] Prévisualiser l'audio avant envoi
- [ ] Uploader l'audio vers Supabase
- [ ] Soumettre un texte EE
- [ ] Vérifier que les réponses sont sauvegardées
- [ ] Tester sur mobile (permissions micro)

### Tests Admin
- [ ] Voir les réponses EE d'un étudiant
- [ ] Écouter les audios EO
- [ ] Changer la vitesse de lecture
- [ ] Télécharger un audio
- [ ] Corriger une réponse EE (score + feedback)
- [ ] Corriger une réponse EO (score + feedback)
- [ ] Vérifier que le score total est recalculé

### Tests de Sécurité
- [ ] User ne peut pas voir les réponses d'un autre user
- [ ] User ne peut pas modifier une réponse déjà corrigée
- [ ] Non-admin ne peut pas corriger
- [ ] Storage bucket est privé

## 📊 Ordre d'Exécution

1. **Base de données** (5 min)
2. **Tests API** avec Postman/Thunder Client (10 min)
3. **Page utilisateur EE** (30 min)
4. **Page utilisateur EO** (45 min)
5. **Page admin** (30 min)
6. **Tests end-to-end** (30 min)

**Total estimé**: ~2h30

## 🚀 Déploiement

```bash
# 1. Commit les changements
cd /Users/user/Documents/vintageacademiefinal
git add .
git commit -m "feat: Add vocal responses for Exam Blanc EO + EE text storage

- Add submission_expression_responses table
- Add exam-oral-responses storage bucket
- Add API routes for expressions CRUD and corrections
- Add AudioRecorder component for users
- Add AudioPlayer + CorrectionForm for admins
- Update exam blanc user/admin pages"

# 2. Push vers GitHub
git push origin main

# 3. Vercel déploiera automatiquement

# 4. Exécuter les SQL sur Supabase Production
# - expression_responses.sql
# - storage_exam_oral.sql
```

## 📞 Support

Si problème, vérifier:
1. Console navigateur (erreurs JS)
2. Logs Supabase (RLS, Storage)
3. Network tab (requêtes API)
4. Documentation: `EXAM_BLANC_VOCAL_SETUP.md`
