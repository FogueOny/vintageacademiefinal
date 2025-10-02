import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type AttemptRouteParams = {
  params: {
    id: string;
  };
};

export async function GET(_req: Request, ctx: AttemptRouteParams) {
  try {
    const id = ctx?.params?.id;
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) {
      console.warn('[attempts/:id] auth.getUser error', userError);
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
    }
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    console.log('[attempts/:id] fetch start', { id, user: user.id });

    // Attempt + tasks (catalogue)
    const { data: attempt, error } = await supabase
      .from('simulator_attempts')
      .select('id, user_id, combination_id, status, started_at, submitted_at, duration_seconds')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!attempt || attempt.user_id !== user.id) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

    const { data: tasks } = await supabase
      .from('expression_ecrite_tasks')
      .select('id, task_number, title, description, word_count_min, word_count_max, task_type, instructions, documents:expression_ecrite_documents(id, document_number, title, content)')
      .eq('combination_id', attempt.combination_id)
      .order('task_number');

    const { data: answers } = await supabase
      .from('simulator_answers')
      .select('task_number, content, word_count')
      .eq('attempt_id', id);

    const { data: evals } = await supabase
      .from('ai_evaluations')
      .select('task_number, score_20, cecr_level, positives, improvements, suggested_correction, created_at')
      .eq('attempt_id', id);
    console.log('[attempts/:id] fetched', {
      answers: Array.isArray(answers) ? answers.length : 0,
      evaluations: Array.isArray(evals) ? evals.length : 0,
      status: attempt?.status,
    });
    return NextResponse.json({ data: { attempt, tasks, answers, evaluations: evals || [] } });
  } catch (error) {
    console.error('[attempts/:id] error', error);
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
