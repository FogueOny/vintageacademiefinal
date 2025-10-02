import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';
import crypto from 'crypto';

type PasswordResetOtpRow = {
  id: string;
  email: string;
  user_id: string | null;
  otp_hash: string;
  otp_salt: string;
  expires_at: string;
  tries: number | null;
};

function hashOtp(otp: string, salt: string) {
  return crypto.createHmac('sha256', salt).update(otp).digest('hex');
}

export async function POST(req: Request) {
  try {
    const { email, otp, new_password } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
    }
    if (!otp || typeof otp !== 'string') {
      return NextResponse.json({ error: 'Code OTP requis' }, { status: 400 });
    }
    if (!new_password || typeof new_password !== 'string' || new_password.length < 6) {
      return NextResponse.json({ error: 'Nouveau mot de passe invalide (6+ caractères)' }, { status: 400 });
    }
    const normalizedEmail = email.trim().toLowerCase();

    const supabase = getSupabaseServiceClient();

    // Fetch latest unused OTP for this email
    const { data: rawRow, error: selErr } = await (supabase as any)
      .from('password_reset_otps')
      .select('id, email, user_id, otp_hash, otp_salt, expires_at, tries')
      .eq('email', normalizedEmail)
      .is('used_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (selErr) {
      console.error('[verify-otp] select error', selErr);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
    const row = rawRow as PasswordResetOtpRow | null;
    if (!row) {
      return NextResponse.json({ error: 'Code expiré ou invalide' }, { status: 400 });
    }

    // Check expiration
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Code expiré' }, { status: 400 });
    }

    // Enforce try limit
    const maxTries = 5;
    if ((row.tries ?? 0) >= maxTries) {
      return NextResponse.json({ error: 'Trop de tentatives. Demandez un nouveau code.' }, { status: 429 });
    }

    const computed = hashOtp(otp, row.otp_salt);
    if (computed !== row.otp_hash) {
      // increment tries
      await (supabase as any)
        .from('password_reset_otps')
        .update({ tries: (row.tries ?? 0) + 1 })
        .eq('id', row.id);
      return NextResponse.json({ error: 'Code incorrect' }, { status: 400 });
    }

    // Mark used
    await (supabase as any)
      .from('password_reset_otps')
      .update({ used_at: new Date().toISOString() })
      .eq('id', row.id);

    // Resolve user id
    let userId: string | null = row.user_id;
    if (!userId) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', normalizedEmail)
          .maybeSingle<{ id: string }>();

        if (profileError) {
          console.error('[verify-otp] profile lookup error', profileError);
        }

        if (profile?.id) {
          userId = profile.id;
        }
      } catch (lookupError) {
        console.error('[verify-otp] profile lookup threw', lookupError);
      }
    }
    if (!userId) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // Update password via admin
    const { error: updErr } = await supabase.auth.admin.updateUserById(userId, { password: new_password });
    if (updErr) {
      console.error('[verify-otp] updateUserById error', updErr);
      return NextResponse.json({ error: "Impossible de mettre à jour le mot de passe" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[verify-otp] unhandled', e?.message || e);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
