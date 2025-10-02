"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export default function SimulateurHubPage() {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const supabase = getSupabaseBrowser();
        const { data: session } = await supabase.auth.getUser();
        const user = session?.user;
        if (!user) return;
        const { data } = await supabase
          .from('user_credits')
          .select('balance')
          .eq('user_id', user.id)
          .maybeSingle();
        setCredits(typeof data?.balance === 'number' ? data.balance : 0);
      } catch {
        setCredits(0);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="container mx-auto px-4 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Simulateur — Expression Écrite</h1>
        <div className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm">
          <span className="text-gray-700">Crédits</span>
          <span className="rounded-full bg-orange-600 text-white px-2 py-0.5 text-xs">{loading ? '…' : (credits ?? 0)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6 bg-white">
          <h2 className="text-xl font-semibold mb-2">Examens d'Entraînement</h2>
          <p className="text-gray-600 mb-4">Parcourez les combinaisons par période et démarrez une simulation (consomme 1 crédit).</p>
          <Link href="/simulateur/examens" className="inline-block bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded">Parcourir les examens →</Link>
        </div>
        <div className="border rounded-lg p-6 bg-white">
          <h2 className="text-xl font-semibold mb-2">Vos Soumissions</h2>
          <p className="text-gray-600 mb-4">Consultez vos tentatives passées, leurs statuts et les retours IA.</p>
          <Link href="/simulateur/soumissions" className="inline-block border px-4 py-2 rounded hover:bg-gray-50">Voir les soumissions →</Link>
        </div>
      </div>
    </div>
  );
}