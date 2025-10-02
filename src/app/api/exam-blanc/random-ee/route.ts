import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';

export async function GET(req: Request) {
  const supabase = getSupabaseServiceClient();
  try {
    const url = new URL(req.url);
    const taskNumStr = url.searchParams.get('task_number');
    const exclude = url.searchParams.get('exclude');
    const task_number = Number(taskNumStr);
    if (![1, 2, 3].includes(task_number)) {
      return NextResponse.json({ error: 'task_number invalide (1, 2, ou 3 requis)' }, { status: 400 });
    }
    const q = supabase
      .from('expression_ecrite_tasks')
      .select('id, task_number, title, word_count_max, task_type, description')
      .eq('task_number', task_number);
    const { data, error } = exclude ? await q.neq('id', exclude) : await q;
    if (error) throw error;
    const pool = data || [];
    if (pool.length === 0) {
      return NextResponse.json({ error: `Aucune tâche EE disponible pour T${task_number}` }, { status: 404 });
    }
    const idx = Math.floor(Math.random() * pool.length);
    const picked = pool[idx];
    if (task_number === 3 && picked?.id) {
      const { data: docs, error: docErr } = await supabase
        .from('expression_ecrite_documents')
        .select('id, document_number, content')
        .eq('task_id', picked.id)
        .order('document_number', { ascending: true });
      if (docErr) throw docErr;
      return NextResponse.json({ data: { ...picked, documents: (docs || []).filter(d => typeof d?.document_number === 'number').slice(0, 2) } });
    }
    return NextResponse.json({ data: picked });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur inconnue' }, { status: 400 });
  }
}
