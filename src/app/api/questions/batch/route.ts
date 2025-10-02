import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';

export async function POST(req: Request) {
  const supabase = getSupabaseServiceClient();
  try {
    const body = await req.json();
    const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
    if (ids.length === 0) return NextResponse.json({ data: [] });

    // Fetch questions with options and media
    const { data, error } = await supabase
      .from('questions')
      .select(`
        id,
        content,
        speaker_name,
        question_text,
        context_text,
        question_number,
        test_series_id,
        created_at,
        options:options(id, label, content, is_correct),
        media:question_media(id, media_url, media_type, description, display_order),
        test_series:test_series(
          id,
          name,
          slug,
          module:modules(id, type, type_module)
        )
      `)
      .in('id', ids);
    if (error) throw error;

    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur inconnue' }, { status: 400 });
  }
}
