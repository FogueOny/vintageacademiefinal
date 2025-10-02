import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

// Server-only: Evaluate an attempt using OpenRouter and store ai_evaluations rows
export async function POST(_req: Request, ctx: { params: { id: string } }) {
  try {
    const { id } = ctx.params || ({} as any);
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });
    // Dry-run mode: don't write to DB, just return parsed feedback
    const url = new URL(_req.url);
    const dry = url.searchParams.get('dry') === '1' || url.searchParams.get('dryRun') === '1';
    const perTask = url.searchParams.get('per_task') === '1' || url.searchParams.get('perTask') === '1';
    const taskParam = url.searchParams.get('task');
    const taskNum = taskParam ? Number(taskParam) : undefined;
    if (perTask && (!taskNum || ![1,2,3].includes(taskNum))) {
      return NextResponse.json({ error: 'Paramètre task invalide (1,2,3)' }, { status: 400 });
    }

    // OpenAI-only pipeline
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string | undefined;
    const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    if (!OPENAI_API_KEY) return NextResponse.json({ error: 'OPENAI_API_KEY manquant' }, { status: 500 });
    console.log('[evaluate] start (openai)', { id, OPENAI_BASE_URL, OPENAI_MODEL });

    const maybeCookies: any = cookies() as any;
    const cookieStore = typeof maybeCookies?.then === 'function' ? await maybeCookies : maybeCookies;
    const supabase = await createServerSupabaseClient();
    const { data: session } = await supabase.auth.getUser();
    const user = session?.user;

    // Admin client for fallback and writes
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!SUPABASE_URL || !SERVICE_ROLE) return NextResponse.json({ error: 'Config serveur manquante' }, { status: 500 });
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { autoRefreshToken: false, persistSession: false } });

    // Try to enforce ownership; if not possible, fallback to admin read (internal call from submit)
    let attempt: any = null;
    try {
      const { data: a1, error: e1 } = await supabase
        .from('simulator_attempts')
        .select('id, user_id, combination_id, status')
        .eq('id', id)
        .maybeSingle();
      if (e1) throw e1;
      attempt = a1;
      if (user && attempt && attempt.user_id !== user.id) {
        return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
      }
    } catch (_) {
      // fallback admin read
      const { data: a2, error: e2 } = await admin
        .from('simulator_attempts')
        .select('id, user_id, combination_id, status')
        .eq('id', id)
        .maybeSingle();
      if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
      attempt = a2;
    }
    if (!attempt) return NextResponse.json({ error: 'Tentative introuvable' }, { status: 404 });

    // Mark evaluating early (best-effort) unless dry-run
    if (!dry) {
      try {
        await admin
          .from('simulator_attempts')
          .update({ status: 'evaluating' })
          .eq('id', id)
          .neq('status', 'graded');
      } catch (e) {
        console.warn('[evaluate] failed to mark evaluating', e);
      }
    }

    // Load tasks with docs and answers
    const { data: tasks } = await admin
      .from('expression_ecrite_tasks')
      .select('id, task_number, title, description, instructions, word_count_min, word_count_max, documents:expression_ecrite_documents(id, document_number, title, content)')
      .eq('combination_id', attempt.combination_id)
      .order('task_number');
    const { data: answers } = await admin
      .from('simulator_answers')
      .select('task_number, content, word_count')
      .eq('attempt_id', id);

    const ordered = (tasks || []).sort((a: any, b: any) => a.task_number - b.task_number);
    const getAns = (tn: number) => (answers || []).find(a => a.task_number === tn);

    // Clamp contents to reduce token usage
    const CLAMP_DOC = Number(process.env.OPENROUTER_CLAMP_DOC || 1800);
    const CLAMP_ANS = Number(process.env.OPENROUTER_CLAMP_ANS || 1600);
    const clamp = (s?: string, n?: number) => {
      const max = (n && Number.isFinite(n)) ? Number(n) : 1600;
      if (!s) return '';
      return s.length > max ? (s.slice(0, max) + `\n[TRONQUÉ: +${s.length - max} caractères]`) : s;
    };

    const promptTasksAll = ordered.map((t: any) => ({
      task_number: t.task_number,
      title: t.title,
      description: clamp(t.description, 1200),
      instructions: clamp(t.instructions, 1200),
      word_count_min: t.word_count_min,
      word_count_max: t.word_count_max,
      documents: (t.documents || [])
        .sort((a: any, b: any) => a.document_number - b.document_number)
        .map((d: any) => ({
          document_number: d.document_number,
          title: clamp(d.title, 180),
          content: clamp(d.content, CLAMP_DOC),
        })),
      answer: clamp(getAns(t.task_number)?.content || '', CLAMP_ANS),
      word_count_user: getAns(t.task_number)?.word_count || 0,
    }));
    const promptTasks = perTask ? promptTasksAll.filter((t: any) => t.task_number === taskNum) : promptTasksAll;
    if (perTask && promptTasks.length === 0) {
      return NextResponse.json({ error: 'Tâche demandée introuvable pour cette combinaison' }, { status: 404 });
    }

    // Build a compact but structured prompt for the 3 tasks
    const basePayload = {
      messages: [
        {
          role: 'system',
          content: `Tu es un examinateur expert du TCF Canada (Expression Écrite). Objectif: fournir pour chaque tâche un feedback hautement personnalisé, ancré dans le texte de l'utilisateur, et une RÉÉCRITURE niveau C2 spécifique à SA réponse.\n\nINSTRUCTIONS DÉTAILLÉES\n- Critères d'évaluation: adéquation à la consigne et au GENRE de la tâche, cohérence/organisation, richesse lexicale, correction grammaticale, connecteurs, respect indicatif des limites de mots.\n- Ancrage sur le texte utilisateur: cite 3–5 extraits courts (entre « ») dans tes remarques (positives et améliorations). Interdiction de feedback générique non relié au texte.\n- Micro-corrections concrètes: dans les améliorations, privilégie des corrections point par point (Avant → Après), par ex.: connecteurs variés, reformulation, accords, ponctuation, précision lexicale.\n- Réécriture C2: produis une version complète du texte utilisateur au niveau C2 qui conserve l'intention, les arguments et les informations d'origine (NE PAS ajouter de faits externes). Respecte le genre de la tâche (courriel/blog/synthèse).\n- Tâche 3: résume d'abord les 2 documents SANS inventer, puis prends position et conclus.\n\nFORMAT DE SORTIE (JSON STRICT)\n{\n  "evaluations": [\n    {\n      "task_number": 1,\n      "score_20": number,\n      "cecr_level": "A2|B1|B2|C1|C2",\n      "word_count_detected": number,\n      "positives": ["Inclure des citations du texte utilisateur entre « » pour justifier."],\n      "improvements": ["Fournir des corrections concrètes (Avant → Après) et citer des extraits entre « » pour ancrer la remarque."],\n      "suggested_correction": "Mettre ICI la réécriture C2 complète et spécifique au texte utilisateur."
    },
    { "task_number": 2, "score_20": number, "cecr_level": "A2|B1|B2|C1|C2", "word_count_detected": number, "positives": string[], "improvements": string[], "suggested_correction": string },
    { "task_number": 3, "score_20": number, "cecr_level": "A2|B1|B2|C1|C2", "word_count_detected": number, "positives": string[], "improvements": string[], "suggested_correction": string }
  ],\n  "summary": {"overall_level": "A2|B1|B2|C1|C2", "general_feedback": "Synthèse brève et actionnable"}\n}\n\nEXIGENCES\n- JSON uniquement, pas de texte hors JSON.\n- Chaque entrée 'positives' et 'improvements' doit faire référence explicitement à des extraits entre « ».\n- 'suggested_correction' doit contenir UNIQUEMENT la version réécrite C2 complète.\n- Interdiction d'ajouter des faits extérieurs au texte utilisateur et aux documents de la tâche 3.`
        },
        {
          role: 'user',
          content: JSON.stringify({ tasks: promptTasks })
        }
      ],
      temperature: 0.2,
      max_tokens: Number(process.env.OPENAI_MAX_TOKENS || process.env.OPENROUTER_MAX_TOKENS || 1200),
    } as any;
    const payload = { ...basePayload, model: OPENAI_MODEL } as any;
    let payloadBytes = 0;
    try {
      payloadBytes = JSON.stringify(payload).length;
      console.log('[evaluate] payload_bytes', payloadBytes);
    } catch {}

    console.log('[evaluate] calling openai…');
    const res = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    console.log('[evaluate] openai_status', res.status);
    const modelUsed: string = payload.model;
    if (!res.ok) {
      console.error('Provider error:', json);
      const msg = (json?.error?.message) || (json?.error) || 'Échec appel provider';
      return NextResponse.json({ error: msg, provider_status: res.status }, { status: res.status });
    }

    const content: string | undefined = json?.choices?.[0]?.message?.content;
    const contentLen = typeof content === 'string' ? content.length : 0;
    console.log('[evaluate] content_len', contentLen);
    if (!content) return NextResponse.json({ error: 'Réponse IA vide' }, { status: 500 });

    // Parse strict JSON (some models wrap in code fences)
    const cleaned = content.replace(/^```(json)?/i, '').replace(/```$/i, '').trim();
    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.warn('[evaluate] primary JSON parse failed, trying fallback', (e as any)?.message);
      // try a last resort extraction of JSON
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (!m) return NextResponse.json({ error: 'JSON IA invalide' }, { status: 500 });
      parsed = JSON.parse(m[0]);
    }
    try {
      console.log('[evaluate] parsed_evaluations_len', Array.isArray(parsed?.evaluations) ? parsed.evaluations.length : 0);
    } catch {}

    // admin already created above

    const rows: any[] = [];
    const evals = Array.isArray(parsed?.evaluations) ? parsed.evaluations : [];
    for (const e of evals) {
      if (![1,2,3].includes(Number(e?.task_number))) continue;
      const pos = Array.isArray(e.positives) ? e.positives.filter((x: any) => typeof x === 'string' && x.trim().length > 0) : [];
      const imp = Array.isArray(e.improvements) ? e.improvements.filter((x: any) => typeof x === 'string' && x.trim().length > 0) : [];
      rows.push({
        attempt_id: id,
        task_number: Number(e.task_number),
        score_20: typeof e.score_20 === 'number' ? e.score_20 : null,
        cecr_level: typeof e.cecr_level === 'string' ? e.cecr_level : null,
        positives: pos.length > 0 ? pos : null,
        improvements: imp.length > 0 ? imp : null,
        suggested_correction: typeof e.suggested_correction === 'string' ? e.suggested_correction : null,
      });
    }
    // Summary row disabled to avoid potential NOT NULL constraint on task_number; can be re-enabled later if schema allows

    if (dry) {
      return NextResponse.json({
        ok: true,
        inserted: 0,
        provider_status: 200,
        model_used: modelUsed,
        payload_bytes: payloadBytes,
        content_len: contentLen,
        preview: { evaluations: evals, summary: parsed?.summary || null },
      });
    } else {
      let insertedCount = 0;
      if (rows.length > 0) {
        const { error: insErr } = await admin.from('ai_evaluations').insert(rows);
        if (insErr) {
          console.error('[evaluate] insert error', insErr);
          return NextResponse.json({ error: insErr.message }, { status: 400 });
        }
        insertedCount = rows.length;
        console.log('[evaluate] inserted_rows', insertedCount);
        // Only mark graded when not running per-task mode
        if (!perTask) {
          const { error: updErr } = await admin
            .from('simulator_attempts')
            .update({ status: 'graded' })
            .eq('id', id)
            .neq('status', 'graded');
          if (updErr) {
            console.error('Failed to mark attempt graded:', updErr);
          }
        }
      } else {
        console.warn('[evaluate] no rows parsed from AI, keeping status as evaluating');
      }

      return NextResponse.json({
        ok: true,
        inserted: insertedCount,
        provider_status: 200,
        model_used: modelUsed,
        payload_bytes: payloadBytes,
        content_len: contentLen,
      });
    }
  } catch (e: any) {
    console.error('[evaluate] fatal', e);
    return NextResponse.json({ error: e?.message || 'Erreur serveur' }, { status: 500 });
  }
}
