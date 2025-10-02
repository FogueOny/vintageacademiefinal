"use client";

// Disable prerender/SSG to avoid running browser-only code at build time
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSupabase } from "@/hooks/use-supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CalendarDays, ClipboardList, Layers } from "lucide-react";
import { MONTHS } from "@/types/expression-orale";

export type ExpressionOralePeriod = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  month: number;
  year: number;
};

export type ExpressionOraleTask = {
  id: string;
  task_number: number; // 2 or 3
  title: string | null;
};

export type ExpressionOraleSubject = {
  id: string;
  period_id: string | null;
  task_id: string | null;
  partie_number: number; // 1..12
  subject_number: number; // 1..n per partie
  content: string; // required
  question: string | null;
  is_active: boolean | null;
};

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

export default function ExpressionOraleSujetsPage() {
  const supabase = useSupabase();

  const [periods, setPeriods] = useState<ExpressionOralePeriod[]>([]);
  const [tasks, setTasks] = useState<ExpressionOraleTask[]>([]);
  const [subjects, setSubjects] = useState<ExpressionOraleSubject[]>([]);
  const [selectedTask, setSelectedTask] = useState<number>(2);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [loading, setLoading] = useState({ periods: false, tasks: false, subjects: false });
  const [error, setError] = useState<string | null>(null);

  // Load available periods from subjects (source of truth), filtered by selected task
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading((s) => ({ ...s, periods: true }));
        setError(null);

        // resolve task id by task_number (if tasks are loaded)
        const task = tasks.find((t) => t.task_number === selectedTask);

        const query = supabase
          .from("expression_orale_subjects")
          .select("period_id")
          .neq("is_active", false)
          .not("period_id", "is", null);
        const { data: base, error: baseErr } = task
          ? await query.eq("task_id", task.id)
          : await query;
        if (baseErr) throw baseErr;
        const distinctIds = uniq(base ?? [], (x: any) => x.period_id).map((x: any) => x.period_id as string);

        if (distinctIds.length) {
          const { data: per, error: perErr } = await supabase
            .from("expression_orale_periods")
            .select("id, slug, title, description, month, year")
            .in("id", distinctIds);
          if (perErr) throw perErr;
          const typed = (per ?? []) as ExpressionOralePeriod[];
          const sorted = typed.sort((a, b) => (a.year === b.year ? b.month - a.month : b.year - a.year));
          if (mounted) {
            setPeriods(sorted);
            if (sorted.length) {
              // keep current selection if still available, else default to first available
              const currentOk = selectedPeriodId ? distinctIds.includes(selectedPeriodId) : false;
              if (!currentOk) setSelectedPeriodId(sorted[0].id);
            }
          }
        } else {
          if (mounted) setPeriods([]);
        }
      } catch (e: any) {
        console.error(e);
        if (mounted) setError(e.message ?? "Erreur de chargement des périodes");
      } finally {
        if (mounted) setLoading((s) => ({ ...s, periods: false }));
      }
    })();
    return () => {
      mounted = false;
    };
  }, [supabase, selectedTask, tasks]);

  // Load tasks available for selected period from subjects
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!selectedPeriodId) return;
      try {
        setLoading((s) => ({ ...s, tasks: true }));
        setError(null);
        const { data: base, error: baseErr } = await supabase
          .from("expression_orale_subjects")
          .select("task_id")
          .eq("period_id", selectedPeriodId)
          .neq("is_active", false)
          .not("task_id", "is", null);
        if (baseErr) throw baseErr;
        const distinctTaskIds = uniq(base ?? [], (x: any) => x.task_id).map((x: any) => x.task_id as string);
        if (distinctTaskIds.length) {
          const { data: tks, error: tErr } = await supabase
            .from("expression_orale_tasks")
            .select("id, task_number, title")
            .in("id", distinctTaskIds);
          if (tErr) throw tErr;
          const typed = (tks ?? []) as ExpressionOraleTask[];
          const sorted = typed.sort((a, b) => a.task_number - b.task_number);
          if (mounted) setTasks(sorted);
          // If current selectedTask is not present, choose a sensible default
          const currentExists = sorted.some((t) => t.task_number === selectedTask);
          if (mounted && !currentExists) {
            const preferred = sorted.find((t) => t.task_number === 2) ?? sorted[0];
            if (preferred) setSelectedTask(preferred.task_number);
          }
        } else {
          if (mounted) setTasks([]);
        }
      } catch (e: any) {
        console.error(e);
        if (mounted) setError(e.message ?? "Erreur de chargement des tâches");
      } finally {
        if (mounted) setLoading((s) => ({ ...s, tasks: false }));
      }
    })();
    return () => {
      mounted = false;
    };
  }, [supabase, selectedPeriodId]);

  // Load subjects for selected period + task
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!selectedPeriodId || !selectedTask) return;
      try {
        setLoading((s) => ({ ...s, subjects: true }));
        setError(null);

        // resolve task id by task_number
        const task = tasks.find((t) => t.task_number === selectedTask);
        if (!task) {
          if (mounted) setSubjects([]);
          return;
        }

        const { data: subs, error: sErr } = await supabase
          .from("expression_orale_subjects")
          .select("id, period_id, task_id, partie_number, subject_number, content, question, is_active")
          .eq("period_id", selectedPeriodId)
          .eq("task_id", task.id)
          .neq("is_active", false)
          .order("partie_number", { ascending: true })
          .order("subject_number", { ascending: true });
        if (sErr) throw sErr;
        if (mounted) setSubjects((subs ?? []) as ExpressionOraleSubject[]);
      } catch (e: any) {
        console.error(e);
        if (mounted) setError(e.message ?? "Erreur de chargement des sujets");
      } finally {
        if (mounted) setLoading((s) => ({ ...s, subjects: false }));
      }
    })();
    return () => {
      mounted = false;
    };
  }, [supabase, selectedPeriodId, selectedTask, tasks]);

  const periodsByNewest = useMemo(
    () =>
      [...(periods as ExpressionOralePeriod[])].sort((a, b) =>
        a.year === b.year ? b.month - a.month : b.year - a.year
      ),
    [periods]
  );

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-amber-400 bg-clip-text text-transparent">
          Sujets d'Expression Orale
        </h1>
        <p className="text-muted-foreground mt-1">
          Filtrez par tâche et période pour voir les sujets correspondants.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <CardDescription>Sélectionnez une tâche et une période</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-1">
              <Label className="mb-2 block">Tâche</Label>
              <RadioGroup
                className="flex gap-4"
                value={String(selectedTask)}
                onValueChange={(v) => setSelectedTask(parseInt(v, 10))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem id="task2" value="2" />
                  <Label htmlFor="task2">Tâche 2</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem id="task3" value="3" />
                  <Label htmlFor="task3">Tâche 3</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="md:col-span-2">
              <Label className="mb-2 block">Période</Label>
              <Select value={selectedPeriodId ?? undefined} onValueChange={setSelectedPeriodId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une période" />
                </SelectTrigger>
                <SelectContent>
                  {periodsByNewest.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {MONTHS[p.month - 1]} {p.year} — {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="mb-6 text-sm text-red-600">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {loading.subjects ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">Chargement des sujets…</CardContent>
          </Card>
        ) : subjects.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Aucun sujet pour cette combinaison.
            </CardContent>
          </Card>
        ) : (
          // Group by partie_number and render with headings
          subjects.reduce<{ lastPartie: number | null; nodes: ReactNode[] }>((acc, s, idx) => {
            const headerNeeded = acc.lastPartie !== s.partie_number;
            if (headerNeeded) {
              acc.nodes.push(
                <div key={`partie-${s.partie_number}`} className="mt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-lg font-semibold">Partie {s.partie_number}</h2>
                  </div>
                  <Separator className="mb-2" />
                </div>
              );
            }
            acc.nodes.push(
              <Card key={s.id} className="border-t-2 border-t-primary/60">
                <CardHeader>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <ClipboardList className="h-4 w-4" /> Sujet {s.subject_number}
                  </div>
                  {s.question && (
                    <CardTitle className="mt-1 text-base">{truncate(s.question, 160)}</CardTitle>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border bg-card p-4">
                    <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Énoncé</h3>
                    <p className="leading-relaxed whitespace-pre-line" title={s.content}>
                      {truncate(s.content, 260)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
            acc.lastPartie = s.partie_number;
            return acc;
          }, { lastPartie: null, nodes: [] }).nodes
        )}
      </div>
    </div>
  );
}
