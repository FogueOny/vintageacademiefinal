import { NextResponse } from "next/server";
import { Resend } from "resend";

const TO_EMAIL = "info@vintageacademie.cm";

type Body = {
  task_id: string;
  task_number: number;
  task_title?: string | null;
  answer_text: string;
  word_count: number;
  time_spent_sec: number;
  user_email?: string;
  user_name?: string;
};

function countWords(text: string): number {
  const words = text
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
  if (words.length === 1 && words[0] === "") return 0;
  return words.length;
}

function maxWordsForTask(taskNumber: number) {
  if (taskNumber === 1) return 120;
  if (taskNumber === 2) return 150;
  return 180;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    if (!body || !body.task_id || !body.answer_text) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }

    // Candidat requis
    if (!body.user_name || !body.user_name.trim()) {
      return NextResponse.json({ error: "Le nom du candidat est requis" }, { status: 400 });
    }
    if (!body.user_email || !body.user_email.trim()) {
      return NextResponse.json({ error: "L'email du candidat est requis" }, { status: 400 });
    }
    const email = String(body.user_email).trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    const wc = countWords(body.answer_text);
    const max = maxWordsForTask(Number(body.task_number));
    if (wc !== body.word_count || wc > max) {
      return NextResponse.json({ error: "Nombre de mots invalide" }, { status: 400 });
    }

    // Validation OK — envoi via Resend côté serveur
    const submittedAt = new Date().toISOString();
    const normalized = {
      task_id: body.task_id,
      task_number: String(body.task_number),
      task_title: body.task_title || "",
      word_count: String(wc),
      word_limit: String(max),
      time_spent_sec: String(Math.max(0, Math.floor(Number(body.time_spent_sec) || 0))),
      answer_text: body.answer_text,
      user_name: body.user_name || "",
      user_email: email,
      submitted_at: submittedAt,
      site_name: "Vintage Académie",
    };

    const resend = new Resend(process.env.RESEND_API_KEY);
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "RESEND_API_KEY non configurée" }, { status: 500 });
    }

    const toEmail = process.env.RESEND_TO || TO_EMAIL;
    const fromEmail = process.env.RESEND_FROM || "Vintage Académie <onboarding@resend.dev>";
    const subject = `[${normalized.site_name}] Réponse Expression Écrite — Tâche ${normalized.task_number}${normalized.user_name ? " — " + normalized.user_name : ""}`;

    const html = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #2c3e50;">
        <div style="font-size: 16px; margin-bottom: 10px;">📩 Nouvelle réponse reçue via <strong>${normalized.site_name}</strong></div>
        <div style="margin: 12px 0; color: #4b5563;">
          <strong>${normalized.user_name}</strong> (${normalized.user_email}) a soumis une réponse pour 
          <strong>Tâche ${normalized.task_number}</strong>
          ${normalized.task_title ? ` — “${normalized.task_title}”` : ""}
          <br />
          <span style="font-size: 12px; color: #94a3b8;">Reçu le ${normalized.submitted_at}</span>
        </div>
        <div style="margin:16px 0; padding: 12px; border: 1px dashed #e5e7eb; border-radius: 8px; background: #fff7ed;">
          <table role="presentation" style="border-collapse: collapse; width: 100%;">
            <tr><td style="vertical-align: top; padding: 4px 0;"><strong>Identifiant sujet:</strong></td><td style="vertical-align: top; padding: 4px 0; color:#334155;">${normalized.task_id}</td></tr>
            <tr><td style="vertical-align: top; padding: 4px 0;"><strong>Contrainte:</strong></td><td style="vertical-align: top; padding: 4px 0; color:#334155;">${normalized.word_count} / ${normalized.word_limit} mots</td></tr>
            <tr><td style="vertical-align: top; padding: 4px 0;"><strong>Temps utilisé:</strong></td><td style="vertical-align: top; padding: 4px 0; color:#334155;">${normalized.time_spent_sec} sec</td></tr>
            <tr><td style="vertical-align: top; padding: 4px 0;"><strong>Candidat:</strong></td><td style="vertical-align: top; padding: 4px 0; color:#334155;">${normalized.user_name} — <a href="mailto:${normalized.user_email}" style="color:#ea580c; text-decoration: none;">${normalized.user_email}</a></td></tr>
          </table>
        </div>
        <div style="margin-top: 14px;">
          <div style="font-size: 13px; color:#9a3412; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 6px;">Réponse du candidat</div>
          <div style="font-size: 14px; color:#334155; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;">${
            normalized.answer_text.replace(/</g, "&lt;")
          }</div>
        </div>
        <div style="margin-top: 18px; font-size: 12px; color:#94a3b8;">Mail envoyé automatiquement par ${normalized.site_name}. Merci de ne pas partager ce message en dehors de l’équipe.</div>
      </div>
    `;

    const sendRes = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject,
      html,
      replyTo: normalized.user_email,
    });

    if (sendRes.error) {
      return NextResponse.json({ error: sendRes.error.message || "Erreur d'envoi Resend" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: sendRes.data?.id || null }, { status: 200 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message ?? "Erreur serveur" }, { status: 500 });
  }
}

