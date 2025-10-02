"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TASK_INFO: Record<number, { title: string; desc: string; limit: string; time: string }> = {
  1: { title: "Tâche 1 — Correspondance", desc: "60–120 mots (courriel, message)", limit: "120 mots max", time: "10 min" },
  2: { title: "Tâche 2 — Narration", desc: "120–150 mots (blog, article)", limit: "150 mots max", time: "20 min" },
  3: { title: "Tâche 3 — Argumentation", desc: "120–180 mots (avec documents)", limit: "180 mots max", time: "30 min" },
};

export default function ChoisirTachePage() {
  const router = useRouter();

  const go = (n: number) => router.push(`/expression-ecrite-tcf/repondre/choisir-sujet?task=${n}`);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-amber-400 bg-clip-text text-transparent">
          Choisir le type de tâche
        </h1>
        <p className="text-muted-foreground mt-1">Étape 1/3 — Sélectionnez la tâche pour filtrer les sujets.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <Card key={n} className="hover:shadow-lg transition">
            <CardHeader>
              <CardTitle>{TASK_INFO[n].title}</CardTitle>
              <CardDescription>{TASK_INFO[n].desc}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">{TASK_INFO[n].limit} • {TASK_INFO[n].time}</div>
              <Button onClick={() => go(n)}>Choisir</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
