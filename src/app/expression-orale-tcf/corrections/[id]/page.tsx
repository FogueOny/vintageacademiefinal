import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

export const dynamic = "force-dynamic"; // ensure fresh data

async function getData(id: string) {
  const supabase = createServerComponentClient<Database>({ cookies });

  const { data: corr, error } = await supabase
    .from("expression_orale_corrections")
    .select("id, period_id, task_id, partie_number, subject_content, correction_title, correction_content, is_active, expression_orale_tasks(task_number, title), expression_orale_periods(title, month, year)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!corr || corr.is_active === false) return null;
  return corr as any;
}

export default async function CorrectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getData(id);
  if (!data) return notFound();

  const taskLabel = data.expression_orale_tasks?.task_number === 2 ? "Interaction" : "Point de vue";
  const periodTitle = data.expression_orale_periods ? `${data.expression_orale_periods.title}` : "Période";

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-amber-400 bg-clip-text text-transparent">
          Détail de la correction
        </h1>
        <p className="text-muted-foreground mt-1">{periodTitle} — {taskLabel}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Partie {data.partie_number}</CardTitle>
          {data.correction_title && (
            <CardDescription className="font-medium text-foreground/80">{data.correction_title}</CardDescription>
          )}
          <div className="flex gap-2 mt-2">
            <Badge variant="outline">{taskLabel}</Badge>
            <Badge variant="secondary">ID: {data.id.slice(0, 8)}…</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-md border bg-card p-4">
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Sujet</h3>
              <p className="leading-relaxed whitespace-pre-line">{data.subject_content}</p>
            </div>
            <div className="rounded-md border bg-card p-4">
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Correction</h3>
              <p className="leading-relaxed whitespace-pre-line">{data.correction_content}</p>
            </div>
          </div>
          <Separator className="my-6" />
          <div className="text-xs text-muted-foreground">
            Affichage lié à la période et à la tâche via la table des corrections.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
