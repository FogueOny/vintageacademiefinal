import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';

// Helper to sample N unique items from an array
function sampleUnique<T>(arr: T[], n: number): T[] {
  if (n > arr.length) {
    throw new Error(`Pool insuffisant: demandé ${n}, disponible ${arr.length}`);
  }
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

export async function POST(req: Request) {
  const supabase = getSupabaseServiceClient();
  try {
    const body = await req.json().catch(() => ({}));
    // New separate counts (defaults: 39 each)
    const counts = body?.counts ?? { CO: 39, CE: 39 } as { CO: number; CE: number };
    const poolSeries: string[] | undefined = body?.poolSeries;
    const poolModules: string[] | undefined = body?.poolModules;
    // Exclusion lists to avoid previously used items
    const exclude = body?.exclude || {};
    const excludeComp: Set<string> = new Set((exclude?.comp_question_ids || []).map((x: any) => String(x)));
    const excludeEE: Set<string> = new Set((exclude?.ee_task_ids || []).map((x: any) => String(x)));
    const excludeEO: Set<string> = new Set([...(exclude?.eo_task_ids || []), ...(exclude?.eo_subject_ids || [])].map((x: any) => String(x)));
    // Lock lists to keep existing items (non-conflicts) and only fill the rest
    const lock = body?.lock || {};
    const lockCompCO: Set<string> = new Set((lock?.comp_CO_ids || []).map((x: any) => String(x)));
    const lockCompCE: Set<string> = new Set((lock?.comp_CE_ids || []).map((x: any) => String(x)));
    const lockEE: Set<string> = new Set((lock?.ee_task_ids || []).map((x: any) => String(x)));
    const lockEO: Set<string> = new Set([...(lock?.eo_task_ids || []), ...(lock?.eo_subject_ids || [])].map((x: any) => String(x)));
    const persist: boolean = body?.persist !== false; // default true

    // 1) Resolve modules for TCF CO/CE
    const { data: modules, error: modErr } = await supabase
      .from('modules')
      .select('id, type, type_module')
      .in('type', ['comprehension_orale', 'comprehension_ecrite'])
      .eq('type_module', 'tcf');
    if (modErr) throw modErr;
    const moduleIdsCO = (modules || []).filter(m => m.type === 'comprehension_orale').map(m => m.id);
    const moduleIdsCE = (modules || []).filter(m => m.type === 'comprehension_ecrite').map(m => m.id);
    if (!moduleIdsCO.length) {
      throw new Error("Aucun module 'comprehension_orale' (tcf) disponible. Ajoutez des modules CO ou vérifiez type/type_module.");
    }
    if (!moduleIdsCE.length) {
      throw new Error("Aucun module 'comprehension_ecrite' (tcf) disponible. Ajoutez des modules CE ou vérifiez type/type_module.");
    }

    // 2) Resolve test_series per modules
    const { data: seriesCO, error: tsErr1 } = await supabase
      .from('test_series')
      .select('id, module_id')
      .in('module_id', moduleIdsCO);
    if (tsErr1) throw tsErr1;
    const { data: seriesCE, error: tsErr2 } = await supabase
      .from('test_series')
      .select('id, module_id')
      .in('module_id', moduleIdsCE);
    if (tsErr2) throw tsErr2;

    let seriesIdsCO = (seriesCO || []).map(s => s.id);
    let seriesIdsCE = (seriesCE || []).map(s => s.id);
    if (!seriesIdsCO.length) {
      throw new Error("Aucune série de tests trouvée pour les modules CO. Créez des 'test_series' liés aux modules comprehension_orale.");
    }
    if (!seriesIdsCE.length) {
      throw new Error("Aucune série de tests trouvée pour les modules CE. Créez des 'test_series' liés aux modules comprehension_ecrite.");
    }

    // optional narrowing by pools
    if (Array.isArray(poolSeries) && poolSeries.length > 0) {
      seriesIdsCO = seriesIdsCO.filter(id => poolSeries.includes(id));
      seriesIdsCE = seriesIdsCE.filter(id => poolSeries.includes(id));
    }
    if (Array.isArray(poolModules) && poolModules.length > 0) {
      // refilter via modules lists if provided (already done by module filter, so optional)
    }

    // 3) Fetch questions by series
    const { data: qCO, error: qErr1 } = await supabase
      .from('questions')
      .select('id, test_series_id, content, created_at')
      .in('test_series_id', seriesIdsCO);
    if (qErr1) throw qErr1;

    const { data: qCE, error: qErr2 } = await supabase
      .from('questions')
      .select('id, test_series_id, content, created_at')
      .in('test_series_id', seriesIdsCE);
    if (qErr2) throw qErr2;

    let poolCO = (qCO || []).filter((q) => !excludeComp.has(String(q.id)));
    let poolCE = (qCE || []).filter((q) => !excludeComp.has(String(q.id)));
    if (poolCO.length < counts.CO) {
      throw new Error(`Pool CO insuffisant: demandé ${counts.CO}, disponible ${poolCO.length}. Ajoutez des questions CO ou réduisez la valeur.`);
    }
    if (poolCE.length < counts.CE) {
      throw new Error(`Pool CE insuffisant: demandé ${counts.CE}, disponible ${poolCE.length}. Ajoutez des questions CE ou réduisez la valeur.`);
    }

    // 4) Sample unique questions per section (no mixing), respect locks
    const lockedCO = poolCO.filter(q => lockCompCO.has(String(q.id)));
    const lockedCE = poolCE.filter(q => lockCompCE.has(String(q.id)));
    // Remove locked from pools
    const poolCOUnlocked = poolCO.filter(q => !lockCompCO.has(String(q.id)));
    const poolCEUnlocked = poolCE.filter(q => !lockCompCE.has(String(q.id)));
    // Remaining counts (must reach exactly counts.CO and counts.CE)
    const needCO = Math.max(0, counts.CO - lockedCO.length);
    const needCE = Math.max(0, counts.CE - lockedCE.length);
    if (lockedCO.length > counts.CO) {
      throw new Error(`Trop d'éléments verrouillés CO: ${lockedCO.length} > ${counts.CO}`);
    }
    if (lockedCE.length > counts.CE) {
      throw new Error(`Trop d'éléments verrouillés CE: ${lockedCE.length} > ${counts.CE}`);
    }
    const sampledCO = sampleUnique(poolCOUnlocked, needCO);
    const sampledCE = sampleUnique(poolCEUnlocked, needCE);
    const coQuestions = [...lockedCO, ...sampledCO].map(q => ({ ...q, type: 'CO' as const }));
    const ceQuestions = [...lockedCE, ...sampledCE].map(q => ({ ...q, type: 'CE' as const }));
    // Final validation for pool sufficiency
    if (coQuestions.length !== counts.CO) {
      throw new Error(`Pool insuffisant CO: demandé ${counts.CO}, obtenu ${coQuestions.length}`);
    }
    if (ceQuestions.length !== counts.CE) {
      throw new Error(`Pool insuffisant CE: demandé ${counts.CE}, obtenu ${ceQuestions.length}`);
    }

    // 6) EE tasks (1,2,3) — pick exactly one per task_number
    const { data: eeTasks, error: eeErr } = await supabase
      .from('expression_ecrite_tasks')
      .select('id, task_number, title, word_count_max, task_type, description')
      .in('task_number', [1, 2, 3]);
    if (eeErr) {
      // If table missing, degrade gracefully with empty list
      // throw eeErr
    }
    const eeByNumber: Record<number, any[]> = { 1: [], 2: [], 3: [] };
    for (const t of eeTasks || []) {
      if (excludeEE.has(String(t.id))) continue;
      if (t && (t.task_number === 1 || t.task_number === 2 || t.task_number === 3)) {
        eeByNumber[t.task_number].push(t);
      }
    }
    const ee: any[] = [];
    for (const num of [1, 2, 3] as const) {
      const pool = eeByNumber[num];
      if (!pool || pool.length === 0) {
        throw new Error(`Aucune tâche EE disponible pour T${num}`);
      }
      // If a lock exists for this task_number, keep it; else sample 1
      const locked = pool.find(t => lockEE.has(String(t.id)));
      const picked = locked ? locked : sampleUnique(pool, 1)[0];
      if (num === 3 && picked?.id) {
        const { data: docs, error: docErr } = await supabase
          .from('expression_ecrite_documents')
          .select('id, document_number, content')
          .eq('task_id', picked.id)
          .order('document_number', { ascending: true });
        if (docErr) throw docErr;
        ee.push({ ...picked, documents: (docs || []).filter(d => typeof d?.document_number === 'number').slice(0, 2) });
      } else {
        ee.push(picked);
      }
    }

    // 7) EO subjects (partie 2,3) — pick exactly one subject per partie_number
    const { data: eoSubjects, error: eoErr } = await supabase
      .from('expression_orale_subjects')
      .select('id, task_id, partie_number, subject_number, question, content')
      .in('partie_number', [2, 3]);
    if (eoErr) {
      // degrade gracefully
      // throw eoErr
    }
    const eoByPartie: Record<number, any[]> = { 2: [], 3: [] } as any;
    for (const s of eoSubjects || []) {
      const sid = String(s.id);
      if (excludeEO.has(sid)) continue;
      if (s && (s.partie_number === 2 || s.partie_number === 3)) {
        eoByPartie[s.partie_number].push(s);
      }
    }
    const eo: any[] = [];
    for (const partie of [2, 3] as const) {
      const pool = eoByPartie[partie];
      if (!pool || pool.length === 0) {
        throw new Error(`Aucun sujet EO disponible pour la partie ${partie}`);
      }
      const locked = pool.find(s => lockEO.has(String(s.id)) || (s.task_id && lockEO.has(String(s.task_id))));
      if (locked) eo.push(locked);
      else eo.push(sampleUnique(pool, 1)[0]);
    }

    const plan = {
      comprehension_co: coQuestions,
      comprehension_ce: ceQuestions,
      expression_ecrite: ee,
      expression_orale: eo,
    } as const;

    const config = {
      mode: 'separate',
      counts,
      pools: {
        modulesCO: moduleIdsCO,
        modulesCE: moduleIdsCE,
        seriesCO: seriesIdsCO,
        seriesCE: seriesIdsCE,
      },
      generated_at: new Date().toISOString(),
    };

    let planId: string | undefined = undefined;
    if (persist) {
      const { data: insertData, error: insErr } = await supabase
        .from('exam_plans')
        .insert({ type: 'examen_blanc', config, plan })
        .select('id')
        .single();
      if (insErr) throw insErr;
      planId = insertData?.id;
    }

    return NextResponse.json({ plan, config, plan_id: planId }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur inconnue' }, { status: 400 });
  }
}
