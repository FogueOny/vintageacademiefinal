import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: Request, ctx: { params: { id: string } }) {
  try {
    const p: any = (ctx as any)?.params ? await (ctx as any).params : (ctx as any)?.params;
    const id = p?.id as string;
    const body = await req.json();
    const task_number = Number(body?.task_number);
    const content = String(body?.content ?? '');
    if (!id || ![1,2,3].includes(task_number)) return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });

    const maybeCookies: any = cookies() as any;
    const cookieStore = typeof maybeCookies?.then === 'function' ? await maybeCookies : maybeCookies;
    const supabase = await createServerSupabaseClient();
    const { data: session } = await supabase.auth.getUser();
    const user = session?.user;
    if (!user) {
      console.warn('[attempts/:id/answer] no user session');
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Ownership
    const { data: att } = await supabase
      .from('simulator_attempts')
      .select('id, user_id, combination_id')
      .eq('id', id)
      .maybeSingle();
    if (!att || att.user_id !== user.id) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

    // Resolve task_id
    const { data: task } = await supabase
      .from('expression_ecrite_tasks')
      .select('id, word_count_min, word_count_max')
      .eq('combination_id', att.combination_id)
      .eq('task_number', task_number)
      .maybeSingle();
    if (!task) return NextResponse.json({ error: 'Tâche introuvable' }, { status: 404 });

    const words = content.trim() ? content.trim().split(/\s+/).length : 0;

    const { error: upErr } = await supabase
      .from('simulator_answers')
      .upsert({ attempt_id: id, task_id: task.id, task_number, content, word_count: words }, { onConflict: 'attempt_id,task_number' } as any);
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });

    return NextResponse.json({ ok: true, word_count: words });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur serveur' }, { status: 500 });
  }
}
