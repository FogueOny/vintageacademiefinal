import { NextResponse } from "next/server";
import { supabaseServiceClient } from "@/lib/supabase/service-client";

// GET /api/expression-ecrite/tasks/[id]/documents
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;

    // UUID validation
    const isUuid = /^[0-9a-fA-F-]{36}$/.test(id);
    if (!isUuid) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const { data, error } = await supabaseServiceClient
      .from("expression_ecrite_documents")
      .select("id, task_id, document_number, title, content, source, document_type")
      .eq("task_id", id)
      .order("document_number", { ascending: true });

    if (error) {
      console.error("[api/expression-ecrite/tasks/:id/documents] Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ documents: data || [] }, { status: 200 });
  } catch (e: any) {
    console.error("[api/expression-ecrite/tasks/:id/documents] Handler error:", e);
    return NextResponse.json({ error: e?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
