"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AttemptHeader } from "./components/AttemptHeader";
import { AttemptDetails } from "./components/AttemptDetails";

type Attempt = {
  id: string;
  combination_id: string;
  status: "in_progress" | "submitted" | "graded";
  started_at?: string | null;
  submitted_at?: string | null;
  duration_seconds?: number | null;
};

type Evaluation = {
  task_number: number | null;
  score_20?: number | null;
  cecr_level?: string | null;
  positives?: string[] | null;
  improvements?: string[] | null;
  suggested_correction?: string | null;
};

export default function SubmissionsPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openId, setOpenId] = useState<string | null>(null);
  const [detailsLoading, setDetailsLoading] = useState<Record<string, boolean>>({});
  const [detailsMap, setDetailsMap] = useState<
    Record<string, { tasks: any[]; answers: { task_number: number; content: string; word_count?: number }[] }>
  >({});

  // OpenAI health (minimal)
  const [openaiHealth, setOpenaiHealth] = useState<{ model?: string; hasKey?: boolean } | null>(null);
  // Per-task IA results (inline)
  const [aiTaskResults, setAiTaskResults] = useState<Record<string, Evaluation>>({});
  const [aiTaskLoading, setAiTaskLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/simulator/attempts");
        if (res.status === 401) {
          setError("Vous devez être connecté pour voir vos soumissions.");
          return;
        }
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Erreur chargement");
        setAttempts(json?.data || []);
      } catch (e: any) {
        setError(e?.message || "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleOpen = async (id: string) => {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    setDetailsLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/simulator/attempts/${encodeURIComponent(id)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Erreur détails");

      const tasks = Array.isArray(json?.data?.tasks) ? json.data.tasks : [];
      const answers = Array.isArray(json?.data?.answers) ? json.data.answers : [];
      setDetailsMap((prev) => ({ ...prev, [id]: { tasks, answers } }));

      // Minimal OpenAI health
      try {
        const h = await fetch("/api/simulator/health");
        const hj = await h.json();
        if (h.ok) setOpenaiHealth({ model: hj?.model, hasKey: hj?.hasKey });
      } catch {}
    } catch (e: any) {
      toast.error(e?.message || "Erreur chargement détails");
    } finally {
      setDetailsLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const evalTaskWithOpenAI = async (attemptId: string, task_number: number) => {
    const det = detailsMap[attemptId];
    if (!det) return;
    const t = det.tasks.find((x: any) => x.task_number === task_number);
    const ans = det.answers.find((x: any) => x.task_number === task_number);
    if (!t || !ans?.content) {
      toast.error("Données insuffisantes pour cette tâche");
      return;
    }

    const key = `${attemptId}:${task_number}`;
    setAiTaskLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const r = await fetch("/api/simulator/evaluate-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          task_number,
          task: {
            title: t.title,
            instructions: t.instructions,
            description: t.description,
            documents: t.documents || [],
          },
          answer: { content: ans.content, word_count: ans.word_count },
        }),
      });
      let j: any = null;
      const ct = r.headers.get('content-type') || '';
      if (ct.includes('application/json')) j = await r.json();
      else { const txt = await r.text(); toast.error(`HTTP ${r.status}: ${txt.slice(0,120)}…`); return; }
      if (!r.ok) { toast.error(j?.error || `Échec OpenAI (HTTP ${r.status})`); return; }
      
      const ev: Evaluation = j.evaluation;
      setAiTaskResults((prev) => ({ ...prev, [key]: ev }));
    } catch (e: any) {
      toast.error(e?.message || "Erreur OpenAI");
    } finally {
      setAiTaskLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const formatDate = (s?: string | null) => {
    if (!s) return "—";
    const d = new Date(s);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString("fr-FR");
    };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="text-gray-600">Chargement des soumissions…</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="rounded border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Vos Soumissions</h1>
        <Link href="/simulateur" className="text-sm underline">
          ← Retour
        </Link>
      </div>

      {attempts.length === 0 ? (
        <div className="text-gray-600">Aucune soumission pour le moment.</div>
      ) : (
        <div className="space-y-4">
          {attempts.map((a) => (
            <div key={a.id} className="border rounded-lg bg-white">
              <AttemptHeader
                attemptShortId={a.id.slice(0, 8)}
                status={a.status as any}
                startedAtLabel={formatDate(a.started_at)}
                submittedAtLabel={formatDate(a.submitted_at)}
                durationMinutes={Math.max(0, Math.floor((a.duration_seconds || 0) / 60))}
                isOpen={openId === a.id}
                onToggle={() => toggleOpen(a.id)}
                linkHref={`/simulateur/attempts/${a.id}`}
              />

              {openId === a.id && (
                <AttemptDetails
                  openaiHealth={openaiHealth}
                  loading={Boolean(detailsLoading[a.id])}
                  tasks={detailsMap[a.id]?.tasks || []}
                  answers={detailsMap[a.id]?.answers || []}
                  attemptId={a.id}
                  aiTaskResults={aiTaskResults}
                  aiTaskLoading={aiTaskLoading}
                  onEvalTask={evalTaskWithOpenAI}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}