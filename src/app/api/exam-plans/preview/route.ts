import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';

export const runtime = 'nodejs';

// POST body: { plan: { comprehension?: [{id}], expression_ecrite?: [{id}], expression_orale?: [{id}] } }
// Returns hydrated details to render a review UI (no DB writes).
export async function POST(req: NextRequest) {
  const supabase = getSupabaseServiceClient();
  try {
    const body = await req.json();
    const plan = body?.plan ?? {};

    const getId = (x: any) =>
      x?.id ||
      x?.question_id || x?.questionId ||
      x?.subject_id || x?.subjectId || x?.eo_subject_id || x?.eoSubjectId ||
      x?.eo_id || x?.ee_id;
    const compIds: string[] = Array.isArray(plan?.comprehension)
      ? plan.comprehension.map((x: any) => String(getId(x))).filter(Boolean)
      : [];
    const eeIds: string[] = Array.isArray(plan?.expression_ecrite)
      ? plan.expression_ecrite.map((x: any) => String(getId(x))).filter(Boolean)
      : [];
    const eoIds: string[] = Array.isArray(plan?.expression_orale)
      ? plan.expression_orale.map((x: any) => String(getId(x))).filter(Boolean)
      : [];

    // Fetch details in parallel
    const [compRes, eeRes, eoRes] = await Promise.all([
      compIds.length
        // Select only columns that exist in the current schema for questions
        ? supabase
            .from('questions')
            .select('id, content, question_number, media_url, media_type, points, test_series_id')
            .in('id', compIds)
        : Promise.resolve({ data: [], error: null } as any),
      eeIds.length
        ? supabase.from('expression_ecrite_tasks').select('id, title, word_count_max, task_type, instructions').in('id', eeIds)
        : Promise.resolve({ data: [], error: null } as any),
      eoIds.length
        ? supabase.from('expression_orale_subjects').select('id, content, question, task_id, period_id, subject_number, partie_number').in('id', eoIds)
        : Promise.resolve({ data: [], error: null } as any),
    ]);

    if ((compRes as any)?.error) throw (compRes as any).error;
    if ((eeRes as any)?.error) throw (eeRes as any).error;
    if ((eoRes as any)?.error) throw (eoRes as any).error;

    // Additional hydration for comprehension: options, media list, series
    const compList: any[] = (compRes as any).data || [];
    const seriesIds = Array.from(new Set(compList.map((q) => q.test_series_id).filter(Boolean)));

    const [optionsRes, mediaRes, seriesRes] = await Promise.all([
      compIds.length
        ? supabase.from('options').select('id, question_id, content, label, is_correct').in('question_id', compIds)
        : Promise.resolve({ data: [], error: null } as any),
      compIds.length
        ? supabase.from('question_media').select('id, question_id, media_url, media_type, description, display_order').in('question_id', compIds)
        : Promise.resolve({ data: [], error: null } as any),
      seriesIds.length
        ? supabase.from('test_series').select('id, name, slug').in('id', seriesIds)
        : Promise.resolve({ data: [], error: null } as any),
    ]);

    if ((optionsRes as any)?.error) throw (optionsRes as any).error;
    if ((mediaRes as any)?.error) throw (mediaRes as any).error;
    if ((seriesRes as any)?.error) throw (seriesRes as any).error;

    const optionsByQuestion = new Map<string, any[]>();
    for (const o of ((optionsRes as any).data || [])) {
      const k = String(o.question_id);
      if (!optionsByQuestion.has(k)) optionsByQuestion.set(k, []);
      optionsByQuestion.get(k)!.push(o);
    }

    const mediaByQuestion = new Map<string, any[]>();
    for (const m of ((mediaRes as any).data || [])) {
      const k = String(m.question_id);
      if (!mediaByQuestion.has(k)) mediaByQuestion.set(k, []);
      mediaByQuestion.get(k)!.push(m);
    }

    const seriesMap = new Map<string, any>();
    for (const s of ((seriesRes as any).data || [])) seriesMap.set(String(s.id), s);

    // map comp with enrichments
    const compMap = new Map<string, any>();
    for (const q of compList) {
      const id = String(q.id);
      compMap.set(id, {
        ...q,
        options: (optionsByQuestion.get(id) || []).sort((a, b) => a.label.localeCompare(b.label)),
        media: (mediaByQuestion.get(id) || []).sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)),
        series: q.test_series_id ? seriesMap.get(String(q.test_series_id)) : null,
      });
    }

    const eeMap = new Map<string, any>();
    for (const t of (eeRes as any).data || []) eeMap.set(String(t.id), t);

    let eoList: any[] = (eoRes as any).data || [];

    // Fallback: if eoList is empty but eoIds provided, try interpreting eoIds as task IDs
    // Map from original EO input id (possibly task_id) to selected subject
    const eoInputToSubject = new Map<string, any>();

    if ((!eoList || eoList.length === 0) && eoIds.length > 0) {
      const fallbackSubjects = await supabase
        .from('expression_orale_subjects')
        .select('id, content, question, task_id, period_id, subject_number, partie_number')
        .in('task_id', eoIds);
      if ((fallbackSubjects as any).error) throw (fallbackSubjects as any).error;
      const allSubs: any[] = (fallbackSubjects as any).data || [];
      if (allSubs.length > 0) {
        // pick first subject per task (lowest subject_number)
        const byTask = new Map<string, any[]>();
        for (const s of allSubs) {
          const k = String(s.task_id);
          if (!byTask.has(k)) byTask.set(k, []);
          byTask.get(k)!.push(s);
        }
        const picked: any[] = [];
        for (const tId of eoIds) {
          const arr = byTask.get(String(tId)) || [];
          if (arr.length > 0) {
            arr.sort((a, b) => (a.subject_number ?? 0) - (b.subject_number ?? 0));
            const subj = arr[0];
            picked.push(subj);
            eoInputToSubject.set(String(tId), subj);
          }
        }
        eoList = picked;
      }
    }

    const eoMap = new Map<string, any>();
    for (const s of eoList) eoMap.set(String(s.id), s);

    // Hydrate and keep original order from input arrays
    // Build EO hydrated list with per-item resolver if needed
    const compHydrated = (Array.isArray(plan?.comprehension) ? plan.comprehension : []).map((x: any) => ({
      id: getId(x),
      ...compMap.get(String(getId(x))),
    }));

    const eeHydrated = (Array.isArray(plan?.expression_ecrite) ? plan.expression_ecrite : []).map((x: any) => ({
      id: getId(x),
      ...eeMap.get(String(getId(x))),
    }));

    const eoInput = Array.isArray(plan?.expression_orale) ? plan.expression_orale : [];
    const eoResolved: any[] = [];
    const eoFetchPromises: Promise<void>[] = [];

    for (const x of eoInput) {
      const inId = String(getId(x));
      const subj = eoMap.get(inId) || eoInputToSubject.get(inId);
      if (subj) {
        eoResolved.push({ id: subj.id, ...subj });
        continue;
      }
      // Per-item resolver using metadata on x
      let taskId = x?.task_id || x?.taskId || x?.eo_task_id || x?.eoTaskId || null;
      const periodId = x?.period_id || x?.periodId || null;
      const partieNum = x?.partie_number ?? x?.partieNumber;
      const subjectNum = x?.subject_number ?? x?.subjectNumber;
      const taskNumber = x?.task_number ?? x?.taskNumber;

      eoFetchPromises.push((async () => {
        // If taskId missing but we have (periodId, taskNumber), resolve task first
        if (!taskId && periodId && typeof taskNumber === 'number') {
          const taskRes = await supabase
            .from('expression_orale_tasks')
            .select('id')
            .eq('period_id', periodId)
            .eq('task_number', taskNumber)
            .limit(1)
            .single();
          if (!(taskRes as any).error && (taskRes as any).data?.id) {
            taskId = (taskRes as any).data.id;
          }
        }

        let query = supabase
          .from('expression_orale_subjects')
          .select('id, content, question, task_id, period_id, subject_number, partie_number')
          .order('subject_number', { ascending: true })
          .limit(1);

        if (taskId) query = query.eq('task_id', taskId);
        if (periodId) query = query.eq('period_id', periodId);
        if (typeof partieNum === 'number') query = query.eq('partie_number', partieNum);
        if (typeof subjectNum === 'number') query = query.eq('subject_number', subjectNum);

        const res = await query;
        if ((res as any).error) return;
        const row = ((res as any).data || [])[0];
        if (row) {
          eoResolved.push({ id: row.id, ...row });
        } else {
          // last resort: pass-through any EO-like fields from draft item
          if (x?.question || x?.content) {
            eoResolved.push({
              id: inId,
              question: x?.question ?? null,
              content: x?.content ?? null,
              partie_number: x?.partie_number ?? x?.partieNumber ?? null,
              subject_number: x?.subject_number ?? x?.subjectNumber ?? null,
              task_id: taskId,
              period_id: periodId,
            });
          } else {
            eoResolved.push({ id: inId });
          }
        }
      })());
    }

    if (eoFetchPromises.length) {
      await Promise.allSettled(eoFetchPromises);
    }

    const hydrated = {
      comprehension: compHydrated,
      expression_ecrite: eeHydrated,
      expression_orale: eoResolved,
    };

    return NextResponse.json({ data: { plan: hydrated } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur inconnue' }, { status: 400 });
  }
}

