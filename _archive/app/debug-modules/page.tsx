"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export default function DebugModulesPage() {
  const [modules, setModules] = useState<any[]>([]);
  const [testSeries, setTestSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = getSupabaseBrowser();
        
        // Récupérer tous les modules
        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select('*')
          .order('name');

        if (modulesError) {
          throw modulesError;
        }

        setModules(modulesData || []);

        // Récupérer toutes les séries de tests
        const { data: testSeriesData, error: testSeriesError } = await supabase
          .from('test_series')
          .select('*, modules(name, slug)')
          .order('name');

        if (testSeriesError) {
          throw testSeriesError;
        }

        setTestSeries(testSeriesData || []);

      } catch (err: any) {
        console.error('Erreur lors de la récupération des données:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-4">Debug Modules</h1>
        <div>Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-4">Debug Modules</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Erreur: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Debug Modules & Test Series</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Modules */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Modules ({modules.length})</h2>
          <div className="space-y-3">
            {modules.map((module) => (
              <div key={module.id} className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="font-medium">{module.name}</div>
                <div className="text-sm text-gray-600">Slug: <code className="bg-gray-100 px-1 rounded">{module.slug}</code></div>
                <div className="text-sm text-gray-600">ID: <code className="bg-gray-100 px-1 rounded">{module.id}</code></div>
                {module.description && (
                  <div className="text-sm text-gray-500 mt-1">{module.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Test Series */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Test Series ({testSeries.length})</h2>
          <div className="space-y-3">
            {testSeries.map((series) => (
              <div key={series.id} className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="font-medium">{series.name}</div>
                <div className="text-sm text-gray-600">
                  Slug: <code className="bg-gray-100 px-1 rounded">{series.slug}</code>
                </div>
                <div className="text-sm text-gray-600">
                  Module: <code className="bg-gray-100 px-1 rounded">{(series as any).modules?.slug || 'N/A'}</code>
                </div>
                <div className="text-sm text-gray-600">
                  Gratuit: <span className={series.is_free ? 'text-green-600' : 'text-red-600'}>
                    {series.is_free ? 'Oui' : 'Non'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">ID: <code className="bg-gray-100 px-1 rounded">{series.id}</code></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Liens de test */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold mb-2">Liens de test rapide:</h3>
        <div className="space-y-1">
          <div>
            <a href="/comprehension-orale" className="text-blue-600 hover:underline">
              /comprehension-orale
            </a>
          </div>
          <div>
            <a href="/comprehension-ecrite" className="text-blue-600 hover:underline">
              /comprehension-ecrite
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
