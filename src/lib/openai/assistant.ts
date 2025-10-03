import OpenAI from 'openai';

// Initialiser le client OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ID de l'assistant (sera créé une fois et réutilisé)
export const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID || '';

/**
 * Instructions pour l'assistant - Professeur d'évaluation TCF
 */
export const ASSISTANT_INSTRUCTIONS = `Tu es un professeur expert en évaluation du Test de Connaissance du Français (TCF).

## Ton rôle
Tu évalues les productions écrites et orales des candidats selon les critères officiels du TCF.

## Grille d'évaluation TCF (sur 25 points)

### Expression Écrite (EE)
**Critères:**
1. **Adéquation au sujet** (0-6 points)
   - Respect de la consigne
   - Pertinence du contenu
   - Développement des idées

2. **Capacité à argumenter** (0-6 points)
   - Clarté de l'argumentation
   - Exemples et justifications
   - Cohérence logique

3. **Compétence lexicale** (0-6 points)
   - Richesse du vocabulaire
   - Précision des termes
   - Variété des expressions

4. **Compétence grammaticale** (0-7 points)
   - Correction grammaticale
   - Structures variées
   - Conjugaison et accords

### Expression Orale (EO)
**Critères:**
1. **Adéquation et contenu** (0-6 points)
   - Respect du sujet
   - Pertinence des idées
   - Développement

2. **Cohérence et fluidité** (0-6 points)
   - Organisation du discours
   - Connecteurs logiques
   - Fluidité de l'expression

3. **Compétence lexicale** (0-6 points)
   - Vocabulaire approprié
   - Richesse lexicale
   - Précision

4. **Compétence grammaticale** (0-7 points)
   - Correction des structures
   - Variété grammaticale
   - Conjugaison

## Format de réponse OBLIGATOIRE

Tu DOIS répondre au format JSON suivant:

\`\`\`json
{
  "score": 18,
  "details": {
    "adequation": 5,
    "argumentation_ou_coherence": 4,
    "lexique": 5,
    "grammaire": 4
  },
  "feedback": "Votre production montre une bonne maîtrise...",
  "points_forts": [
    "Vocabulaire riche et varié",
    "Bonne structure argumentative"
  ],
  "points_amelioration": [
    "Attention aux accords du participe passé",
    "Diversifier les connecteurs logiques"
  ],
  "niveau_estime": "B2"
}
\`\`\`

## Consignes importantes
- Sois bienveillant mais rigoureux
- Donne des exemples concrets tirés de la production
- Propose des pistes d'amélioration constructives
- Estime le niveau CECRL (A1, A2, B1, B2, C1, C2)
- Pour l'oral: base-toi sur la transcription pour évaluer
`;

/**
 * Créer l'assistant (à exécuter une seule fois)
 */
export async function createAssistant() {
  const assistant = await openai.beta.assistants.create({
    name: "Professeur TCF - Évaluateur",
    instructions: ASSISTANT_INSTRUCTIONS,
    model: "gpt-4o",
    tools: [{ type: "code_interpreter" }],
    temperature: 0.3, // Plus déterministe pour l'évaluation
  });

  console.log('✅ Assistant créé:', assistant.id);
  console.log('📝 Ajoutez cette ligne à votre .env.local:');
  console.log(`OPENAI_ASSISTANT_ID=${assistant.id}`);
  
  return assistant;
}

/**
 * Évaluer une Expression Écrite
 */
export async function evaluateEE(text: string, taskDescription: string) {
  if (!ASSISTANT_ID) {
    throw new Error('OPENAI_ASSISTANT_ID non configuré');
  }

  // Créer un thread
  const thread = await openai.beta.threads.create();

  // Envoyer le message
  await openai.beta.threads.messages.create(thread.id, {
    role: "user",
    content: `## Consigne de la tâche
${taskDescription}

## Production du candidat
${text}

Évalue cette production écrite selon les critères TCF et réponds UNIQUEMENT au format JSON demandé.`,
  });

  // Exécuter l'assistant
  const run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: ASSISTANT_ID,
  });

  // Attendre la fin de l'exécution
  let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
  
  while (runStatus.status !== 'completed') {
    if (runStatus.status === 'failed' || runStatus.status === 'cancelled' || runStatus.status === 'expired') {
      throw new Error(`Run failed with status: ${runStatus.status}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
  }

  // Récupérer la réponse
  const messages = await openai.beta.threads.messages.list(thread.id);
  const lastMessage = messages.data[0];
  
  if (lastMessage.role !== 'assistant') {
    throw new Error('Pas de réponse de l\'assistant');
  }

  const content = lastMessage.content[0];
  if (content.type !== 'text') {
    throw new Error('Réponse non textuelle');
  }

  // Parser le JSON
  const responseText = content.text.value;
  const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    throw new Error('Format de réponse invalide');
  }

  const evaluation = JSON.parse(jsonMatch[1] || jsonMatch[0]);
  
  return {
    ...evaluation,
    thread_id: thread.id,
  };
}

/**
 * Évaluer une Expression Orale (avec transcription Whisper)
 */
export async function evaluateEO(audioUrl: string, taskDescription: string) {
  if (!ASSISTANT_ID) {
    throw new Error('OPENAI_ASSISTANT_ID non configuré');
  }

  // 1. Télécharger l'audio
  const audioResponse = await fetch(audioUrl);
  if (!audioResponse.ok) {
    throw new Error('Impossible de télécharger l\'audio');
  }
  
  const audioBuffer = await audioResponse.arrayBuffer();
  const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
  
  // 2. Transcrire avec Whisper
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-1');
  formData.append('language', 'fr');
  
  const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!transcriptionResponse.ok) {
    throw new Error('Erreur transcription Whisper');
  }

  const { text: transcription } = await transcriptionResponse.json();

  // 3. Évaluer avec l'assistant
  const thread = await openai.beta.threads.create();

  await openai.beta.threads.messages.create(thread.id, {
    role: "user",
    content: `## Consigne de la tâche
${taskDescription}

## Transcription de la production orale du candidat
${transcription}

Évalue cette production orale selon les critères TCF et réponds UNIQUEMENT au format JSON demandé.`,
  });

  const run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: ASSISTANT_ID,
  });

  let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
  
  while (runStatus.status !== 'completed') {
    if (runStatus.status === 'failed' || runStatus.status === 'cancelled' || runStatus.status === 'expired') {
      throw new Error(`Run failed with status: ${runStatus.status}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
  }

  const messages = await openai.beta.threads.messages.list(thread.id);
  const lastMessage = messages.data[0];
  
  if (lastMessage.role !== 'assistant') {
    throw new Error('Pas de réponse de l\'assistant');
  }

  const content = lastMessage.content[0];
  if (content.type !== 'text') {
    throw new Error('Réponse non textuelle');
  }

  const responseText = content.text.value;
  const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    throw new Error('Format de réponse invalide');
  }

  const evaluation = JSON.parse(jsonMatch[1] || jsonMatch[0]);
  
  return {
    ...evaluation,
    transcription,
    thread_id: thread.id,
  };
}

export { openai };
