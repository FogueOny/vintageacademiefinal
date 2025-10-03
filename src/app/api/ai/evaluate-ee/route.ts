// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { evaluateEE } from '@/lib/openai/assistant';
import { supabaseServiceClient } from '@/lib/supabase/service-client';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 secondes max

/**
 * POST /api/ai/evaluate-ee
 * Évalue une Expression Écrite avec l'Assistant OpenAI
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

    // 1. Récupérer la réponse EE
    // @ts-ignore - Types Supabase générés
    const { data: response, error: responseError } = await supabaseServiceClient
      .from('expression_responses')
      .select('id, type, task_number, user_text, submission_id')
      .eq('id', response_id)
      .eq('type', 'expression_ecrite')
      .single();

    if (responseError || !response) {
      return NextResponse.json(
        { error: 'Réponse non trouvée' },
        { status: 404 }
      );
    }

    if (!response.user_text) {
      return NextResponse.json(
        { error: 'Pas de texte à évaluer' },
        { status: 400 }
      );
    }

    // 2. Récupérer la consigne de la tâche
    const { data: submission } = await supabaseServiceClient
      .from('exam_submissions')
      .select('plan_id')
      .eq('id', submission_id)
      .single();

    let taskDescription = `Tâche ${response.task_number} - Expression Écrite TCF`;
    
    if (submission?.plan_id) {
      const { data: plan } = await supabaseServiceClient
        .from('exam_plans')
        .select('plan')
        .eq('id', submission.plan_id)
        .single();

      if (plan?.plan?.expression_ecrite) {
        const task = plan.plan.expression_ecrite.find(
          (t: any) => t.task_number === response.task_number
        );
        if (task) {
          taskDescription = `${task.title || ''}\n${task.description || ''}`;
        }
      }
    }

    // 3. Évaluer avec l'Assistant OpenAI
    console.log('🤖 Évaluation IA en cours pour:', response_id);
    const evaluation = await evaluateEE(response.user_text, taskDescription);
    console.log('✅ Évaluation terminée:', evaluation);

    // 4. Sauvegarder le résultat
    const { error: updateError } = await supabaseServiceClient
      .from('expression_responses')
      .update({
        admin_score: evaluation.score,
        admin_feedback: `${evaluation.feedback}

**Points forts:**
${evaluation.points_forts?.map((p: string) => `• ${p}`).join('\n') || 'N/A'}

**Points à améliorer:**
${evaluation.points_amelioration?.map((p: string) => `• ${p}`).join('\n') || 'N/A'}

**Niveau estimé:** ${evaluation.niveau_estime || 'N/A'}

---
*Évaluation générée par IA - Assistant TCF*`,
        corrected_at: new Date().toISOString(),
      })
      .eq('id', response_id);

    if (updateError) {
      console.error('Erreur sauvegarde:', updateError);
      throw updateError;
    }

    // 5. Mettre à jour le statut de la submission si toutes les EE sont corrigées
    const { data: allResponses } = await supabaseServiceClient
      .from('expression_responses')
      .select('id, admin_score')
      .eq('submission_id', submission_id)
      .eq('type', 'expression_ecrite');

    const allGraded = allResponses?.every(r => r.admin_score !== null);
    
    if (allGraded) {
      // Vérifier aussi les EO
      const { data: eoResponses } = await supabaseServiceClient
        .from('expression_responses')
        .select('id, admin_score')
        .eq('submission_id', submission_id)
        .eq('type', 'expression_orale');

      const allEOGraded = eoResponses?.every(r => r.admin_score !== null);

      if (allEOGraded) {
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
