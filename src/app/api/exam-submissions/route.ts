import { NextResponse } from 'next/server';
import { supabaseServiceClient } from '@/lib/supabase/service-client';

export const runtime = 'nodejs';

// Placeholder API returning a list of mock exam submissions
// TODO: Replace with Supabase query when the submissions table is available.
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const user_id = url.searchParams.get('user_id');
    const plan_id = url.searchParams.get('plan_id');
    const pageParam = url.searchParams.get('page');
    const pageSizeParam = url.searchParams.get('pageSize');
    const orderParam = url.searchParams.get('order'); // 'recent' | 'oldest'
    const supabase = supabaseServiceClient as any;

    // If both params present, return the single submission for this user/plan
    if (user_id && plan_id) {
      const { data, error } = await supabase
        .from('exam_submissions')
        .select('id, user_email, user_id, plan_id, status, score, submitted_at, progress')
        .eq('user_id', user_id)
        .eq('plan_id', plan_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return NextResponse.json({ data });
    }

    // Pagination + order by submitted_at
    const page = Math.max(1, Number(pageParam || '1'));
    const pageSize = Math.min(100, Math.max(1, Number(pageSizeParam || '20')));
    const order = orderParam === 'oldest' ? 'oldest' : 'recent';
    const ascending = order === 'oldest';
    const from = (page - 1) * pageSize;
    const to = from + pageSize; // fetch one extra to detect has_more

    const { data, error } = await supabase
      .from('exam_submissions')
      .select('id, user_email, user_id, plan_id, status, score, submitted_at')
      .order('submitted_at', { ascending })
      .range(from, to);

    if (error) throw error;

    const normalized = (data || []).map((s: any) => ({
      id: s.id,
      user_email: s.user_email || null,
      user_name: null,
      plan_id: s.plan_id || null,
      plan_type: 'examen_blanc',
      status: s.status,
      score: s.score,
      submitted_at: s.submitted_at,
    }));

    const has_more = normalized.length > pageSize;
    const pageSlice = has_more ? normalized.slice(0, pageSize) : normalized;

    return NextResponse.json({ data: pageSlice, page, pageSize, has_more, order });
  } catch (e) {
    return NextResponse.json({ error: (e as any)?.message || 'Erreur inconnue' }, { status: 400 });
  }
}

