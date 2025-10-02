import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET: Récupérer toutes les réponses EE/EO d'une soumission
export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    const supabase = await createServerSupabaseClient();

    // Vérifier auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier que l'utilisateur a accès à cette soumission (propriétaire ou admin)
    const { data: submission } = await supabase
      .from('exam_submissions')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!submission) {
      return NextResponse.json({ error: 'Soumission non trouvée' }, { status: 404 });
    }

    // Vérifier si admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';
    const isOwner = submission.user_id === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Récupérer les réponses
    const { data: responses, error } = await supabase
      .from('submission_expression_responses')
      .select('*')
      .eq('submission_id', id)
      .order('type', { ascending: true })
      .order('task_number', { ascending: true })
      .order('partie_number', { ascending: true });

    if (error) {
      console.error('[GET expressions] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: responses || [] });
  } catch (error: any) {
    console.error('[GET expressions] Exception:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}

// POST: Enregistrer/mettre à jour une réponse EE ou EO
export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id: submissionId } = context.params;
    const body = await req.json();
    const {
      type, // 'expression_ecrite' | 'expression_orale'
      task_id,
      task_number,
      partie_number,
      text_response,
      word_count,
      audio_url,
      audio_duration_seconds,
    } = body;

    const supabase = await createServerSupabaseClient();

    // Vérifier auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est propriétaire de la soumission
    const { data: submission } = await supabase
      .from('exam_submissions')
      .select('user_id')
      .eq('id', submissionId)
      .single();

    if (!submission) {
      return NextResponse.json({ error: 'Soumission non trouvée' }, { status: 404 });
    }

    if (submission.user_id !== user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Validation
    if (!type || !['expression_ecrite', 'expression_orale'].includes(type)) {
      return NextResponse.json({ error: 'Type invalide' }, { status: 400 });
    }

    if (type === 'expression_ecrite' && !text_response) {
      return NextResponse.json({ error: 'Texte requis pour EE' }, { status: 400 });
    }

    if (type === 'expression_orale' && !audio_url) {
      return NextResponse.json({ error: 'Audio URL requis pour EO' }, { status: 400 });
    }

    // Vérifier si une réponse existe déjà pour cette tâche
    const { data: existing } = await supabase
      .from('submission_expression_responses')
      .select('id, corrected_at')
      .eq('submission_id', submissionId)
      .eq('type', type)
      .eq(type === 'expression_ecrite' ? 'task_number' : 'partie_number', 
          type === 'expression_ecrite' ? task_number : partie_number)
      .maybeSingle();

    // Ne pas permettre la modification si déjà corrigé
    if (existing?.corrected_at) {
      return NextResponse.json({ 
        error: 'Cette réponse a déjà été corrigée et ne peut plus être modifiée' 
      }, { status: 400 });
    }

    const responseData: any = {
      submission_id: submissionId,
      type,
      task_id,
      task_number: type === 'expression_ecrite' ? task_number : null,
      partie_number: type === 'expression_orale' ? partie_number : null,
      text_response: type === 'expression_ecrite' ? text_response : null,
      word_count: type === 'expression_ecrite' ? word_count : null,
      audio_url: type === 'expression_orale' ? audio_url : null,
      audio_duration_seconds: type === 'expression_orale' ? audio_duration_seconds : null,
    };

    let result;
    if (existing) {
      // Mettre à jour
      const { data, error } = await supabase
        .from('submission_expression_responses')
        .update(responseData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Créer
      const { data, error } = await supabase
        .from('submission_expression_responses')
        .insert(responseData)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ 
      data: result,
      message: existing ? 'Réponse mise à jour' : 'Réponse enregistrée'
    });
  } catch (error: any) {
    console.error('[POST expressions] Exception:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
