import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';

export async function GET(req: Request) {
  const supabase = getSupabaseServiceClient();
  try {
    const url = new URL(req.url);
    const partieStr = url.searchParams.get('partie_number');
    const exclude = url.searchParams.get('exclude'); // id to exclude
    const partie_number = Number(partieStr);
    if (![2, 3].includes(partie_number)) {
      return NextResponse.json({ error: 'partie_number invalide (2 ou 3 requis)' }, { status: 400 });
    }
    const q = supabase
      .from('expression_orale_subjects')
      .select('id, task_id, partie_number, subject_number, question, content')
      .eq('partie_number', partie_number);
    const { data, error } = exclude ? await q.neq('id', exclude) : await q;
    if (error) throw error;
    const pool = data || [];
    if (pool.length === 0) {
      return NextResponse.json({ error: `Aucun sujet EO disponible pour la partie ${partie_number}` }, { status: 404 });
    }
    const idx = Math.floor(Math.random() * pool.length);
    return NextResponse.json({ data: pool[idx] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur inconnue' }, { status: 400 });
  }
}
