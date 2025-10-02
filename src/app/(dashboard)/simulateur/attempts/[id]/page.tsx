"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";

function WordCountBadge({ count, min, max }: { count: number; min: number; max: number }) {
  let label = '—';
  let cls = 'bg-gray-200 text-gray-800';
  if (typeof count === 'number' && typeof min === 'number' && typeof max === 'number') {
    if (count < min) {
      label = `Sous le minimum (${min})`;
      cls = 'bg-red-100 text-red-700';
    } else if (count > max) {
      label = `Au-dessus (${max})`;
      cls = 'bg-red-100 text-red-700';
    } else {
      label = 'OK';
      cls = 'bg-emerald-100 text-emerald-700';
    }
  }
  return <span className={`text-xs px-2 py-0.5 rounded ${cls}`}>{label}</span>;
}

type Evaluation = {
  task_number: number | null;
  score_20?: number | null;
  cecr_level?: string | null;
  positives?: string[] | null;
  improvements?: string[] | null;
  suggested_correction?: string | null;
  created_at?: string;
};

type Doc = { id: string; document_number: number; title: string; content: string };

type Task = {
  id: string;
  task_number: 1 | 2 | 3;
  title: string;
  description?: string | null;
  instructions?: string | null;
  word_count_min: number;
  word_count_max: number;
  task_type: string;
  documents?: Doc[];
};

type Answer = { task_number: 1 | 2 | 3; content: string; word_count: number };

type AttemptData = {
  attempt: {
    id: string;
    user_id: string;
    combination_id: string;
    status: "in_progress" | "submitted" | "graded";
    started_at?: string | null;
    submitted_at?: string | null;
    duration_seconds?: number | null;
  };
  tasks: Task[];
  answers: Answer[];
  evaluations: Evaluation[];
};

