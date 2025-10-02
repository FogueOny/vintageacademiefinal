"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function ModulesTestsPreviewPage() {
  const [modules, setModules] = useState<any[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [tests, setTests] = useState<{ gratuits: any[]; payants: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger la liste des modules au chargement
  useEffect(() => {
    fetch("/api/admin/modules-and-tests")
      .then((res) => res.json())
      .then((data) => setModules(data.modules || []));
  }, []);

  // Charger les tests quand un module est sélectionné
  useEffect(() => {
    if (!selectedSlug) return;
    setLoading(true);
    setError(null);
    setTests(null);
    fetch(`/api/admin/modules-and-tests?slug=${selectedSlug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setTests({ gratuits: data.gratuits, payants: data.payants });
      })
      .catch((e) => setError("Erreur lors du chargement des tests."))
      .finally(() => setLoading(false));
  }, [selectedSlug]);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Aperçu des modules et tests</h1>
      <div className="mb-6">
        <label className="block mb-2 font-medium">Sélectionnez un module :</label>
        <select
          className="border rounded px-3 py-2"
          value={selectedSlug}
          onChange={(e) => setSelectedSlug(e.target.value)}
        >
          <option value="">-- Choisir un module --</option>
          {modules.map((mod) => (
            <option key={mod.id} value={mod.slug}>
              {mod.name} ({mod.slug})
            </option>
          ))}
        </select>
      </div>
      {loading && <div>Chargement des tests...</div>}
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {tests && (
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-semibold mb-2">Tests gratuits</h2>
            <table className="w-full border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1">Nom</th>
                  <th className="border px-2 py-1">Slug</th>
                  <th className="border px-2 py-1">Durée</th>
                  <th className="border px-2 py-1">Description</th>
                </tr>
              </thead>
              <tbody>
                {tests.gratuits.length === 0 ? (
                  <tr><td colSpan={4} className="text-center text-gray-400">Aucun test gratuit</td></tr>
                ) : (
                  tests.gratuits.map((t) => (
                    <tr key={t.id}>
                      <td className="border px-2 py-1">{t.name}</td>
                      <td className="border px-2 py-1">{t.slug}</td>
                      <td className="border px-2 py-1">{Math.floor(t.time_limit/60)} min</td>
                      <td className="border px-2 py-1">{t.description}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">Tests payants</h2>
            <table className="w-full border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1">Nom</th>
                  <th className="border px-2 py-1">Slug</th>
                  <th className="border px-2 py-1">Durée</th>
                  <th className="border px-2 py-1">Description</th>
                </tr>
              </thead>
              <tbody>
                {tests.payants.length === 0 ? (
                  <tr><td colSpan={4} className="text-center text-gray-400">Aucun test payant</td></tr>
                ) : (
                  tests.payants.map((t) => (
                    <tr key={t.id}>
                      <td className="border px-2 py-1">{t.name}</td>
                      <td className="border px-2 py-1">{t.slug}</td>
                      <td className="border px-2 py-1">{Math.floor(t.time_limit/60)} min</td>
                      <td className="border px-2 py-1">{t.description}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 