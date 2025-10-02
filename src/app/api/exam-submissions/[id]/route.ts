import { NextResponse } from 'next/server';
import { supabaseServiceClient } from '@/lib/supabase/service-client';

export const runtime = 'nodejs';

// Placeholder detail for a single mock exam submission
// TODO: Replace with Supabase query joined with plan/questions and user answers
export async function GET(_req: Request, ctx: { params: { id: string } } | Promise<{ params: { id: string } }>) {
  const { params } = await ctx as { params: { id: string } };
  const { id } = params;
  try {
    const supabase = supabaseServiceClient as any;

    // Load submission
    const { data: sub, error: subErr } = await supabase
      .from('exam_submissions')
      .select('id, user_email, user_id, plan_id, status, score, submitted_at, progress')
      .eq('id', id)
      .maybeSingle();

    if (subErr) throw subErr;
    if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Load enriched answers for comprehension
    const { data: ans, error: ansErr } = await supabase
      .from('v_submission_answers_enriched')
      .select('question_id, question_type, prompt, user_option_id, user_label, user_option_label, correct_option_id, correct_option_label')
      .eq('submission_id', id)
      .limit(500);

    if (ansErr) throw ansErr;

    const comprehension = (ans || []).map((a: any) => ({
      id: a.question_id,
      type: a.question_type,
      prompt: a.prompt,
      // options omitted in this lightweight detail; can be fetched if needed
      correct_option_id: a.correct_option_id,
      correct_label: a.correct_option_label,
      user_option_id: a.user_option_id,
      user_label: a.user_label || a.user_option_label,
    }));

    // Load plan to expose EE/EO subjects from plan JSON
    let ee: any = null;
    let eo: any = null;
    if (sub?.plan_id) {
      const { data: planRow } = await supabase
        .from('exam_plans')
        .select('id, plan')
        .eq('id', sub.plan_id)
        .maybeSingle();
      const plan = (planRow as any)?.plan || {};
      ee = Array.isArray(plan?.expression_ecrite) ? plan.expression_ecrite : null;
      eo = Array.isArray(plan?.expression_orale) ? plan.expression_orale : null;
    }

    // Fallback hydration when EE/EO missing in stored plan (legacy plans)
    if (!ee || ee.length === 0) {
      try {
        const eeTasks: any[] = [];
        for (const num of [1, 2, 3] as const) {
          const { data: pool, error } = await supabase
            .from('expression_ecrite_tasks')
            .select('id, task_number, title, description, word_count_max')
            .eq('task_number', num)
            .limit(50);
          if (error) throw error;
          if (pool && pool.length > 0) {
            const picked = pool[Math.floor(Math.random() * pool.length)];
            if (num === 3 && picked?.id) {
              const { data: docs } = await supabase
                .from('expression_ecrite_documents')
                .select('id, document_number, content')
                .eq('task_id', picked.id)
                .order('document_number', { ascending: true });
              eeTasks.push({ ...picked, documents: (docs || []).slice(0, 2) });
            } else {
              eeTasks.push(picked);
            }
          }
        }
        if (eeTasks.length > 0) ee = eeTasks;
      } catch {}
    }

    if (!eo || eo.length === 0) {
      try {
        const eoSubs: any[] = [];
        for (const part of [2, 3] as const) {
          const { data: pool, error } = await supabase
            .from('expression_orale_subjects')
            .select('id, task_id, partie_number, subject_number, question, content')
            .eq('partie_number', part)
            .limit(50);
          if (error) throw error;
          if (pool && pool.length > 0) {
            const picked = pool[Math.floor(Math.random() * pool.length)];
            eoSubs.push(picked);
          }
        }
        if (eoSubs.length > 0) eo = eoSubs;
      } catch {}
    }

    const data = {
      id: sub.id,
      user_email: sub.user_email,
      user_name: null,
      plan_type: 'examen_blanc',
      status: sub.status as 'in_progress' | 'submitted' | 'graded',
      score: sub.score,
      submitted_at: sub.submitted_at,
      progress: sub.progress || {},
      comprehension,
      expression_ecrite: ee,
      expression_orale: eo,
    };

    return NextResponse.json({ data });
  } catch (e) {
    // Fallback to mock data
    const data = {
      id,
      user_email: 'etudiant@example.com',
      user_name: 'Étudiant Exemple',
      plan_type: 'examen_blanc',
      status: 'submitted' as const,
      score: null,
      submitted_at: new Date().toISOString(),
      comprehension: [
        {
          id: 'q1',
          type: 'CO',
          prompt: 'Quel est le thème principal du document audio ?',
          correct_option_id: 'o2',
          correct_label: 'B',
          user_option_id: 'o1',
          user_label: 'A',
        },
      ],
      expression_ecrite: null,
      expression_orale: null,
    };
    return NextResponse.json({ data, fallback: true });
  }
}

// Read-only API except deletion from the admin list
export async function DELETE(_req: Request, ctx: { params: { id: string } } | Promise<{ params: { id: string } }>) {
  const { params } = await ctx as { params: { id: string } };
  const { id } = params;
  try {
    const supabase = supabaseServiceClient as any;
    const { error } = await supabase
      .from('exam_submissions')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur inconnue' }, { status: 400 });
  }
}
