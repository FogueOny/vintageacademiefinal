// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { evaluateEO } from '@/lib/openai/assistant';
import { supabaseServiceClient } from '@/lib/supabase/service-client';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 secondes max

/**
 * POST /api/ai/evaluate-eo
 * Évalue une Expression Orale avec l'Assistant OpenAI (+ Whisper)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { response_id, submission_id } = body;

    if (!response_id || !submission_id) {
      return NextResponse.json(
        { error: 'response_id et submission_id requis' },
        { status: 400 }
      );
    }

    // 1. Récupérer la réponse EO
    const { data: response, error: responseError } = await supabaseServiceClient
      .from('expression_responses')
      .select('id, type, partie_number, audio_url, submission_id')
      .eq('id', response_id)
      .eq('type', 'expression_orale')
      .single();

    if (responseError || !response) {
      return NextResponse.json(
        { error: 'Réponse non trouvée' },
        { status: 404 }
      );
    }

    if (!response.audio_url) {
      return NextResponse.json(
        { error: 'Pas d\'audio à évaluer' },
        { status: 400 }
      );
    }

    // 2. Récupérer la consigne de la tâche
    const { data: submission } = await supabaseServiceClient
      .from('exam_submissions')
      .select('plan_id')
      .eq('id', submission_id)
      .single();

    let taskDescription = `Partie ${response.partie_number} - Expression Orale TCF`;
    
    if (submission?.plan_id) {
      const { data: plan } = await supabaseServiceClient
        .from('exam_plans')
        .select('plan')
        .eq('id', submission.plan_id)
        .single();

      if (plan?.plan?.expression_orale) {
        const task = plan.plan.expression_orale.find(
          (t: any) => t.partie_number === response.partie_number
        );
        if (task) {
          taskDescription = `${task.question || ''}\n${task.content || ''}`;
        }
      }
    }

    // 3. Évaluer avec l'Assistant OpenAI (+ Whisper)
    console.log('🤖 Évaluation IA + Transcription en cours pour:', response_id);
    const evaluation = await evaluateEO(response.audio_url, taskDescription);
    console.log('✅ Évaluation terminée:', evaluation);

    // 4. Sauvegarder le résultat
    const { error: updateError } = await supabaseServiceClient
      .from('expression_responses')
      .update({
        admin_score: evaluation.score,
        admin_feedback: `**Transcription:**
${evaluation.transcription}

---

${evaluation.feedback}

**Points forts:**
${evaluation.points_forts?.map((p: string) => `• ${p}`).join('\n') || 'N/A'}

**Points à améliorer:**
${evaluation.points_amelioration?.map((p: string) => `• ${p}`).join('\n') || 'N/A'}

**Niveau estimé:** ${evaluation.niveau_estime || 'N/A'}

---
*Évaluation générée par IA - Assistant TCF + Whisper*`,
        corrected_at: new Date().toISOString(),
      })
      .eq('id', response_id);

    if (updateError) {
      console.error('Erreur sauvegarde:', updateError);
      throw updateError;
    }

    // 5. Mettre à jour le statut de la submission si toutes les EO sont corrigées
    const { data: allResponses } = await supabaseServiceClient
      .from('expression_responses')
      .select('id, admin_score')
      .eq('submission_id', submission_id)
      .eq('type', 'expression_orale');

    const allGraded = allResponses?.every(r => r.admin_score !== null);
    
    if (allGraded) {
      // Vérifier aussi les EE
      const { data: eeResponses } = await supabaseServiceClient
        .from('expression_responses')
        .select('id, admin_score')
        .eq('submission_id', submission_id)
        .eq('type', 'expression_ecrite');

      const allEEGraded = eeResponses?.every(r => r.admin_score !== null);

      if (allEEGraded) {
        await supabaseServiceClient
          .from('exam_submissions')
          .update({ status: 'graded' })
          .eq('id', submission_id);
      }
    }

    return NextResponse.json({
      success: true,
      evaluation: {
        score: evaluation.score,
        details: evaluation.details,
        feedback: evaluation.feedback,
        transcription: evaluation.transcription,
        niveau_estime: evaluation.niveau_estime,
      },
    });

  } catch (error: any) {
    console.error('❌ Erreur évaluation IA:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
