export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    const target = email.toLowerCase();
    const supabase = getSupabaseServiceClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', target)
      .maybeSingle();

    if (error) {
      console.error('[check-email] select profiles error', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({ exists: !!data });
  } catch (e: any) {
    console.error('[check-email] Unexpected error', e);
    return NextResponse.json({ error: e?.message || 'Erreur serveur' }, { status: 500 });
  }
}
