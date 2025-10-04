// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { evaluateEE } from '@/lib/openai/assistant';
import { supabaseServiceClient } from '@/lib/supabase/service-client';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 secondes max

/**
 * POST /api/ai/evaluate-simulator
 * Évalue une réponse du simulateur avec l'Assistant OpenAI
 * Utilise la structure existante: simulator_attempts + simulator_answers + ai_evaluations
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier les variables d'environnement
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY manquante');
      return NextResponse.json(
        { error: 'OPENAI_API_KEY non configurée. Ajoutez-la dans .env.local' },
        { status: 500 }
      );
    }

    if (!process.env.OPENAI_ASSISTANT_ID) {
      console.error('❌ OPENAI_ASSISTANT_ID manquante');
      return NextResponse.json(
        { error: 'OPENAI_ASSISTANT_ID non configurée. Ajoutez-la dans .env.local' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { attempt_id, task_number } = body;

    console.log('📥 Requête reçue:', { attempt_id, task_number });

    if (!attempt_id || !task_number) {
      return NextResponse.json(
        { error: 'attempt_id et task_number requis' },
        { status: 400 }
      );
    }

    // 1. Récupérer l'attempt
    const { data: attempt, error: attemptError } = await supabaseServiceClient
      .from('simulator_attempts')
      .select('id, user_id, combination_id')
      .eq('id', attempt_id)
      .single();

    if (attemptError || !attempt) {
      return NextResponse.json(
        { error: 'Attempt non trouvé' },
        { status: 404 }
      );
    }

    // 2. Récupérer la réponse (answer)
    const { data: answer, error: answerError } = await supabaseServiceClient
      .from('simulator_answers')
      .select(`
        id,
        content,
        word_count,
        task:expression_ecrite_tasks(
          id,
          task_number,
          title,
          description,
          word_count_min,
          word_count_max,
          instructions
        )
      `)
      .eq('attempt_id', attempt_id)
      .eq('task_number', task_number)
      .single();

    if (answerError || !answer) {
      return NextResponse.json(
        { error: 'Réponse non trouvée pour cette tâche' },
        { status: 404 }
      );
    }

    if (!answer.content) {
      return NextResponse.json(
        { error: 'Pas de texte à évaluer' },
        { status: 400 }
      );
    }

    // 3. Construire la consigne complète
    const task = answer.task;
    const taskDescription = `
# ${task?.title || `Tâche ${task?.task_number}`}

## Consigne
${task?.description || ''}

## Instructions
${task?.instructions || ''}

## Contraintes
- Nombre de mots: ${task?.word_count_min || 60} - ${task?.word_count_max || 120} mots
- Nombre de mots du candidat: ${answer.word_count || 0} mots

## Contexte
Cette évaluation est pour le **SIMULATEUR** (entraînement). Donne un feedback pédagogique détaillé avec des conseils pratiques.
`.trim();

    // 4. Évaluer avec l'Assistant OpenAI
    console.log('🤖 Évaluation IA Simulateur en cours:', { attempt_id, task_number });
    const evaluation = await evaluateEE(answer.content, taskDescription);
    console.log('✅ Évaluation terminée:', evaluation);

    // 5. Sauvegarder dans ai_evaluations
    const { data: aiEval, error: evalError } = await supabaseServiceClient
      .from('ai_evaluations')
      .insert({
        attempt_id,
        task_number,
        model: 'gpt-4o-assistant',
        score_20: Math.round((evaluation.score / 25) * 20), // Convertir /25 en /20
        cecr_level: evaluation.niveau_estime,
        positives: evaluation.points_forts || [],
        improvements: evaluation.points_amelioration || [],
        suggested_correction: evaluation.feedback,
        raw_response: {
          score_25: evaluation.score,
          details: evaluation.details,
          conseils_pratiques: evaluation.conseils_pratiques,
        },
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (evalError) {
      console.error('Erreur sauvegarde évaluation:', evalError);
      throw evalError;
    }

    // 6. Déduire 1 crédit de l'utilisateur
    if (attempt.user_id) {
      // Utiliser la fonction consume_eval_credit si elle existe
      const { error: creditError } = await supabaseServiceClient
        .rpc('consume_eval_credit', { auth_user_id: attempt.user_id });

      if (creditError) {
        console.warn('Erreur déduction crédit:', creditError);
        // Ne pas bloquer si erreur de crédit
      }
    }

    return NextResponse.json({
      success: true,
      evaluation: {
        id: aiEval.id,
        score_20: aiEval.score_20,
        score_25: evaluation.score,
        details: evaluation.details,
        feedback: evaluation.feedback,
        points_forts: evaluation.points_forts,
        points_amelioration: evaluation.points_amelioration,
        niveau_estime: evaluation.niveau_estime,
        conseils_pratiques: evaluation.conseils_pratiques,
      },
    });

  } catch (error: any) {
    console.error('❌ Erreur évaluation IA Simulateur:', error);
    console.error('Stack trace:', error.stack);
    return NextResponse.json(
      { 
        error: error.message || 'Erreur serveur',
        details: error.stack,
        type: error.constructor.name,
      },
      { status: 500 }
    );
  }
}
