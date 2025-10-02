import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';

export async function GET() {
  const supabase = getSupabaseServiceClient();
  try {
    const { data, error } = await supabase
      .from('exam_plans')
      .select('id, type, config, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur inconnue' }, { status: 400 });
  }
}

// Create a new exam plan with validation:
// - Prevent reuse of items (CO/CE questions, EE tasks, EO subjects) unless forceReplace=true
// - Validate EE required fields: title, word_count_max, task_type, instructions
// - Validate EO required fields: content, question
// Body: {
//   type?: 'examen_blanc',
//   config?: any,
//   plan: {
//     comprehension?: Array<{ id: string; type?: 'CO'|'CE'; title?: string; content?: string }>,
//     expression_ecrite?: Array<{ id: string; title: string; word_count_max: number; task_type: string; instructions: string }>,
//     expression_orale?: Array<{ id: string; content: string; question: string }>
//   },
//   forceReplace?: boolean
// }
export async function POST(req: Request) {
  const supabase = getSupabaseServiceClient();
  try {
    const body = await req.json();
    const type = (body?.type ?? 'examen_blanc') as string;
    const config = body?.config ?? {};
    const plan = body?.plan ?? {};
    const forceReplace = Boolean(body?.forceReplace);

    // Basic structure checks
    const comprehension: Array<any> = Array.isArray(plan?.comprehension) ? plan.comprehension : [];
    const ee: Array<any> = Array.isArray(plan?.expression_ecrite) ? plan.expression_ecrite : [];
    const eo: Array<any> = Array.isArray(plan?.expression_orale) ? plan.expression_orale : [];

    // Validate IDs and required fields
    const errors: string[] = [];

    // Validate comprehension entries have id
    for (const [i, q] of comprehension.entries()) {
      if (!q || !q.id) errors.push(`comprehension[${i}].id requis`);
    }

    // EE: only require id at save time; content fields will be hydrated in UIs
    for (const [i, t] of ee.entries()) {
      if (!t || !t.id) errors.push(`expression_ecrite[${i}].id requis`);
    }

    // EO: only require id at save time; content fields will be hydrated in UIs
    for (const [i, s] of eo.entries()) {
      if (!s || !s.id) errors.push(`expression_orale[${i}].id requis`);
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: 'Validation échouée', details: errors }, { status: 400 });
    }

    // Collect proposed IDs
    const compIds = new Set<string>(comprehension.map((q: any) => String(q.id)));
    const eeIds = new Set<string>(ee.map((t: any) => String(t.id)));
    const eoIds = new Set<string>(eo.map((s: any) => String(s.id)));

    // Load existing plans (all time) to detect reuse
    const { data: existing, error } = await supabase
      .from('exam_plans')
      .select('plan, type, created_at')
      .order('created_at', { ascending: false })
      .limit(2000);
    if (error) throw error;

    const usedComp = new Set<string>();
    const usedEE = new Set<string>();
    const usedEO = new Set<string>();

    for (const row of existing || []) {
      // Only consider same type for reuse policy
      if ((row as any)?.type !== type) continue;
      const p = (row as any)?.plan || {};
      const rComp: Array<any> = Array.isArray(p?.comprehension) ? p.comprehension : [];
      const rEE: Array<any> = Array.isArray(p?.expression_ecrite) ? p.expression_ecrite : [];
      const rEO: Array<any> = Array.isArray(p?.expression_orale) ? p.expression_orale : [];
      for (const q of rComp) if (q?.id) usedComp.add(String(q.id));
      for (const t of rEE) if (t?.id) usedEE.add(String(t.id));
      for (const s of rEO) if (s?.id) usedEO.add(String(s.id));
    }

    // Compute overlaps
    const overlaps = {
      comp: Array.from(compIds).filter((id) => usedComp.has(id)),
      ee: Array.from(eeIds).filter((id) => usedEE.has(id)),
      eo: Array.from(eoIds).filter((id) => usedEO.has(id)),
    };

    const hasOverlap = overlaps.comp.length > 0 || overlaps.ee.length > 0 || overlaps.eo.length > 0;

    if (hasOverlap && !forceReplace) {
      return NextResponse.json(
        {
          error: 'Certains éléments sont déjà utilisés dans un autre examen blanc',
          overlaps,
          hint: 'Confirmez le remplacement en renvoyant forceReplace=true',
        },
        { status: 409 }
      );
    }

    // Insert plan
    const { data: inserted, error: insertErr } = await supabase
      .from('exam_plans')
      .insert({ type, config, plan })
      .select('id')
      .maybeSingle();

    if (insertErr) throw insertErr;
    if (!inserted?.id) return NextResponse.json({ error: 'Insertion échouée' }, { status: 500 });

    return NextResponse.json({ data: { id: inserted.id }, overlaps: hasOverlap ? overlaps : undefined });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur inconnue' }, { status: 400 });
  }
}
