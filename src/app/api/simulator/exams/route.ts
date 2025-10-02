import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const pageParam = Number(url.searchParams.get('page') || '1');
    const pageSizeParam = Number(url.searchParams.get('pageSize') || '12');
    const page = Math.max(1, pageParam);
    const pageSize = Math.min(50, Math.max(1, pageSizeParam));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Cookies handled by createServerSupabaseClient
    const supabase = await createServerSupabaseClient();

    const { data: combos, error } = await supabase
      .from('expression_ecrite_combinations')
      .select(`
        id, combination_number, title, created_at,
        period:expression_ecrite_periods(id, month, year, slug, title),
        tasks:expression_ecrite_tasks(
          id, task_number, title, description, word_count_min, word_count_max, task_type
        )
      ` as any)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const items = (combos || []).map((c: any) => ({
      id: c.id,
      title: c.title || `Combinaison #${c.combination_number}`,
      created_at: c.created_at,
      period: c.period ? { id: c.period.id, title: c.period.title, month: c.period.month, year: c.period.year, slug: c.period.slug } : null,
      tasks: (c.tasks || []).sort((a: any, b: any) => a.task_number - b.task_number).map((t: any) => ({
        id: t.id,
        task_number: t.task_number,
        title: t.title,
        word_count_min: t.word_count_min,
        word_count_max: t.word_count_max,
        task_type: t.task_type,
      })),
    }));

    return NextResponse.json({ data: items, page, pageSize });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur serveur' }, { status: 500 });
  }
}
