import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';

export async function POST(req: Request) {
  const supabase = getSupabaseServiceClient();
  try {
    const body = await req.json();
    const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
    if (ids.length === 0) return NextResponse.json({ data: [] });

    const { data, error } = await supabase
      .from('expression_orale_tasks')
      .select('id, task_number, title, question, content, partie_number, subject_number')
      .in('id', ids);
    if (error) throw error;

    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur inconnue' }, { status: 400 });
  }
}
