// @ts-nocheck
// CETTE API UTILISE MAINTENANT L'ASSISTANT OPENAI
import { NextResponse } from 'next/server';
import { supabaseServiceClient } from '@/lib/supabase/service-client';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Évalue toutes les tâches d'un attempt avec l'Assistant OpenAI
export async function POST(_req: Request, ctx: { params: { id: string } }) {
  try {
    const { id } = ctx.params || ({} as any);
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

    console.log('[evaluate] Évaluation avec Assistant OpenAI pour attempt:', id);

    // Récupérer l'attempt
    const { data: attempt, error: attemptError } = await supabaseServiceClient
      .from('simulator_attempts')
      .select('id, user_id, combination_id')
      .eq('id', id)
      .single();

    if (attemptError || !attempt) {
      return NextResponse.json({ error: 'Attempt non trouvé' }, { status: 404 });
    }

    // Récupérer toutes les réponses
    const { data: answers } = await supabaseServiceClient
      .from('simulator_answers')
      .select('task_number, content')
      .eq('attempt_id', id)
      .order('task_number');

    if (!answers || answers.length === 0) {
      return NextResponse.json({ error: 'Aucune réponse à évaluer' }, { status: 400 });
    }

    // Évaluer chaque tâche avec la nouvelle API
    const results = [];
    for (const answer of answers) {
      try {
        const evalResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/ai/evaluate-simulator`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attempt_id: id,
            task_number: answer.task_number,
          }),
        });

        if (evalResponse.ok) {
          const evalData = await evalResponse.json();
          results.push(evalData.evaluation);
        }
      } catch (error) {
        console.error(`Erreur évaluation tâche ${answer.task_number}:`, error);
      }
    }

    // Marquer comme graded
    await supabaseServiceClient
      .from('simulator_attempts')
      .update({ status: 'graded' })
      .eq('id', id);

    return NextResponse.json({
      ok: true,
      inserted: results.length,
      evaluations: results,
    });
  } catch (e: any) {
    console.error('[evaluate] fatal', e);
    return NextResponse.json({ error: e?.message || 'Erreur serveur' }, { status: 500 });
  }
}
