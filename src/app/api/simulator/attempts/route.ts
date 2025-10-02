import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';

export async function POST(req: Request) {
  try {
    const { combination_id } = (await req.json()) as { combination_id?: string };
    if (!combination_id) return NextResponse.json({ error: 'combination_id requis' }, { status: 400 });

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) {
      console.warn('[simulator/attempts] POST auth.getUser error', userError);
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
    }
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    // Vérifier que la combinaison existe et est active
    const { data: combo } = await supabase
      .from('expression_ecrite_combinations')
      .select('id, is_active')
      .eq('id', combination_id)
      .maybeSingle();
    if (!combo || combo.is_active === false) {
      return NextResponse.json({ error: 'Combinaison indisponible' }, { status: 400 });
    }

    // Service role client pour opérations protégées
    const admin = getSupabaseServiceClient() as SupabaseServiceClient;

    // Consommer 1 crédit
    const { data: consumed, error: consumeErr } = await admin.rpc('consume_attempt_credit', { p_user_id: user.id });
    if (consumeErr) return NextResponse.json({ error: consumeErr.message }, { status: 400 });
    if (!consumed) return NextResponse.json({ error: 'Crédits insuffisants' }, { status: 402 });

    // Créer l'attempt
    const { data: attempt, error: insErr } = await admin
      .from('simulator_attempts')
      .insert({ user_id: user.id, combination_id, status: 'in_progress' })
      .select('id')
      .maybeSingle();
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 });

    return NextResponse.json({ data: { id: attempt?.id } }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Liste des tentatives de l'utilisateur courant
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) {
      console.warn('[simulator/attempts] GET auth.getUser error', userError);
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
    }
    if (!user) {
      console.warn('[attempts] GET no user session');
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('simulator_attempts')
      .select('id, combination_id, status, started_at, submitted_at, duration_seconds')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(100);
    if (error) throw error;

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

type SupabaseServiceClient = ReturnType<typeof getSupabaseServiceClient>;
