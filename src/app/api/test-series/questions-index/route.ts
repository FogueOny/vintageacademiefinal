import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';

// Body: { series_ids: string[] }
// Returns: { map: Record<question_id, number> } where number is 1-based position within its series
export async function POST(req: Request) {
  const supabase = getSupabaseServiceClient();
  try {
    const body = await req.json().catch(() => ({}));
    const series_ids: string[] = Array.isArray(body?.series_ids) ? body.series_ids : [];
    if (!series_ids.length) return NextResponse.json({ map: {} });

    const map: Record<string, number> = {};

    for (const sid of series_ids) {
      const { data, error } = await supabase
        .from('questions')
        .select('id, question_number, created_at')
        .eq('test_series_id', sid)
        .order('question_number', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true });
      if (error) throw error;
      // Build deterministic order: prefer question_number when present, fallback to created_at
      const sorted = (data || []).slice().sort((a: any, b: any) => {
        const an = a.question_number ?? Number.MAX_SAFE_INTEGER;
        const bn = b.question_number ?? Number.MAX_SAFE_INTEGER;
        if (an !== bn) return an - bn;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
      sorted.forEach((q: any, idx: number) => {
        map[q.id] = idx + 1; // 1-based index
      });
    }

    return NextResponse.json({ map });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur inconnue' }, { status: 400 });
  }
}
