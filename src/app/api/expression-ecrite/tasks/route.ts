import { NextResponse } from "next/server";
import { supabaseServiceClient } from "@/lib/supabase/service-client";

export const dynamic = 'force-dynamic';

// GET /api/expression-ecrite/tasks
// Retourne une liste de tâches récentes (titre, description, task_number)
export async function GET(req: Request) {
  try {
    const supabase = supabaseServiceClient;
    // Soft check to help debug missing service key
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
      console.warn('[API] Missing Supabase envs for service client');
    }

    const u = new URL(req.url);
    const tn = u.searchParams.get("task_number");
    const periodId = u.searchParams.get("period_id");

    // If period filter is provided, first resolve combinations for that period, then fetch tasks
    if (periodId) {
      const { data: combos, error: cErr } = await supabase
        .from('expression_ecrite_combinations')
        .select('id')
        .eq('period_id', periodId);
      if (cErr) {
        console.error('[API] tasks: combinations fetch error', cErr);
        return NextResponse.json({ error: cErr.message }, { status: 500 });
      }
      const comboIds = (combos || []).map((c: any) => c.id);
      if (comboIds.length === 0) {
        return NextResponse.json({ tasks: [] }, { status: 200 });
      }
      let query = supabase
        .from('expression_ecrite_tasks')
        .select('id, task_number, title, description, instructions, combination_id')
        .in('combination_id', comboIds)
        .order('task_number', { ascending: true })
        .limit(200);
      if (tn) {
        const num = Number(tn);
        if (!Number.isNaN(num)) query = query.eq('task_number', num);
      }
      const { data, error } = await query;
      if (error) {
        console.error("[API] /api/expression-ecrite/tasks Supabase error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ tasks: data ?? [] }, { status: 200 });
    }

    // No period filter: default list (optionally filtered by task number)
    let query = supabase
      .from("expression_ecrite_tasks")
      .select("id, task_number, title, description, instructions")
      .order("task_number", { ascending: true })
      .limit(50);

    if (tn) {
      const num = Number(tn);
      if (!Number.isNaN(num)) {
        query = query.eq("task_number", num);
      }
    }

    const { data, error } = await query;
    if (error) {
      console.error("[API] /api/expression-ecrite/tasks Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tasks: data ?? [] }, { status: 200 });
  } catch (e: any) {
    console.error("[API] /api/expression-ecrite/tasks error:", e);
    const message = e?.message || "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
