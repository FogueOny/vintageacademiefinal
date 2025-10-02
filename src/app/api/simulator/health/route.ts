import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function GET() {
  const hasKey = Boolean(process.env.OPENAI_API_KEY);
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  return NextResponse.json({
    ok: hasKey,
    provider: 'openai',
    model,
    hasKey,
    timestamp: new Date().toISOString(),
  });
}