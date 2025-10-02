import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { user_id, amount, note } = await req.json();
    if (!user_id || typeof user_id !== 'string') {
      return NextResponse.json({ error: 'user_id requis' }, { status: 400 });
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt)) {
      return NextResponse.json({ error: 'amount invalide' }, { status: 400 });
    }

    // Cookies handled by createServerSupabaseClient
    const supabase = await createServerSupabaseClient();

    const { data: session, error: sessionErr } = await supabase.auth.getUser();
    if (sessionErr || !session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier que l'utilisateur courant est admin
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
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { autoRefreshToken: false, persistSession: false } });

    // Appeler la RPC add_credits (security definer) avec reason admin_adjust et metadata
    const meta = { admin_id: session.user.id, note: typeof note === 'string' ? note : undefined } as any;
    const { error: rpcErr } = await admin.rpc('add_credits', {
      p_user_id: user_id,
      p_amount: amt,
      p_reason: 'admin_adjust',
      p_meta: meta,
    });
    if (rpcErr) {
      return NextResponse.json({ error: rpcErr.message }, { status: 400 });
    }

    // Retourner le nouveau solde
    const { data: balanceRow, error: balErr } = await admin
      .from('user_credits')
      .select('balance')
      .eq('user_id', user_id)
      .maybeSingle();

    if (balErr) {
      return NextResponse.json({ error: balErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, balance: balanceRow?.balance ?? 0 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur serveur' }, { status: 500 });
  }
}