// Create a new exam submission with comprehension answers
// Body: { plan_id?: string, user_id?: string, user_email?: string, comprehension_answers: Array<{ question_id: string, user_option_id?: string|null, user_label?: string|null }> }
export async function POST(req: Request) {
  try {
    const supabase = supabaseServiceClient as any;
    const body = await req.json();

    const stage = String(body?.stage || '').toUpperCase(); // 'CO' | 'CE' | 'EE' | 'EO'
    const plan_id: string | null = body?.plan_id ?? null;
    const submission_id_input: string | null = body?.submission_id ?? null;
    const user_id: string | null = body?.user_id ?? null;
    const user_email: string | null = body?.user_email ?? null;
    const comprehension_answers: Array<{ question_id: string; user_option_id?: string | null; user_label?: string | null }>
      = Array.isArray(body?.comprehension_answers) ? body.comprehension_answers : [];

    if (!user_id) {
      return NextResponse.json({ error: 'user_id requis' }, { status: 400 });
    }
    if (!['CO','CE','EE','EO'].includes(stage)) {
      return NextResponse.json({ error: "stage invalide. Valeurs attendues: 'CO' | 'CE' | 'EE' | 'EO'" }, { status: 400 });
    }

    // Load or create submission
    let submission_id: string | null = submission_id_input;
    let submission: any = null;
    if (submission_id) {
      const { data: existing, error: subErr } = await supabase
        .from('exam_submissions')
        .select('id, user_id, user_email, plan_id, status, progress')
        .eq('id', submission_id)
        .maybeSingle();
      if (subErr) throw subErr;
      if (!existing) return NextResponse.json({ error: 'submission introuvable' }, { status: 404 });
      if (existing.user_id !== user_id) return NextResponse.json({ error: 'submission et user ne correspondent pas' }, { status: 403 });
      submission = existing;
      // if plan_id is provided, ensure consistency
      if (plan_id && existing.plan_id && existing.plan_id !== plan_id) {
        return NextResponse.json({ error: 'plan_id ne correspond pas à la soumission' }, { status: 400 });
      }
    } else {
      if (!plan_id) return NextResponse.json({ error: 'plan_id requis pour créer une soumission' }, { status: 400 });
      const { data: inserted, error: insertErr } = await supabase
        .from('exam_submissions')
        .insert({ user_id, user_email, plan_id, status: 'in_progress' })
        .select('id, user_id, user_email, plan_id, status, progress')
        .maybeSingle();
      if (insertErr) throw insertErr;
      if (!inserted?.id) return NextResponse.json({ error: 'Insertion échouée' }, { status: 500 });
      submission_id = inserted.id;
      submission = inserted;
    }

    // Load plan to validate CO/CE membership and counts
    const effectivePlanId = submission.plan_id || plan_id;
    const { data: planRow, error: planErr } = await supabase
      .from('exam_plans')
      .select('id, plan, config')
      .eq('id', effectivePlanId)
      .maybeSingle();
    if (planErr) throw planErr;
    if (!planRow) return NextResponse.json({ error: 'Plan introuvable' }, { status: 404 });

    const plan = (planRow as any).plan || {};
    const config = (planRow as any).config || {};
    const expectedCO = Number(config?.counts?.CO ?? 39);
    const expectedCE = Number(config?.counts?.CE ?? 39);
    const hasEE = Array.isArray((plan as any)?.expression_ecrite) && (plan as any).expression_ecrite.length > 0;
    const hasEO = Array.isArray((plan as any)?.expression_orale) && (plan as any).expression_orale.length > 0;

    const progress = submission?.progress || {};
    const co_done = Boolean(progress?.co_done);
    const ce_done = Boolean(progress?.ce_done);
    const ee_done = Boolean(progress?.ee_done);
    const eo_done = Boolean(progress?.eo_done);

    // Order enforcement
    if (stage === 'CO') {
      if (co_done) return NextResponse.json({ error: 'CO déjà soumis' }, { status: 400 });
    }
    if (stage === 'CE') {
      if (!co_done) return NextResponse.json({ error: 'CO non soumis: CE bloqué' }, { status: 400 });
      if (ce_done) return NextResponse.json({ error: 'CE déjà soumis' }, { status: 400 });
    }
    if (stage === 'EE') {
      if (!co_done || !ce_done) return NextResponse.json({ error: 'Compréhension incomplète: EE bloqué' }, { status: 400 });
      if (ee_done) return NextResponse.json({ error: 'EE déjà soumis' }, { status: 400 });
    }
    if (stage === 'EO') {
      if (!ee_done) return NextResponse.json({ error: 'EE non soumis: EO bloqué' }, { status: 400 });
      if (eo_done) return NextResponse.json({ error: 'EO déjà soumis' }, { status: 400 });
    }

    // Handle comprehension stages
    if (stage === 'CO' || stage === 'CE') {
      const answers = comprehension_answers || [];
      if (!Array.isArray(answers) || answers.length <= 0) {
        return NextResponse.json({ error: 'comprehension_answers requis' }, { status: 400 });
      }
      // Validate membership and counts
      const allowedSet = new Set<string>(
        ((stage === 'CO' ? plan?.comprehension_co : plan?.comprehension_ce) || []).map((q: any) => String(q.id))
      );
      const expected = stage === 'CO' ? expectedCO : expectedCE;
      if (answers.length !== expected) {
        return NextResponse.json({ error: `Nombre de réponses invalide pour ${stage}: reçu ${answers.length}, attendu ${expected}` }, { status: 400 });
      }
      for (const a of answers) {
        if (!a?.question_id || !allowedSet.has(String(a.question_id))) {
          return NextResponse.json({ error: `Question non autorisée pour ${stage}: ${a?.question_id || 'inconnue'}` }, { status: 400 });
        }
      }

      // Upsert answers
      const payload = answers.map((a) => ({
        submission_id: submission_id,
        question_id: a.question_id,
        user_option_id: a.user_option_id ?? null,
        user_label: (a.user_label ?? null) as string | null,
      }));
      const { error: upsertErr } = await supabase
        .from('submission_answers')
        .upsert(payload, { onConflict: 'submission_id,question_id' });
      if (upsertErr) throw upsertErr;

      // Update progress
      const patch = stage === 'CO' ? { co_done: true } : { ce_done: true };
      const { data: upd, error: updErr } = await supabase
        .from('exam_submissions')
        .update({ progress: { ...progress, ...patch } })
        .eq('id', submission_id)
        .select('id, progress')
        .maybeSingle();
      if (updErr) throw updErr;
      // If CE just finished and there is no EE/EO in the plan, auto-submit
      const nowProgress = upd?.progress || { ...progress, ...patch };
      if (stage === 'CE' && nowProgress?.co_done && nowProgress?.ce_done && !hasEE && !hasEO) {
        const { data: upd2, error: upd2Err } = await supabase
          .from('exam_submissions')
          .update({ status: 'submitted', submitted_at: new Date().toISOString() })
          .eq('id', submission_id)
          .select('id, progress, status, submitted_at')
          .maybeSingle();
        if (upd2Err) throw upd2Err;
        return NextResponse.json({ data: { id: submission_id, progress: upd2?.progress, status: upd2?.status, submitted_at: upd2?.submitted_at } });
      }
      return NextResponse.json({ data: { id: submission_id, progress: nowProgress } });
    }

    // Handle EE/EO stage acknowledgements (minimal server record)
    if (stage === 'EE' || stage === 'EO') {
      const patch = stage === 'EE' ? { ee_done: true } : { eo_done: true };
      const { data: upd, error: updErr } = await supabase
        .from('exam_submissions')
        .update({ progress: { ...progress, ...patch } })
        .eq('id', submission_id)
        .select('id, progress, status, submitted_at')
        .maybeSingle();
      if (updErr) throw updErr;
      const nowProgress = upd?.progress || { ...progress, ...patch };
      // If EO is done, auto mark submitted
      if (stage === 'EO' && nowProgress?.eo_done) {
        const alreadySubmitted = Boolean(upd?.submitted_at) || upd?.status === 'submitted' || upd?.status === 'graded';
        if (!alreadySubmitted) {
          const { data: upd2, error: upd2Err } = await supabase
            .from('exam_submissions')
            .update({ status: 'submitted', submitted_at: new Date().toISOString() })
            .eq('id', submission_id)
            .select('id, progress, status, submitted_at')
            .maybeSingle();
          if (upd2Err) throw upd2Err;
          return NextResponse.json({ data: { id: submission_id, progress: upd2?.progress, status: upd2?.status, submitted_at: upd2?.submitted_at } });
        }
      }
      return NextResponse.json({ data: { id: submission_id, progress: nowProgress, status: upd?.status, submitted_at: upd?.submitted_at } });
    }

    return NextResponse.json({ error: 'Stage non géré' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur inconnue' }, { status: 400 });
  }
}

