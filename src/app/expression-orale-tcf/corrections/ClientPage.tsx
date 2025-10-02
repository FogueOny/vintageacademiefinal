"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ChevronRight, ClipboardList, CalendarDays, Layers } from "lucide-react";
import { useSupabase } from "@/hooks/use-supabase";

// Types aligned with SQL schema
export type ExpressionOralePeriod = {
  id: string;
  month: number;
  year: number;
  slug: string;
  title: string;
  description: string | null;
};

export type ExpressionOraleTask = {
  id: string;
  period_id: string | null;
  task_number: 2 | 3; // check constraint
  title: string;
  description: string | null;
  instructions: string | null;
  total_subjects: number | null;
};

export type ExpressionOraleCorrection = {
  id: string;
  period_id: string;
  task_id: string;
  partie_number: number;
  subject_content: string;
  correction_title: string | null;
  correction_content: string; // required
  is_active: boolean | null;
};
// Helpers
const uniq = <T, K extends keyof any>(arr: T[], by: (x: T) => K) => {
  const m = new Map<K, T>();
  for (const item of arr) m.set(by(item), item);
  return Array.from(m.values());
};
const truncate = (text: string, max = 220) => {
  if (!text) return "";
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return normalized.slice(0, max).trimEnd() + "…";
};

export default function CorrectionsClientPage() {
  const supabase = useSupabase();
  const [selectedTask, setSelectedTask] = useState<"2" | "3" | "">("");
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [loading, setLoading] = useState<{ periods: boolean; tasks: boolean; corrections: boolean }>({ periods: true, tasks: false, corrections: false });
  const [error, setError] = useState<string>("");

  const [periods, setPeriods] = useState<ExpressionOralePeriod[]>([]);
  const [tasks, setTasks] = useState<ExpressionOraleTask[]>([]);
  const [corrections, setCorrections] = useState<ExpressionOraleCorrection[]>([]);

  // Load available periods from corrections -> distinct period_ids -> fetch periods
  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading((s) => ({ ...s, periods: true }));
      setError("");
      try {
        const { data: corrIds, error: corrErr } = await supabase
          .from("expression_orale_corrections")
          .select("period_id")
          .neq("is_active", false);
        if (corrErr) throw corrErr;

        const distinctIds = Array.from(new Set((corrIds ?? []).map((r: any) => r.period_id))).filter(Boolean);
        if (distinctIds.length === 0) {
          if (isMounted) setPeriods([]);
        } else {
          const { data: per, error: perErr } = await supabase
            .from("expression_orale_periods")
            .select("id, month, year, slug, title, description")
            .in("id", distinctIds);
          if (perErr) throw perErr;
          const typedPeriods = (per ?? []) as ExpressionOralePeriod[];
          const sorted = typedPeriods.sort((a: ExpressionOralePeriod, b: ExpressionOralePeriod) =>
            a.year === b.year ? b.month - a.month : b.year - a.year
          );
          if (isMounted) setPeriods(sorted);
        }
      } catch (e: any) {
        console.error(e);
        if (isMounted) setError(e.message ?? "Erreur de chargement des périodes");
      } finally {
        if (isMounted) setLoading((s) => ({ ...s, periods: false }));
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [supabase]);

  // Load tasks available for selected period from corrections
  useEffect(() => {
    let isMounted = true;
    if (!selectedPeriodId) {
      setTasks([]);
      return () => { isMounted = false; };
    }
    (async () => {
      setLoading((s) => ({ ...s, tasks: true }));
      setError("");
      try {
        const { data: corrTaskIds, error: corrErr } = await supabase
          .from("expression_orale_corrections")
          .select("task_id")
          .eq("period_id", selectedPeriodId)
          .neq("is_active", false);
        if (corrErr) throw corrErr;
        const distinctTaskIds = Array.from(new Set((corrTaskIds ?? []).map((r: any) => r.task_id))).filter(Boolean);
        if (distinctTaskIds.length === 0) {
          if (isMounted) setTasks([]);
        } else {
          const { data: tks, error: tErr } = await supabase
            .from("expression_orale_tasks")
            .select("id, period_id, task_number, title, description, instructions, total_subjects")
            .in("id", distinctTaskIds);
          if (tErr) throw tErr;
          const typed = (tks ?? []) as ExpressionOraleTask[];
          const filteredBySelected = selectedTask ? typed.filter((t) => String(t.task_number) === selectedTask) : typed;
          if (isMounted) setTasks(uniq(filteredBySelected, (t) => t.id));
        }
      } catch (e: any) {
        console.error(e);
        if (isMounted) setError(e.message ?? "Erreur de chargement des tâches");
      } finally {
        if (isMounted) setLoading((s) => ({ ...s, tasks: false }));
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [supabase, selectedPeriodId, selectedTask]);

  const currentTaskId = useMemo(() => {
    if (!selectedTask) return "";
    return tasks.find((t) => String(t.task_number) === selectedTask)?.id || "";
  }, [tasks, selectedTask]);

  // Load corrections for selected period + task from corrections table
  useEffect(() => {
    let isMounted = true;
    if (!selectedPeriodId || !currentTaskId) {
      setCorrections([]);
      return () => { isMounted = false; };
    }
    (async () => {
      setLoading((s) => ({ ...s, corrections: true }));
      setError("");
      try {
        const { data: cors, error: cErr } = await supabase
          .from("expression_orale_corrections")
          .select("id, period_id, task_id, partie_number, subject_content, correction_title, correction_content, is_active")
          .eq("period_id", selectedPeriodId)
          .eq("task_id", currentTaskId)
          .neq("is_active", false)
          .order("partie_number", { ascending: true })
          .order("id", { ascending: true });
        if (cErr) throw cErr;
        if (isMounted) setCorrections((cors ?? []) as ExpressionOraleCorrection[]);
      } catch (e: any) {
        console.error(e);
        if (isMounted) setError(e.message ?? "Erreur de chargement des corrections");
      } finally {
        if (isMounted) setLoading((s) => ({ ...s, corrections: false }));
      }
    })();
    return () => { isMounted = false; };
  }, [supabase, selectedPeriodId, currentTaskId]);

  const periodsByNewest = useMemo(
    () =>
      [...(periods as ExpressionOralePeriod[])].sort(
        (a: ExpressionOralePeriod, b: ExpressionOralePeriod) =>
          a.year === b.year ? b.month - a.month : b.year - a.year
      ),
    [periods]
  );

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-amber-400 bg-clip-text text-transparent">
            Corrections — Expression Orale TCF
          </h1>
          <p className="text-muted-foreground mt-1">
            Choisissez d'abord la tâche, puis la période. Les corrections s'affichent automatiquement.
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">Beta</Badge>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" /> Sélection
          </CardTitle>
          <CardDescription>Filtrez par tâche, puis par période (mois/année).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <Select value={selectedTask} onValueChange={(v) => setSelectedTask(v as "2" | "3")}> 
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisir la tâche" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Tâche</SelectLabel>
                  <SelectItem value="2">Tâche 2 — Interaction</SelectItem>
                  <SelectItem value="3">Tâche 3 — Point de vue</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId} disabled={!selectedTask || loading.periods}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={!selectedTask ? "Sélectionnez d'abord une tâche" : loading.periods ? "Chargement des périodes..." : "Choisir une période"} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Période</SelectLabel>
                  {periodsByNewest.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title} ({String(p.month).padStart(2, "0")}/{p.year})
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            {selectedPeriodId ? (
              <span>
                {periodsByNewest.find((p) => p.id === selectedPeriodId)?.title}
              </span>
            ) : (
              <span>Aucune période sélectionnée</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-6">
        {loading.corrections ? (
          <div className="text-sm text-muted-foreground">Chargement des corrections…</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : corrections.length === 0 ? (
          <div className="text-sm text-muted-foreground">Aucune correction trouvée pour cette sélection.</div>
        ) : (
          corrections.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" /> Partie {c.partie_number}
                </CardTitle>
                <CardDescription>{c.correction_title || "Correction"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-1">Sujet</h4>
                  <p className="text-sm whitespace-pre-line">{c.subject_content}</p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-1">Correction</h4>
                  <p className="text-sm whitespace-pre-line">{truncate(c.correction_content, 1200)}</p>
                </div>
                <div>
                  <Button asChild variant="outline" className="gap-1">
                    <Link href={`/expression-orale-tcf/corrections/${c.id}`}>
                      Voir le détail <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
