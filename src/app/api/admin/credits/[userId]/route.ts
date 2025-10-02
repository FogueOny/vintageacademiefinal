import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(req: Request, ctx: { params: { userId: string } }) {
  try {
    const { userId } = ctx.params || ({} as any);
    const url = new URL(req.url);
    const limitParam = Number(url.searchParams.get('limit') || '10');
    const pageParam = Number(url.searchParams.get('page') || '1');
    const limit = Math.min(100, Math.max(1, limitParam));
    const page = Math.max(1, pageParam);

    if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 });

    const supabase = await createServerSupabaseClient();
    const { data: session, error: sessionErr } = await supabase.auth.getUser();
    if (sessionErr || !session?.user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    if (profErr || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!SUPABASE_URL || !SERVICE_ROLE) return NextResponse.json({ error: 'Config serveur manquante' }, { status: 500 });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { autoRefreshToken: false, persistSession: false } });

    const { data: balanceRow } = await admin
      .from('user_credits')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();

    const { data: tx } = await admin
      .from('credit_transactions')
      .select('id, delta, reason, metadata, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range((page-1)*limit, (page*limit)-1);

    return NextResponse.json({ balance: balanceRow?.balance ?? 0, transactions: tx || [], page, limit });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur serveur' }, { status: 500 });
  }
}
