import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  try {
    const { id } = ctx.params || ({} as any);
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

    const supabase = await createServerSupabaseClient();

    const { data: combo, error } = await supabase
      .from('expression_ecrite_combinations')
      .select(`
        id, combination_number, title, created_at,
        period:expression_ecrite_periods(id, month, year, slug, title),
        tasks:expression_ecrite_tasks(
          id, task_number, title, description, word_count_min, word_count_max, task_type, instructions,
          docs:expression_ecrite_documents(id, document_number, title, content)
        )
      ` as any)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!combo) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Cast to any because the join aliases (period, tasks.docs) are not part of generated Database types
    const c: any = combo as any;

    const detail = {
      id: c.id,
      title: c.title || `Combinaison #${c.combination_number}`,
      created_at: c.created_at,
      period: c.period ? { id: c.period.id, title: c.period.title, month: c.period.month, year: c.period.year, slug: c.period.slug } : null,
      tasks: (c.tasks || [])
        .sort((a: any, b: any) => a.task_number - b.task_number)
        .map((t: any) => ({
          id: t.id,
          task_number: t.task_number,
          title: t.title,
          description: t.description,
          word_count_min: t.word_count_min,
          word_count_max: t.word_count_max,
          task_type: t.task_type,
          instructions: t.instructions,
          documents: (t.docs || []).sort((a: any, b: any) => a.document_number - b.document_number).map((d: any) => ({
            id: d.id,
            document_number: d.document_number,
            title: d.title,
            content: d.content,
          })),
        })),
    };

    return NextResponse.json({ data: detail });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur serveur' }, { status: 500 });
  }
}
