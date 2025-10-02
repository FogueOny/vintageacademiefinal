"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ExamCard {
  id: string;
  title: string;
  created_at: string;
  period?: { id: string; title: string; month: number; year: number; slug: string } | null;
  tasks: Array<{ id: string; task_number: number; title: string; word_count_min: number; word_count_max: number; task_type: string }>;
}

export default function ExamCataloguePage() {
  const [items, setItems] = useState<ExamCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/simulator/exams?page=1&pageSize=12`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Erreur de chargement");
        setItems(json?.data || []);
      } catch (e: any) {
        setError(e?.message || "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="text-gray-600">Chargement du catalogue…</div>
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
    <div className="container mx-auto px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Examens d'Entraînement</h1>
        <Link href="/simulateur" className="text-sm underline">← Retour</Link>
      </div>

      {items.length === 0 ? (
        <div className="text-gray-600">Aucune combinaison active.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((c) => (
            <div key={c.id} className="bg-white border rounded-lg p-5 hover:shadow-md transition">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">{c.title}</h3>
                {c.period && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">{c.period.title}</span>
                )}
              </div>
              <ul className="text-sm text-gray-700 space-y-1 mb-4">
                {c.tasks.slice(0,3).map(t => (
                  <li key={t.id}>
                    T{t.task_number} · {t.word_count_min}–{t.word_count_max} mots · {t.title}
                  </li>
                ))}
              </ul>
              <Link href={`/simulateur/examens/${c.id}`} className="inline-block bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded text-sm">Voir les détails</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
