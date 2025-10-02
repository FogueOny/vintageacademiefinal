"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Doc { id: string; document_number: number; title: string; content: string }
interface Task {
  id: string;
  task_number: number;
  title: string;
  description?: string | null;
  instructions?: string | null;
  word_count_min: number;
  word_count_max: number;
  task_type: string;
  documents?: Doc[];
}
interface ExamDetail {
  id: string;
  title: string;
  created_at: string;
  period?: { id: string; title: string; month: number; year: number; slug: string } | null;
  tasks: Task[];
}

export default function ExamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "";
  const [data, setData] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/simulator/exams/${encodeURIComponent(id)}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Erreur de chargement");
        setData(json?.data || null);
      } catch (e: any) {
        setError(e?.message || "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleStart = async () => {
    if (!id) return;
    setStarting(true);
    setStartError(null);
    try {
      const res = await fetch('/api/simulator/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ combination_id: id })
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 402) {
          throw new Error("Crédits insuffisants. Rechargez ou contactez l'admin.");
        }
        throw new Error(json?.error || "Impossible de démarrer la tentative");
      }
      const attemptId = json?.data?.id;
      if (attemptId) {
        router.push(`/simulateur/attempts/${attemptId}`);
      }
    } catch (e: any) {
      setStartError(e?.message || 'Erreur démarrage');
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="text-gray-600">Chargement des détails…</div>
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

  return (
    <div className="container mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{data.title}</h1>
          {data.period && (
            <div className="text-sm text-gray-600 mt-1">{data.period.title}</div>
          )}
        </div>
        <button
          onClick={handleStart}
          disabled={starting}
          className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded disabled:opacity-60"
        >
          {starting ? 'Démarrage…' : 'Commencer l\'examen (1 crédit)'}
        </button>
      </div>

      {startError && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{startError}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {data.tasks.map((t) => (
          <div key={t.id} className="border rounded-lg p-5 bg-white">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-lg">T{t.task_number} · {t.title}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{t.word_count_min}–{t.word_count_max} mots</span>
            </div>
            {t.description && <p className="text-gray-700 text-sm mb-2 whitespace-pre-line">{t.description}</p>}
            {t.instructions && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-gray-800">Instructions</summary>
                <div className="text-sm text-gray-700 whitespace-pre-line mt-1">{t.instructions}</div>
              </details>
            )}
            {Array.isArray(t.documents) && t.documents.length > 0 && (
              <div className="mt-3">
                <div className="text-sm font-medium mb-2">Documents</div>
                <div className="space-y-2">
                  {t.documents.map((d) => (
                    <div key={d.id} className="p-3 rounded border bg-orange-50">
                      <div className="text-sm font-semibold">Document {d.document_number}: {d.title}</div>
                      <div className="text-sm text-gray-800 whitespace-pre-line mt-1">{d.content}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
