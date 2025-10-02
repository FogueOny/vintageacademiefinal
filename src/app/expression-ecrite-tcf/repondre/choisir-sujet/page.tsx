"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ETask { id: string; task_number: number; title: string | null; description: string | null }
interface EPeriod { id: string; month: number; year: number; slug: string; title: string | null }

const TASK_DURATIONS: Record<number, number> = { 1: 10, 2: 20, 3: 30 };

export default function ChoisirSujetPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-10">Chargement...</div>}>
      <ChoisirSujetInner />
    </Suspense>
  );
}

function ChoisirSujetInner() {
  const router = useRouter();
  const params = useSearchParams();
  const initialTaskNumber = Number(params.get("task")) || 1;
  const [taskNumber, setTaskNumber] = useState<number>(initialTaskNumber);
  const taskMinutes = TASK_DURATIONS[taskNumber] ?? 10;
  const [periods, setPeriods] = useState<EPeriod[]>([]);
  const [periodId, setPeriodId] = useState<string>("");

  const [tasks, setTasks] = useState<ETask[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Charger les périodes une seule fois
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/expression-ecrite/periods');
        if (!res.ok) throw new Error('Impossible de charger les périodes');
        const data = await res.json();
        if (mounted) setPeriods(data.periods || []);
      } catch (e: any) {
        console.error(e);
        if (mounted) setError(e.message ?? 'Erreur de chargement des périodes');
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Charger les sujets selon la tâche + période
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setError(null);
        const query = new URLSearchParams();
        query.set('task_number', String(taskNumber));
        if (periodId) query.set('period_id', periodId);
        const res = await fetch(`/api/expression-ecrite/tasks?${query.toString()}`);
        if (!res.ok) throw new Error("Impossible de charger les sujets");
        const data = await res.json();
        if (mounted) setTasks(data.tasks || []);
      } catch (e: any) {
        console.error(e);
        if (mounted) setError(e.message ?? "Erreur de chargement");
      }
    })();
    return () => { mounted = false; };
  }, [taskNumber, periodId]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return tasks;
    return tasks.filter(t => (t.title || "").toLowerCase().includes(qq) || (t.description || "").toLowerCase().includes(qq));
  }, [q, tasks]);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-amber-400 bg-clip-text text-transparent">
          Choisir un sujet — Tâche {taskNumber}
        </h1>
        <p className="text-muted-foreground mt-1">
          Étape 2/3 — Choisissez d'abord la tâche, puis la période, puis le sujet.
          <span className="ml-2 inline-block rounded-full bg-orange-50 text-orange-700 px-2 py-0.5 text-xs font-semibold">
            Durée: {taskMinutes} min
          </span>
        </p>
      </div>

      {/* Sélecteurs Tâche + Période */}
      <div className="grid gap-4 md:grid-cols-2 max-w-2xl mb-6">
        <div>
          <label className="text-sm font-medium">Tâche</label>
          <select
            className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
            value={taskNumber}
            onChange={(e) => setTaskNumber(Number(e.target.value) || 1)}
          >
            <option value={1}>Tâche 1</option>
            <option value={2}>Tâche 2</option>
            <option value={3}>Tâche 3</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Période</label>
          <select
            className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
            value={periodId}
            onChange={(e) => setPeriodId(e.target.value)}
          >
            <option value="">Toutes les périodes</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>{p.title || `${p.month}/${p.year}`}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-6 max-w-md">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un sujet..." />
      </div>

      {error && <div className="text-sm text-red-600 mb-4">{error}</div>}

      <div className="grid gap-6 md:grid-cols-2">
        {filtered.map((t) => (
          <Card key={t.id} className="hover:shadow-lg transition">
            <CardHeader>
              <CardTitle className="line-clamp-1">{t.title || `Tâche ${t.task_number}`}</CardTitle>
              <CardDescription className="line-clamp-2">{t.description || "Sans description"}</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end">
              <Button onClick={() => router.push(`/expression-ecrite-tcf/repondre/test/${t.id}`)}>Choisir ce sujet</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-sm text-muted-foreground">Aucun sujet trouvé pour cette tâche.</div>
      )}
    </div>
  );
}
