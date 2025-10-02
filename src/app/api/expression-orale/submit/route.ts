import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseServiceClient } from '@/lib/supabase/service-client';

export const dynamic = 'force-dynamic';

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const period_id = String(form.get('period_id') || '');
    const task_id = String(form.get('task_id') || '');
    const subject_id = String(form.get('subject_id') || '');
    const task_number = Number(form.get('task_number') || 0);
    const duration_sec = Number(form.get('duration_sec') || 0);
    const user_email = String(form.get('user_email') || '');
    const user_name = String(form.get('user_name') || '');
    const audio = form.get('audio') as File | null;

    if (!period_id || !task_id || !subject_id || !task_number || !duration_sec || !user_email || !audio) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
    }

    // Duration limits by task
    const maxDur = task_number === 2 ? 120 : task_number === 3 ? 240 : 180;
    if (duration_sec > maxDur + 5) { // 5s grace
      return NextResponse.json({ error: `Durée trop longue (max ${maxDur}s pour T${task_number})` }, { status: 400 });
    }

    // Size limit ~7MB
    if (audio.size > 7 * 1024 * 1024) {
      return NextResponse.json({ error: 'Fichier audio trop volumineux (> 7 Mo)' }, { status: 400 });
    }

    const ab = await audio.arrayBuffer();
    const buf = Buffer.from(ab);
    const b64 = buf.toString('base64');

    const resend = new Resend(env('RESEND_API_KEY'));
    const to = env('RESEND_TO');
    const from = env('RESEND_FROM');

    // Fetch human-friendly labels from DB
    const db = supabaseServiceClient;
    let periodLabel = period_id;
    let subjectLabel = subject_id;
    let subjectNumber: number | null = null;
    try {
      const { data: per, error: perErr } = await db
        .from('expression_orale_periods')
        .select('title, month, year')
        .eq('id', period_id)
        .single();
      if (!perErr && per) {
        periodLabel = per.title || `${String(per.month).padStart(2, '0')}/${per.year}`;
      }
      const { data: subj, error: subjErr } = await db
        .from('expression_orale_subjects')
        .select('title, question, subject_number')
        .eq('id', subject_id)
        .single();
      if (!subjErr && subj) {
        subjectNumber = subj.subject_number ?? null;
        const heading = subj.title || subj.question || 'Sujet';
        subjectLabel = `${subjectNumber ? `Sujet ${String(subjectNumber).padStart(2, '0')} — ` : ''}${heading}`;
      }
    } catch {}

    const subject = `Soumission Expression Orale T${task_number} — ${user_name || user_email}`;
    const html = `
      <div style="font-family:-apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height:1.55; color:#0f172a;">
        <h2 style="margin:0 0 12px; font-weight:600;">Nouvelle soumission — Expression Orale (TCF)</h2>
        <p style="margin:0 0 6px;"><strong>Utilisateur:</strong> ${user_name || '-'} (${user_email})</p>
        <p style="margin:0 0 6px;"><strong>Période:</strong> ${periodLabel}</p>
        <p style="margin:0 0 6px;"><strong>Tâche:</strong> T${task_number}</p>
        <p style="margin:0 0 6px;"><strong>Sujet:</strong> ${subjectLabel}</p>
        <p style="margin:0 0 6px;"><strong>Durée:</strong> ${duration_sec}s</p>
        <p style="margin:12px 0 0;">Voir la pièce jointe audio.</p>
        <hr style="margin:20px 0; border:none; border-top:1px solid #e5e7eb;" />
        <div style="font-size:12px; color:#64748b; text-align:center;">
          Développé par <strong>EVOLUE</strong>
        </div>
      </div>
    `;

    const fileName = (audio as any).name || `expression-orale-t${task_number}.webm`;
    const mime = audio.type || 'audio/webm';

    const res = await resend.emails.send({
      from,
      to,
      subject,
      html,
      attachments: [
        {
          content: b64,
          filename: fileName,
          contentType: mime,
        },
      ],
    });

    if ((res as any).error) {
      console.error((res as any).error);
      return NextResponse.json({ error: "Échec de l'envoi de l'email" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, meta: { period: periodLabel, task: `T${task_number}`, subject: subjectLabel, duration_sec } });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message ?? 'Erreur serveur' }, { status: 500 });
  }
}
