import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
export const runtime = 'nodejs';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// Prefer project prompt file if available
const PROMPT_PATH = path.join(process.cwd(), 'prompt_system.txt');
let BASE_PROMPT = 'Tu es un correcteur TCF Canada.';
try {
  const raw = fs.readFileSync(PROMPT_PATH, 'utf-8');
  const m = raw.match(/`([\s\S]*?)`/);
  BASE_PROMPT = m ? m[1] : raw;
} catch {}

// Enforce the exact JSON schema expected by the frontend
const SYSTEM_PROMPT = `${BASE_PROMPT}\n\n---\nFormat de sortie JSON STRICT:\n{\n  "task_number": 1 | 2 | 3,\n  "score_20": number,\n  "cecr_level": "A1" | "A2" | "B1" | "B2" | "C1" | "C2",\n  "positives": string[],\n  "improvements": string[],\n  "suggested_correction": string\n}\nRéponds UNIQUEMENT en JSON strict, sans texte autour.`;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY)
      return NextResponse.json({ error: 'OPENAI_API_KEY manquant' }, { status: 500 });

    const body = await req.json();
    const { task_number, task, answer } = body || {};
    if (!task_number || !task || !answer?.content)
      return NextResponse.json({ error: 'Payload incomplet' }, { status: 400 });

    const userContent = [
      `Tâche: T${task_number}`,
      task?.title && `Titre: ${task.title}`,
      task?.instructions && `Consignes: ${task.instructions}`,
      task?.description && `Description: ${task.description}`,
      Array.isArray(task?.documents) && task.documents.length
        ? `Documents:\n${task.documents
            .map(
              (d: any) =>
                `D${d.document_number || ''} ${d.title || ''}\n${(d.content || '').slice(0, 1000)}`
            )
            .join('\n\n')}`
        : null,
      `Réponse (~${answer?.word_count ?? '?'} mots):\n${answer.content}`,
    ]
      .filter(Boolean)
      .join('\n\n');

      const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

      async function callOpenAIWithRetry(attempt = 1): Promise<Response> {
        const resp = await fetch(OPENAI_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: OPENAI_MODEL,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: userContent },
            ],
            temperature: 0.2,
            response_format: { type: 'json_object' },
            max_tokens: 700,
          }),
        });
      
        if (resp.status === 429 && attempt < 3) {
          const ra = parseInt(resp.headers.get('retry-after') || '0', 10);
          const waitMs = (ra > 0 ? ra : attempt) * 1000; // 1s, puis 2s
          await sleep(waitMs);
          return callOpenAIWithRetry(attempt + 1);
        }
        return resp;
      }
      
      const r = await callOpenAIWithRetry();

    const ct = r.headers.get('content-type') || '';
    const data: any = ct.includes('application/json') ? await r.json() : { error: await r.text() };
    if (!r.ok) {
      const status = r.status === 429 ? 429 : 502;
      const retryAfter = r.headers.get('retry-after');
      return NextResponse.json({ error: `OpenAI HTTP ${r.status}`, details: data, retry_after: retryAfter ? Number(retryAfter) : undefined }, { status });
    }

    const content = data?.choices?.[0]?.message?.content || '';
    let parsed: any = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    }
    if (!parsed) return NextResponse.json({ error: 'Réponse OpenAI non JSON', raw: content }, { status: 502 });

    parsed.task_number = task_number;
    return NextResponse.json({ model_used: OPENAI_MODEL, evaluation: parsed });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur interne' }, { status: 500 });
  }
}