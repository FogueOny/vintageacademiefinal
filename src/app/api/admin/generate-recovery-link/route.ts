import { NextResponse } from 'next/server';
import { headers, cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { email, redirectTo } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    // Cookies handled by createServerSupabaseClient
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: sessionErr,
    } = await supabase.auth.getUser();
    if (sessionErr || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier que l'utilisateur courant est admin
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profErr || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return NextResponse.json({ error: 'Configuration Supabase manquante côté serveur' }, { status: 500 });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { autoRefreshToken: false, persistSession: false } });

    // Next.js 15 types: headers() may be Promise-typed in some contexts
    const hdrs = await headers();
    const origin = hdrs.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const finalRedirect = (typeof redirectTo === 'string' && redirectTo.length > 0)
      ? redirectTo
      : `${origin}/auth/update-password`;

    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: finalRedirect },
    } as any);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // data.properties.action_link contiendra le lien avec token_hash utilisable directement
    return NextResponse.json({ action_link: data?.properties?.action_link || null, data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur serveur' }, { status: 500 });
  }
}
