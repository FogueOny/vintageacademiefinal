import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceClient } from '@/lib/supabase/service-client';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const windowDays = parseInt(searchParams.get('windowDays') || '90', 10);

    const supabase = supabaseServiceClient as any;
    const sinceIso = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('exam_plans')
      .select('plan, created_at')
      .gte('created_at', sinceIso)
      .limit(1000);

    if (error) throw error;

    const used_comp_question_ids = new Set<string>();
    const used_ee_task_ids = new Set<string>();
    const used_eo_subject_ids = new Set<string>();

    for (const row of data || []) {
      const plan = row?.plan || {};
      const comp = Array.isArray(plan?.comprehension) ? plan.comprehension : [];
      const ee = Array.isArray(plan?.expression_ecrite) ? plan.expression_ecrite : [];
      const eo = Array.isArray(plan?.expression_orale) ? plan.expression_orale : [];

      for (const q of comp) if (q?.id) used_comp_question_ids.add(String(q.id));
      for (const t of ee) if (t?.id) used_ee_task_ids.add(String(t.id));
      for (const s of eo) if (s?.id) used_eo_subject_ids.add(String(s.id));
    }

    return NextResponse.json({
      data: {
        used_comp_question_ids: Array.from(used_comp_question_ids),
        used_ee_task_ids: Array.from(used_ee_task_ids),
        used_eo_subject_ids: Array.from(used_eo_subject_ids),
        windowDays,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur inconnue' }, { status: 400 });
  }
}
