import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type SubmitRouteParams = {
  params: {
    id: string;
  };
};

export async function POST(_req: Request, ctx: SubmitRouteParams) {
  try {
    const { id } = ctx.params ?? {};
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) {
      console.warn('[attempts/:id/submit] auth.getUser error', userError);
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
    }
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const { data: att, error: attErr } = await supabase
      .from('simulator_attempts')
      .select('id, user_id, status, started_at')
      .eq('id', id)
      .maybeSingle();
    if (attErr) throw attErr;
    if (!att || att.user_id !== user.id) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
    if (att.status === 'submitted' || att.status === 'graded') {
      return NextResponse.json({ data: { id, status: att.status } }, { status: 200 });
    }

    const started = att.started_at ? new Date(att.started_at).getTime() : Date.now();
    const now = Date.now();
    const durationSeconds = Math.max(0, Math.floor((now - started) / 1000));

    const { data: upd, error: updErr } = await supabase
      .from('simulator_attempts')
      .update({ status: 'submitted', submitted_at: new Date().toISOString(), duration_seconds: durationSeconds })
      .eq('id', id)
      .select('id, status, submitted_at, duration_seconds')
    if (updErr) throw updErr;

    // Déclencher l'évaluation IA en tâche de fond (best-effort)
    try {
      // Déterminer une base URL fiable
      const headerStore = await headers();
      const proto = headerStore.get('x-forwarded-proto') ?? 'http';
      const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host') ?? 'localhost:3000';
      const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`;
      // Appel en interne; on ne propage pas l'erreur au client pour ne pas bloquer l'UX
      fetch(`${base}/api/simulator/attempts/${encodeURIComponent(id)}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).then(async (r) => {
        if (!r.ok) {
          const payload = await r.json().catch(() => ({} as Record<string, unknown>));
          console.warn('[submit] evaluate trigger failed', r.status, payload?.error);
        } else {
          console.log('[submit] evaluate trigger accepted', r.status);
        }
      }).catch((triggerError: unknown) => {
        const message = triggerError instanceof Error ? triggerError.message : String(triggerError);
        console.warn('[submit] evaluate trigger error', message);
      });
    } catch (triggerWrapError) {
      console.warn('[submit] evaluate trigger wrapper error', triggerWrapError);
      // silencieux
    }

    return NextResponse.json({ data: upd }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
