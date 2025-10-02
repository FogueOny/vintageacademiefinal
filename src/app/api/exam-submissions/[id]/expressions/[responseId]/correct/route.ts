import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// POST: Admin corrige une réponse EE ou EO
export async function POST(
  req: NextRequest,
  context: { params: { id: string; responseId: string } }
) {
  try {
    const { responseId } = context.params;
    const body = await req.json();
    const { admin_score, admin_feedback } = body;

    const supabase = await createServerSupabaseClient();

    // Vérifier auth et admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 });
    }

    // Validation
    if (typeof admin_score !== 'number' || admin_score < 0 || admin_score > 25) {
      return NextResponse.json({ 
        error: 'Score invalide (doit être entre 0 et 25)' 
      }, { status: 400 });
    }

    // Mettre à jour la correction
    const { data, error } = await supabase
      .from('submission_expression_responses')
      .update({
        admin_score,
        admin_feedback: admin_feedback || null,
        corrected_by: user.id,
        corrected_at: new Date().toISOString(),
      })
      .eq('id', responseId)
      .select()
      .single();

    if (error) {
      console.error('[POST correct] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Réponse non trouvée' }, { status: 404 });
    }

    // Recalculer le score total de la soumission
    const { submission_id } = data;
    
    // Récupérer toutes les réponses de cette soumission
    const { data: allResponses } = await supabase
      .from('submission_expression_responses')
      .select('admin_score')
      .eq('submission_id', submission_id)
      .not('admin_score', 'is', null);

    // Récupérer le score CO/CE depuis submission_answers
    const { data: coceAnswers } = await supabase
      .from('submission_answers')
      .select(`
        id,
        user_option_id,
        question_id,
        questions!inner(id),
        options!submission_answers_user_option_id_fkey(id, is_correct)
      `)
      .eq('submission_id', submission_id);

    const coceScore = (coceAnswers || []).filter((a: any) => 
      a.options?.is_correct === true
    ).length;

    const eeeoScore = (allResponses || []).reduce((sum, r) => sum + (r.admin_score || 0), 0);
    const totalScore = coceScore + eeeoScore;

    // Mettre à jour le score total
    await supabase
      .from('exam_submissions')
      .update({ score: totalScore })
      .eq('id', submission_id);

    return NextResponse.json({ 
      data,
      message: 'Correction enregistrée',
      total_score: totalScore
    });
  } catch (error: any) {
    console.error('[POST correct] Exception:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
