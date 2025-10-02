import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service-client';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
export const runtime = 'nodejs';

function generateOtp(): string {
  // 6-digit numeric OTP, no leading zeros lost
  const num = Math.floor(100000 + Math.random() * 900000);
  return String(num);
}

function hashOtp(otp: string, salt: string) {
  const hash = crypto.createHmac('sha256', salt).update(otp).digest('hex');
  return hash;
}

async function sendEmail(to: string, otp: string) {
  // Try RESEND first
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || 'support@vintageacademie.com';
  const subject = 'Votre code de réinitialisation (OTP)';
  const html = `<p>Bonjour,</p><p>Voici votre code de réinitialisation de mot de passe:</p><h2 style="letter-spacing:2px">${otp}</h2><p>Ce code expire dans 10 minutes.</p><p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`;

  if (apiKey) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(apiKey);
      await resend.emails.send({ from, to, subject, html });
      return true;
    } catch (e) {
      console.warn('[request-otp] Resend failed, falling back to log:', e);
    }
  }

  // Fallback: Nodemailer SMTP if configured
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || 'support@vintageacademie.com';
  if (smtpHost && smtpPort && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for others
        auth: { user: smtpUser, pass: smtpPass },
      });
      await transporter.sendMail({ from: smtpFrom, to, subject, html });
      return true;
    } catch (e) {
      console.warn('[request-otp] SMTP send failed, falling back to log:', e);
    }
  }

  // Fallback: log to server console for dev
  console.log(`[request-otp] OTP for ${to}: ${otp}`);
  return true;
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
    }
    const normalizedEmail = email.trim().toLowerCase();

    const supabase = getSupabaseServiceClient();

    // Résoudre l'identifiant utilisateur via la table profiles
    let userId: string | null = null;
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', normalizedEmail)
        .maybeSingle<{ id: string }>();

      if (profileError) {
        console.error('[request-otp] profile lookup error', profileError);
      }

      if (profile?.id) {
        userId = profile.id;
      }
    } catch (lookupError) {
      console.error('[request-otp] profile lookup threw', lookupError);
    }

    const otp = generateOtp();
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashOtp(otp, salt);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Insert row
    const { error: insertError } = await (supabase as any)
      .from('password_reset_otps')
      .insert({ email: normalizedEmail, user_id: userId, otp_hash: hash, otp_salt: salt, expires_at: expiresAt });

    if (insertError) {
      console.error('[request-otp] insert error', insertError);
      return NextResponse.json({ error: "Impossible de générer un code pour le moment" }, { status: 500 });
    }

    await sendEmail(normalizedEmail, otp);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[request-otp] unhandled', e?.message || e);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