export default function AttemptPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = (params?.id as string) || "";

  const [data, setData] = useState<AttemptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTask, setActiveTask] = useState<1 | 2 | 3>(1);
  const [drafts, setDrafts] = useState<Record<1 | 2 | 3, string>>({ 1: "", 2: "", 3: "" });
  const [wordCounts, setWordCounts] = useState<Record<1 | 2 | 3, number>>({ 1: 0, 2: 0, 3: 0 });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Timer: 1h persistent
  const [remaining, setRemaining] = useState<number>(3600);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSubmittedRef = useRef(false);

  const deadlineKey = useMemo(() => `attempt_deadline_${attemptId}`, [attemptId]);

  // Fetch attempt data
  useEffect(() => {
    if (!attemptId) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/simulator/attempts/${encodeURIComponent(attemptId)}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Erreur chargement tentative");
        const payload = json?.data as AttemptData;
        // Ensure tasks are sorted T1..T3
        payload.tasks = [...(payload.tasks || [])].sort((a, b) => a.task_number - (b.task_number as number));
        setData(payload);

        // Initialize drafts from answers
        const initDrafts: Record<1 | 2 | 3, string> = { 1: "", 2: "", 3: "" };
        const initCounts: Record<1 | 2 | 3, number> = { 1: 0, 2: 0, 3: 0 };
        (payload.answers || []).forEach(a => {
          const tn = a.task_number as 1 | 2 | 3;
          initDrafts[tn] = a.content || "";
          initCounts[tn] = a.word_count || 0;
        });
        setDrafts(initDrafts);
        setWordCounts(initCounts);

        // Timer: set deadline if not present
        const now = Date.now();
        const existing = localStorage.getItem(deadlineKey);
        let deadline = existing ? Number(existing) : NaN;
        if (!existing || !Number.isFinite(deadline) || deadline <= now) {
          deadline = now + 3600 * 1000; // 1 hour
          localStorage.setItem(deadlineKey, String(deadline));
        }
        // Start ticking
        if (timerRef.current) clearInterval(timerRef.current);
        const tick = () => {
          const d = Number(localStorage.getItem(deadlineKey) || "0");
          const rem = Math.max(0, Math.floor((d - Date.now()) / 1000));
          setRemaining(rem);
        };
        tick();
        timerRef.current = setInterval(tick, 1000) as any;
      } catch (e: any) {
        setError(e?.message || "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [attemptId, deadlineKey]);

  // Disable all interactions when submitted or time is up
  const readOnly = useMemo(() => {
    if (!data) return false;
    if (data.attempt.status !== "in_progress") return true;
    return remaining <= 0;
  }, [data, remaining]);
  const locked = readOnly;

  // Debounced auto-save
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const scheduleSave = (tn: 1 | 2 | 3, content: string) => {
    if (!attemptId) return;
    if (locked) return; // Do not autosave when locked
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaving(true);
    setSaveError(null);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/simulator/attempts/${encodeURIComponent(attemptId)}/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task_number: tn, content })
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Échec sauvegarde");
        setWordCounts(prev => ({ ...prev, [tn]: Number(json?.word_count ?? 0) }));
        toast.success(`T${tn}: brouillon enregistré`);
      } catch (e: any) {
        setSaveError(e?.message || "Erreur de sauvegarde");
        toast.error(`T${tn}: ${e?.message || 'Erreur de sauvegarde'}`);
      } finally {
        setSaving(false);
      }
    }, 600);
  };

  const onChangeDraft = (tn: 1 | 2 | 3, val: string) => {
    setDrafts(prev => ({ ...prev, [tn]: val }));
    scheduleSave(tn, val);
  };

  const handleSubmit = async () => {
    if (!attemptId) return;
    if (autoSubmittedRef.current) return; // guard against duplicate calls
    setSubmitError(null);
    setSubmitLoading(true);
    try {
      const res = await fetch(`/api/simulator/attempts/${encodeURIComponent(attemptId)}/submit`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Soumission impossible");
      // Lock UI and show message
      setData(prev => prev ? { ...prev, attempt: { ...prev.attempt, status: "submitted" } } : prev);
      toast.success('Soumission envoyée. Évaluation en cours…');
      // Rediriger automatiquement vers les soumissions après un court délai
      setTimeout(() => {
        try { localStorage.setItem('last_submitted_attempt', attemptId); } catch {}
        try { router.push('/simulateur/soumissions'); } catch {}
      }, 1200);
    } catch (e: any) {
      setSubmitError(e?.message || "Erreur soumission");
      toast.error(e?.message || 'Erreur soumission');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Auto-submit when time runs out
  useEffect(() => {
    if (!data) return;
    if (data.attempt.status !== 'in_progress') return;
    if (remaining <= 0 && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      toast.info("Temps écoulé. Sauvegarde et soumission automatiques…");
      // Flush all drafts before submitting, regardless of lock state
      const flushAllDrafts = async () => {
        try {
          const tasks: Array<1|2|3> = [1,2,3];
          await Promise.allSettled(tasks.map(async (tn) => {
            const content = drafts[tn] || '';
            const res = await fetch(`/api/simulator/attempts/${encodeURIComponent(attemptId)}/answer`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ task_number: tn, content })
            });
            // Non-blocking: ignore individual failures
            return res.ok;
          }));
        } catch (_) {}
      };
      (async () => {
        await flushAllDrafts();
        await handleSubmit();
      })();
    }
  }, [remaining, data]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="text-gray-600">Chargement de la simulation…</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="rounded border border-red-200 bg-red-50 p-4 text-red-700">{error || 'Introuvable'}</div>
      </div>
    );
  }

  const taskOf = (tn: 1 | 2 | 3) => data.tasks.find(t => t.task_number === tn);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Prominent banner when locked */}
      {locked && (
        <div className="sticky top-0 z-50 mb-4">
          <div className="rounded-md border border-orange-300 bg-gradient-to-r from-orange-50 to-orange-100 p-4 text-orange-900 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-orange-500 animate-pulse" aria-hidden="true" />
              <div className="text-sm">
                <div className="font-semibold">
                  {data?.attempt.status === 'submitted' ? 'Examen soumis' : 'Temps écoulé'}
                </div>
                <div>
                  L’éditeur est verrouillé. {data?.attempt.status === 'submitted' ? "L’évaluation IA est en cours." : "Votre copie est en cours de soumission."}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Header with timer and submit */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Simulation — {data.attempt.id.slice(0,8)}</h1>
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded text-white ${remaining > 300 ? 'bg-emerald-600' : remaining > 0 ? 'bg-orange-600' : 'bg-red-600'}`}>
            {formatTime(remaining)}
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitLoading || readOnly}
            className="bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white px-4 py-2 rounded"
          >
            {readOnly ? 'Soumis / Verrouillé' : (submitLoading ? 'Soumission…' : 'Soumettre')}
          </button>
        </div>
      </div>

      {data?.attempt.status === 'submitted' && (
        <div className="rounded border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800 mb-4">
          Soumission envoyée. L'évaluation IA démarre en arrière-plan. Vous serez redirigé vers vos soumissions…
        </div>
      )}
      {submitError && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4">{submitError}</div>
      )}
      {saveError && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4">{saveError}</div>
      )}
      {saving && (
        <div className="text-xs text-gray-500 mb-2">Enregistrement…</div>
      )}

      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${locked ? 'pointer-events-none opacity-60' : ''}`} aria-disabled={locked}>
        {/* Left: tasks list */}
        <aside className="lg:col-span-3 border rounded p-4 bg-white">
          <div className="space-y-2">
            {[1,2,3].map((tn) => (
              <button
                key={tn}
                onClick={() => setActiveTask(tn as 1|2|3)}
                className={`w-full text-left px-3 py-2 rounded border ${activeTask === tn ? 'bg-orange-50 border-orange-200 text-orange-800' : 'hover:bg-gray-50'}`}
              >
                <div className="font-semibold">T{tn} {taskOf(tn as 1|2|3)?.title ? `· ${taskOf(tn as 1|2|3)?.title}` : ''}</div>
                <div className="text-xs text-gray-600">{wordCounts[tn as 1|2|3]} mots</div>
              </button>
            ))}
          </div>
        </aside>

        {/* Center: editor */}
        <main className="lg:col-span-6">
          <div className="border rounded p-4 bg-white">
            <div className="mb-2 flex items-center justify-between">
              <div className="font-semibold">Éditeur — T{activeTask}</div>
              <div className="flex items-center gap-2">
                <WordCountBadge
                  count={wordCounts[activeTask]}
                  min={taskOf(activeTask)?.word_count_min || 0}
                  max={taskOf(activeTask)?.word_count_max || 0}
                />
                <div className="text-sm text-gray-600">{wordCounts[activeTask]} mots</div>
              </div>
            </div>
            <textarea
              value={drafts[activeTask]}
              onChange={(e) => onChangeDraft(activeTask, e.target.value)}
              disabled={readOnly}
              className="w-full min-h-[320px] border rounded p-3 focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:bg-gray-50"
              placeholder="Écrivez votre réponse ici…"
            />
            <div className="text-xs text-gray-500 mt-2">Sauvegarde automatique activée (0.6s)</div>
          </div>
        </main>

        {/* Right: rules/instructions */}
        <aside className="lg:col-span-3 border rounded p-4 bg-white">
          <div className="space-y-3">
            <div>
              <div className="font-semibold mb-1">Consignes</div>
              <div className="text-sm text-gray-700 whitespace-pre-line">{taskOf(activeTask)?.description || '—'}</div>
            </div>
            <div>
              <div className="font-semibold mb-1">Instructions</div>
              <div className="text-sm text-gray-700 whitespace-pre-line">{taskOf(activeTask)?.instructions || '—'}</div>
            </div>
            <div>
              <div className="font-semibold mb-1">Limites de mots</div>
              <div className="text-sm text-gray-700">{taskOf(activeTask)?.word_count_min}–{taskOf(activeTask)?.word_count_max} mots</div>
            </div>
            {Array.isArray(taskOf(activeTask)?.documents) && (taskOf(activeTask)?.documents as Doc[]).length > 0 && (
              <div>
                <div className="font-semibold mb-1">Documents</div>
                <div className="space-y-2">
                  {(taskOf(activeTask)?.documents as Doc[])
                    .slice()
                    .sort((a, b) => a.document_number - b.document_number)
                    .map((d) => (
                      <div key={d.id} className="p-3 rounded border bg-orange-50">
                        <div className="text-sm font-semibold">Document {d.document_number}: {d.title}</div>
                        <div className="text-sm text-gray-800 whitespace-pre-line mt-1">{d.content}</div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
