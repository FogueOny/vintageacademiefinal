'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';

export default function TestSupabase() {
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [envStatus, setEnvStatus] = useState({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'défini' : 'non défini',
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'défini' : 'non défini',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabaseClient = getSupabaseBrowser();
        
        // Test simple de récupération de données
        const { data, error } = await supabaseClient
          .from('modules')
          .select('*');

        if (error) throw error;
        
        setModules(data || []);
      } catch (err: any) {
        setError(err.message || 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const testDirectFetch = async () => {
    setLoading(true);
    try {
      const supabaseClient = getSupabaseBrowser();
      
      const { data, error } = await supabaseClient
        .from('modules')
        .select('*')
        .eq('type_module', 'tcf');

      if (error) throw error;
      
      setModules(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
      setModules([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test de connexion Supabase</h1>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Statut des variables d'environnement</h2>
        <p>NEXT_PUBLIC_SUPABASE_URL: {envStatus.url}</p>
        <p>NEXT_PUBLIC_SUPABASE_ANON_KEY: {envStatus.key}</p>
      </div>

      <button 
        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg mb-6"
        onClick={testDirectFetch}
      >
        Tester une récupération directe avec filtrage sur 'tcf'
      </button>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Résultat</h2>
        
        {loading ? (
          <p>Chargement en cours...</p>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-300 rounded-lg text-red-700">
            <p>Erreur: {error}</p>
          </div>
        ) : (
          <div>
            <p className="mb-2">Modules trouvés: {modules.length}</p>
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">ID</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Nom</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Type Module</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Description</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {modules.map(module => (
                    <tr key={module.id}>
                      <td className="px-4 py-2 text-sm text-gray-500">{module.id.substring(0, 8)}...</td>
                      <td className="px-4 py-2 text-sm">{module.name}</td>
                      <td className="px-4 py-2 text-sm">{module.type_module}</td>
                      <td className="px-4 py-2 text-sm">{module.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Données brutes</h2>
        <pre className="text-xs bg-gray-100 p-4 rounded-lg overflow-auto max-h-80">
          {JSON.stringify(modules, null, 2)}
        </pre>
      </div>
    </div>
  );
}
