import { NextResponse } from "next/server";
import { supabaseServiceClient } from "@/lib/supabase/service-client";

// GET /api/expression-ecrite/periods
export async function GET() {
  try {
    const { data, error } = await supabaseServiceClient
      .from('expression_ecrite_periods')
      .select('id, month, year, slug, title')
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (error) {
      console.error('[API] /api/expression-ecrite/periods Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ periods: data ?? [] }, { status: 200 });
  } catch (e: any) {
    console.error('[API] /api/expression-ecrite/periods error:', e);
    return NextResponse.json({ error: e?.message ?? 'Erreur serveur' }, { status: 500 });
  }
}
