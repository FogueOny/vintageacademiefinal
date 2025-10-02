import { NextResponse } from "next/server";
import { supabaseServiceClient } from "@/lib/supabase/service-client";

// GET /api/expression-ecrite/tasks/[id]
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;

    // Simple UUID format validation to fail fast on malformed IDs
    const isUuid = /^[0-9a-fA-F-]{36}$/.test(id);
    if (!isUuid) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const { data, error } = await supabaseServiceClient
      .from("expression_ecrite_tasks")
      .select("id, task_number, title, description, instructions")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[api/expression-ecrite/tasks/:id] Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ task: data }, { status: 200 });
  } catch (e: any) {
    console.error("[api/expression-ecrite/tasks/:id] Handler error:", e);
    return NextResponse.json({ error: e?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
